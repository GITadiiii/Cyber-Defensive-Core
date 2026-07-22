import os
import time
import tempfile

import torch
from fastapi import APIRouter, UploadFile, File, Request, HTTPException
from fastapi.concurrency import run_in_threadpool

from utils.video_utils import extract_every_nth_frame

router = APIRouter()

MAX_FILE_SIZE_BYTES = 300 * 1024 * 1024  # ~300MB
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm", ".mkv"}


LOW_RES_THRESHOLD_PX = 150  # face-crop smaller-dimension threshold, in pixels


def _run_inference(video_path: str, model, processor):
    """
    Blocking work: frame extraction (OpenCV) + PyTorch inference.
    Executed inside run_in_threadpool so it never blocks the async event loop.
    """
    frames, avg_min_dimension = extract_every_nth_frame(video_path, n=10)

    inputs = processor(images=frames, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)

    id2label = model.config.id2label if hasattr(model, "config") else {0: "Fake", 1: "Real"}
    fake_index = next(
        (idx for idx, label in id2label.items() if "fake" in label.lower()),
        0,
    )

    fake_scores = probs[:, fake_index]
    aggregated_confidence = float(fake_scores.mean().item())
    is_deepfake = aggregated_confidence > 0.5

    low_res_warning = avg_min_dimension < LOW_RES_THRESHOLD_PX

    return is_deepfake, aggregated_confidence, len(frames), low_res_warning


@router.post("/deepfake")
async def analyze_deepfake(request: Request, file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail=f"Unsupported video format: {ext or 'unknown'}")

    ml_models = getattr(request.app.state, "ml_models", None)
    if not ml_models or "deepfake_model" not in ml_models:
        raise HTTPException(status_code=503, detail="Deepfake model is not loaded yet.")

    model = ml_models["deepfake_model"]
    processor = ml_models["deepfake_processor"]

    start_time = time.time()

    tmp_path = None
    try:
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=413, detail="Video exceeds max allowed size (300MB).")
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty or corrupt.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        is_deepfake, confidence, frames_analyzed, low_res_warning = await run_in_threadpool(
            _run_inference, tmp_path, model, processor
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to process video: {exc}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    processing_time_ms = int((time.time() - start_time) * 1000)

    response = {
        "isDeepfake": is_deepfake,
        "confidence": round(confidence, 4),
        "framesAnalyzed": frames_analyzed,
        "processingTimeMs": processing_time_ms,
        "lowResolutionWarning": low_res_warning,
    }

    if low_res_warning:
        response["lowResolutionNote"] = (
            "Face regions in this video are very small/compressed — detection "
            "confidence may be reduced. Common with forwarded/re-compressed "
            "videos (e.g. WhatsApp)."
        )

    return response