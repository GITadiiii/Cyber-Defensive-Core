import os
import time
import tempfile

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool

from utils.audio_utils import extract_phase_gap_features

router = APIRouter()

MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".flac", ".ogg", ".m4a"}

PHASE_GAP_THRESHOLD = 1.35
FLATNESS_THRESHOLD = 0.015
HIGH_FREQ_RATIO_THRESHOLD = 0.6


def _run_voice_analysis(audio_path: str):
    features = extract_phase_gap_features(audio_path)

    phase_component = min(features["phase_gap_score"] / PHASE_GAP_THRESHOLD, 1.0)
    flatness_component = min(features["spectral_flatness_score"] / FLATNESS_THRESHOLD, 1.0)
    high_freq_component = min(features["high_freq_ratio"] / HIGH_FREQ_RATIO_THRESHOLD, 1.0)

    spoof_confidence = round(
        (0.5 * phase_component) + (0.3 * flatness_component) + (0.2 * high_freq_component),
        4,
    )
    is_spoofed = spoof_confidence > 0.5

    return is_spoofed, spoof_confidence, features


@router.post("/voice")
async def analyze_voice(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail=f"Unsupported audio format: {ext or 'unknown'}")

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

        is_spoofed, spoof_confidence, features = await run_in_threadpool(
            _run_voice_analysis, tmp_path
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
        "featuresAnalyzed": {
            "phaseGapScore": round(features["phase_gap_score"], 4),
            "spectralFlatnessScore": round(features["spectral_flatness_score"], 6),
            "highFreqRatio": round(features["high_freq_ratio"], 4),
            "durationSeconds": round(features["duration_seconds"], 2),
        },
        "processingTimeMs": processing_time_ms,
    }