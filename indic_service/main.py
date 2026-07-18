"""
main.py
FastAPI microservice exposing POST /api/v1/ai/analyze/text
Uses translator.py (IndicTrans2-based) instead of BHASHINI.

Run with:
    uvicorn main:app --host 0.0.0.0 --port 8001 --reload

Matches the API contract Payal's gateway (Express.js) expects:
    { "psychological_script_score": <0-100>, "detected_phrases": [...] }
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager

import translator


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model once at startup, not per-request (avoids reloading weights every call)
    translator.load_model()
    yield


app = FastAPI(title="Vernacular Threat Analysis Service", lifespan=lifespan)


class TextAnalysisRequest(BaseModel):
    session_uuid: str
    text: str
    lang_code: str  # e.g. "hin_Deva", "tam_Taml", "tel_Telu", "mar_Deva", "ben_Beng"


class TextAnalysisResponse(BaseModel):
    session_uuid: str
    psychological_script_score: int
    detected_phrases: list[str]
    translated_text: str


@app.post("/api/v1/ai/analyze/text", response_model=TextAnalysisResponse)
async def analyze_text(payload: TextAnalysisRequest):
    if payload.lang_code not in translator.SUPPORTED_LANGS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported lang_code. Supported: {list(translator.SUPPORTED_LANGS.keys())}",
        )

    try:
        result = translator.translate_and_score(payload.text, payload.lang_code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation/scoring failed: {e}")

    return TextAnalysisResponse(
        session_uuid=payload.session_uuid,
        psychological_script_score=result["psychological_script_score"],
        detected_phrases=result["detected_phrases"],
        translated_text=result["translated_text"],
    )


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": translator._model is not None}