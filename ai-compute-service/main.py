from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from services.model_loader import load_deepfake_model
from routes.deepfake_routes import router as deepfake_router
from routes.currency_routes import router as currency_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model once at startup, not per-request
    print("[startup] Loading EfficientNet-B0 deepfake model...")
    model, processor = load_deepfake_model()
    app.state.ml_models = {"deepfake_model": model, "deepfake_processor": processor}
    print("[startup] Model loaded. AI Compute Core ready.")
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