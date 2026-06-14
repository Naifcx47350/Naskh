from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.api import router
from app.config import get_settings


settings = get_settings()

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.get("/", include_in_schema=False)
def dev_landing() -> HTMLResponse:
    return HTMLResponse(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Naskh Backend</title>
            <style>
              body {
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                font-family: Inter, system-ui, sans-serif;
                color: #172033;
                background:
                  radial-gradient(circle at top left, rgba(183, 114, 69, 0.24), transparent 34%),
                  linear-gradient(135deg, #f8f3eb, #eef1f0);
              }
              main {
                max-width: 680px;
                margin: 24px;
                padding: 32px;
                border-radius: 32px;
                background: rgba(255, 255, 255, 0.82);
                box-shadow: 0 24px 90px rgba(23, 32, 51, 0.12);
              }
              a {
                color: #b77245;
                font-weight: 700;
              }
              code {
                padding: 2px 7px;
                border-radius: 8px;
                background: #f4efe7;
              }
            </style>
          </head>
          <body>
            <main>
              <h1>Naskh backend is running</h1>
              <p>This FastAPI server is only the API. The React app runs separately through Vite.</p>
              <p>Open the frontend at <a href="http://127.0.0.1:5173/">http://127.0.0.1:5173/</a>.</p>
              <p>Recommended launch command from the project root:</p>
              <p><code>python run_dev.py</code></p>
            </main>
          </body>
        </html>
        """
    )
