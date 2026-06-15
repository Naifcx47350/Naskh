import { useEffect } from "react";

type Handlers = {
  onToggleTheme?: () => void;
  onToggleAssistant?: () => void;
  onProcess?: () => void;
  onShowShortcuts?: () => void;
};

export function useKeyboardShortcuts(handlers: Handlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (event.key === "?" && !typing) {
        event.preventDefault();
        handlers.onShowShortcuts?.();
      }
      if (event.key.toLowerCase() === "t" && event.altKey) {
        event.preventDefault();
        handlers.onToggleTheme?.();
      }
      if (event.key.toLowerCase() === "a" && event.altKey) {
        event.preventDefault();
        handlers.onToggleAssistant?.();
      }
      if (event.key.toLowerCase() === "p" && event.altKey) {
        event.preventDefault();
        handlers.onProcess?.();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, handlers]);
}
