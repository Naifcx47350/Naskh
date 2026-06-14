"""Launch the Naskh backend and frontend dev servers together.

Run from the repository root:

    python run_dev.py

The script uses the current Python interpreter for FastAPI, so activate the
`IntelStack` conda environment first when running locally.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"
RECOMMENDED_CONDA_ENV = "IntelStack"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Start Naskh backend and frontend dev servers.")
    parser.add_argument("--backend-port", type=int, default=8000, help="FastAPI port. Default: 8000")
    parser.add_argument("--frontend-port", type=int, default=5173, help="Vite port. Default: 5173")
    parser.add_argument("--host", default="127.0.0.1", help="Host for both dev servers. Default: 127.0.0.1")
    parser.add_argument("--no-browser", action="store_true", help="Do not open the browser automatically.")
    parser.add_argument(
        "--restart",
        action="store_true",
        default=True,
        help="Restart dev servers instead of reusing stale processes. Default: true",
    )
    parser.add_argument(
        "--no-restart",
        action="store_false",
        dest="restart",
        help="Reuse servers already listening on the configured ports.",
    )
    parser.add_argument(
        "--install",
        action="store_true",
        help="Install missing frontend/backend dependencies before starting.",
    )
    return parser.parse_args()


def npm_command() -> str:
    command = shutil.which("npm.cmd") or shutil.which("npm")
    if not command:
        raise RuntimeError("npm was not found on PATH. Install Node.js or open a terminal where npm is available.")
    return command


def run_checked(command: list[str], cwd: Path) -> None:
    print(f"[setup] {' '.join(command)}")
    subprocess.run(command, cwd=cwd, check=True)


def maybe_install_dependencies(args: argparse.Namespace) -> None:
    if not args.install:
        return

    run_checked([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], BACKEND_DIR)
    run_checked([npm_command(), "install"], FRONTEND_DIR)


def print_environment_hint() -> None:
    conda_env = os.environ.get("CONDA_DEFAULT_ENV")
    if conda_env:
        if conda_env.lower() == RECOMMENDED_CONDA_ENV.lower():
            print(f"[dev] using conda environment: {conda_env}")
        else:
            print(
                f"[dev] warning: active conda environment is '{conda_env}'. "
                f"Recommended environment is '{RECOMMENDED_CONDA_ENV}'."
            )
        return

    print(
        f"[dev] warning: no active conda environment detected. "
        f"Run 'conda activate {RECOMMENDED_CONDA_ENV}' before launching if dependencies are missing."
    )


def stream_output(process: subprocess.Popen[str], name: str) -> None:
    assert process.stdout is not None
    for line in process.stdout:
        print(f"[{name}] {line}", end="")


def start_process(name: str, command: list[str], cwd: Path) -> subprocess.Popen[str]:
    print(f"[dev] starting {name}: {' '.join(command)}")
    process = subprocess.Popen(
        command,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    thread = threading.Thread(target=stream_output, args=(process, name), daemon=True)
    thread.start()
    return process


def wait_for_url(url: str, name: str, timeout: float = 45.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                if response.status < 500:
                    print(f"[dev] {name} is ready: {url}")
                    return True
        except OSError:
            time.sleep(0.5)
    print(f"[dev] timed out waiting for {name}: {url}")
    return False


def is_url_ready(url: str) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=1.5) as response:
            return response.status < 500
    except OSError:
        return False


def kill_port(port: int) -> None:
    if os.name != "nt":
        return
    result = subprocess.run(["netstat", "-ano"], capture_output=True, text=True, check=False)
    for line in result.stdout.splitlines():
        if f":{port} " in line and "LISTENING" in line:
            pid = line.strip().split()[-1]
            if pid.isdigit():
                subprocess.run(["taskkill", "/F", "/PID", pid], check=False)


def restart_ports(args: argparse.Namespace) -> None:
    if not args.restart:
        return
    print(f"[dev] restarting listeners on ports {args.backend_port} and {args.frontend_port}")
    kill_port(args.backend_port)
    kill_port(args.frontend_port)
    time.sleep(1)


def terminate(processes: list[subprocess.Popen[str]]) -> None:
    for process in processes:
        if process.poll() is None:
            process.terminate()

    deadline = time.time() + 8
    for process in processes:
        remaining = max(0.1, deadline - time.time())
        try:
            process.wait(timeout=remaining)
        except subprocess.TimeoutExpired:
            process.kill()


def start_missing_servers(
    args: argparse.Namespace,
    npm: str,
    backend_url: str,
    frontend_url: str,
) -> list[subprocess.Popen[str]]:
    processes: list[subprocess.Popen[str]] = []

    if is_url_ready(backend_url):
        print(f"[dev] backend already running: {backend_url}")
    else:
        processes.append(
            start_process(
                "backend",
                [
                    sys.executable,
                    "-m",
                    "uvicorn",
                    "app.main:app",
                    "--reload",
                    "--host",
                    args.host,
                    "--port",
                    str(args.backend_port),
                ],
                BACKEND_DIR,
            )
        )

    if is_url_ready(frontend_url):
        print(f"[dev] frontend already running: {frontend_url}")
    else:
        processes.append(
            start_process(
                "frontend",
                [npm, "run", "dev", "--", "--host", args.host, "--port", str(args.frontend_port)],
                FRONTEND_DIR,
            )
        )

    return processes


def wait_for_servers(backend_url: str, frontend_url: str) -> tuple[bool, bool]:
    backend_ready = wait_for_url(backend_url, "backend")
    frontend_ready = wait_for_url(frontend_url, "frontend")
    if not backend_ready or not frontend_ready:
        print("[dev] one or more servers did not become ready. Watch the logs above for details.")
    return backend_ready, frontend_ready


def monitor_processes(processes: list[subprocess.Popen[str]]) -> int:
    if not processes:
        print("[dev] both servers were already running.")
        return 0

    print("[dev] servers are running. Press Ctrl+C to stop servers started by this script.")
    while all(process.poll() is None for process in processes):
        time.sleep(0.5)

    for process in processes:
        if process.returncode not in (None, 0):
            print(f"[dev] a server exited with code {process.returncode}.")
            return process.returncode
    return 0


def main() -> int:
    args = parse_args()

    if not BACKEND_DIR.exists() or not FRONTEND_DIR.exists():
        print("[error] run this script from the IntelliStack repository root.", file=sys.stderr)
        return 1

    print_environment_hint()

    try:
        maybe_install_dependencies(args)
        npm = npm_command()
    except (RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"[error] {exc}", file=sys.stderr)
        return 1

    backend_url = f"http://{args.host}:{args.backend_port}/api/health"
    frontend_url = f"http://{args.host}:{args.frontend_port}/"
    processes: list[subprocess.Popen[str]] = []

    try:
        restart_ports(args)
        processes = start_missing_servers(args, npm, backend_url, frontend_url)
        _, frontend_ready = wait_for_servers(backend_url, frontend_url)
        if frontend_ready and not args.no_browser:
            webbrowser.open(frontend_url)

        return monitor_processes(processes)
    except KeyboardInterrupt:
        print("\n[dev] stopping servers...")
        return 0
    finally:
        terminate(processes)


if __name__ == "__main__":
    raise SystemExit(main())
