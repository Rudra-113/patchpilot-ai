import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PatchPilot AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def demo_mode_enabled() -> bool:
    return os.getenv("DEMO_MODE", "true").lower() in {"1", "true", "yes", "on"}


@app.get("/api/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "service": "patchpilot",
        "demo_mode": demo_mode_enabled(),
    }
