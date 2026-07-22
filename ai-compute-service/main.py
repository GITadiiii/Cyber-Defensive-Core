from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routes.deepfake_routes import router as deepfake_router
from routes.currency_routes import router as currency_router
from routes.voice_routes import router as voice_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Models are no longer eagerly loaded here. They lazy-load on first
    # actual use via services/model_loader.py's get_deepfake_model() /
    # get_voice_model() — this keeps peak memory low (important for
    # low-RAM hosting tiers like a 1GB EC2 instance), since the deepfake
    # and voice models are no longer both held in memory at all times.
    print("[startup] AI Compute Core ready. Models will lazy-load on first use.")
    yield


app = FastAPI(title="DeepTrust AI Compute Core", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health")
async def health_check():
    return {"status": "AI Compute Core Online"}


app.include_router(deepfake_router, prefix="/api/v1/ai/analyze", tags=["deepfake"])
app.include_router(currency_router, prefix="/api/v1/ai/analyze", tags=["currency"])
app.include_router(voice_router, prefix="/api/v1/ai/analyze", tags=["voice"])