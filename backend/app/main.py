from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api.routes import router
from app.services.fpl_client import FPLClient

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting FPL Optimizer API...")
    fpl_client = FPLClient()
    await fpl_client.initialize()
    app.state.fpl_client = fpl_client
    yield
    logger.info("Shutting down FPL Optimizer API...")


app = FastAPI(
    title="FPL Optimizer API",
    description="Fantasy Premier League optimization with XGBoost predictions and PuLP solver",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/fpl")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "FPL Optimizer API"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
