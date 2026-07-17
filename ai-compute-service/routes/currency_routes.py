import os
import time
import tempfile

import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool

router = APIRouter()

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

EDGE_DENSITY_THRESHOLD = 0.06
MICROPRINT_VARIANCE_THRESHOLD = 350.0


def _analyze_currency_image(image_path: str):
    """
    Blocking OpenCV work, executed inside run_in_threadpool.
    Runs real edge detection + local variance (microprint proxy) analysis
    on an actual currency note image.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Image could not be read — file may be corrupt or unsupported.")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    edges = cv2.Canny(gray, 100, 200)
    edge_density = float(np.count_nonzero(edges)) / edges.size

    h, w = gray.shape
    patch_size = max(16, min(h, w) // 20)
    flagged_regions = []
    variances = []

    for y in range(0, h - patch_size, patch_size):
        for x in range(0, w - patch_size, patch_size):
            patch = gray[y:y + patch_size, x:x + patch_size]
            var = float(patch.var())
            variances.append(var)
            if var < MICROPRINT_VARIANCE_THRESHOLD * 0.3:
                flagged_regions.append({"x": x, "y": y, "width": patch_size, "height": patch_size})

    mean_variance = float(np.mean(variances)) if variances else 0.0

    is_authentic = edge_density >= EDGE_DENSITY_THRESHOLD and mean_variance >= MICROPRINT_VARIANCE_THRESHOLD

    edge_component = min(edge_density / EDGE_DENSITY_THRESHOLD, 1.0)
    variance_component = min(mean_variance / MICROPRINT_VARIANCE_THRESHOLD, 1.0)
    confidence_score = round((edge_component + variance_component) / 2, 4)

    return is_authentic, confidence_score, flagged_regions[:10]


@router.post("/currency")
async def analyze_currency(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail=f"Unsupported image format: {ext or 'unknown'}")

    tmp_path = None
    try:
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=413, detail="Image exceeds max allowed size (20MB).")
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty or corrupt.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        is_authentic, confidence_score, flagged_regions = await run_in_threadpool(
            _analyze_currency_image, tmp_path
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to process image: {exc}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    return {
        "isAuthentic": is_authentic,
        "confidenceScore": confidence_score,
        "flaggedRegions": flagged_regions,
    }