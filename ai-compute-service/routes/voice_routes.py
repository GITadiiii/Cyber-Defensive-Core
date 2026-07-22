import os
import time
import tempfile

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool

from utils.audio_utils import load_and_resample_audio, run_spoof_inference
from services.model_loader import get_voice_model

router = APIRouter()

MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".flac", ".ogg", ".m4a", ".mp4"}


def _run_voice_analysis(audio_path: str, model, feature_extractor):
    y, sr, duration_seconds = load_and_resample_audio(audio_path)
    real_prob, fake_prob = run_spoof_inference(y, sr, model, feature_extractor)

    is_spoofed = fake_prob > real_prob
    spoof_confidence = round(fake_prob, 4)

    return is_spoofed, spoof_confidence, duration_seconds


@router.post("/voice")
async def analyze_voice(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail=f"Unsupported audio format: {ext or 'unknown'}")

    # Lazy-loads on first call, cached after that (see model_loader.py)
    voice_model, voice_feature_extractor = get_voice_model()

    start_time = time.time()
    tmp_path = None
    try:
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=413, detail="Audio exceeds max allowed size (30MB).")
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty or corrupt.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        is_spoofed, spoof_confidence, duration_seconds = await run_in_threadpool(
            _run_voice_analysis, tmp_path, voice_model, voice_feature_extractor
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to process audio: {exc}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    processing_time_ms = int((time.time() - start_time) * 1000)

    return {
        "isSpoofed": is_spoofed,
        "spoofConfidence": spoof_confidence,
        "confidence": spoof_confidence,
        "durationSeconds": round(duration_seconds, 2),
        "processingTimeMs": processing_time_ms,
    }