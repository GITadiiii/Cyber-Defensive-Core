from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from services.model_loader import load_deepfake_model, load_voice_spoof_model
from routes.deepfake_routes import router as deepfake_router
from routes.currency_routes import router as currency_router
from routes.voice_routes import router as voice_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[startup] Loading EfficientNet-B0 deepfake model...")
    model, processor = load_deepfake_model()

    print("[startup] Loading wav2vec2 voice spoof detection model...")
    voice_model, voice_feature_extractor = load_voice_spoof_model()

    app.state.ml_models = {
        "deepfake_model": model,
        "deepfake_processor": processor,
        "voice_model": voice_model,
        "voice_feature_extractor": voice_feature_extractor,
    }
    print("[startup] Models loaded. AI Compute Core ready.")
    yield
    app.state.ml_models.clear()


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
