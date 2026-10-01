from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.core.errors import APIError
from app.core.store import store
from app.services.engine import seed_demo_workspace


@asynccontextmanager
async def lifespan(_: FastAPI):
    store.reset()
    seed_demo_workspace()
    yield


app = FastAPI(title="PatchPilot AI", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.exception_handler(APIError)
async def handle_api_error(_: Request, exc: APIError) -> JSONResponse:
    return JSONResponse(status_code=exc.status, content={"detail": {"message": exc.message, "detail": exc.detail}})
