"""
translator.py
Drop-in replacement for the BHASHINI translation layer using IndicTrans2 (AI4Bharat).
No API key / signup needed — model runs locally.

Language codes supported (per project scope):
    hin_Deva  -> Hindi
    tam_Taml  -> Tamil
    tel_Telu  -> Telugu
    mar_Deva  -> Marathi
    ben_Beng  -> Bangla
"""

import re
import threading

import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from IndicTransToolkit import IndicProcessor

MODEL_NAME = "ai4bharat/indictrans2-indic-en-dist-200M"  # lightweight variant, fits latency budget

# Supported source language codes -> friendly names (for logging / validation)
SUPPORTED_LANGS = {
    "hin_Deva": "Hindi",
    "tam_Taml": "Tamil",
    "tel_Telu": "Telugu",
    "mar_Deva": "Marathi",
    "ben_Beng": "Bangla",
}

_lock = threading.Lock()  # HF generate() isn't guaranteed thread-safe across concurrent calls
_tokenizer = None
_model = None
_processor = None


def load_model():
    """Loads tokenizer/model/processor once. Call this at service startup, not per-request."""
    global _tokenizer, _model, _processor
    if _model is not None:
        return
    print(f"[translator] Loading {MODEL_NAME} ... (first run downloads + caches weights)")
    _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
    _model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME, trust_remote_code=True)
    _model.eval()
    _processor = IndicProcessor(inference=True)
    print("[translator] Model loaded and ready.")


def translate_to_english(text: str, src_lang_code: str) -> str:
    """
    Translates `text` from an Indic language to English.

    Args:
        text: raw vernacular text (e.g. transcribed call/message content)
        src_lang_code: one of SUPPORTED_LANGS keys, e.g. 'hin_Deva'

    Returns:
        English translation as a string.
    """
    if _model is None:
        load_model()

    if src_lang_code not in SUPPORTED_LANGS:
        raise ValueError(
            f"Unsupported lang code '{src_lang_code}'. "
            f"Expected one of {list(SUPPORTED_LANGS.keys())}"
        )

    if not text or not text.strip():
        return ""

    with _lock:
        batch = _processor.preprocess_batch([text], src_lang=src_lang_code, tgt_lang="eng_Latn")
        inputs = _tokenizer(
            batch, truncation=True, padding="longest", return_tensors="pt", max_length=256
        )
        with torch.no_grad():
            outputs = _model.generate(
                **inputs,
                max_length=256,
                num_beams=1,       # beam=1 (greedy) for speed; bump to 4-5 if you need more accuracy
                early_stopping=True,
            )
        decoded = _tokenizer.batch_decode(outputs, skip_special_tokens=True)
        translated = _processor.postprocess_batch(decoded, lang="eng_Latn")

    return translated[0].strip()


# ---------------------------------------------------------------------------
# PsychologicalScriptScore — keyword scoring per Phase 1/2 spec
# (Authority Impersonation +30, Urgency/Isolation +25, Fabricated Judicial +25,
#  Financial Transfer Pressure +20 — capped at 100)
# ---------------------------------------------------------------------------

KEYWORD_WEIGHTS = {
    "authority_impersonation": {
        "weight": 30,
        "patterns": [
            r"\bcbi officer\b", r"\bed director\b", r"\bdcp\b", r"\bcrime branch\b",
            r"\bcustoms (clearance|department)\b", r"\bnarcotics? (control )?bureau\b",
        ],
    },
    "urgency_isolation": {
        "weight": 25,
        "patterns": [
            r"\bdo not (cut|disconnect) the call\b", r"\bdigital (custody|arrest)\b",
            r"\bsecret room\b", r"\bfake court date\b", r"\bstay on (the )?line\b",
        ],
    },
    "fabricated_judicial": {
        "weight": 25,
        "patterns": [
            r"\bfir number\b", r"\bnarcotics? seizure warrant\b",
            r"\bsupreme court release\b", r"\barrest warrant\b",
        ],
    },
    "financial_transfer": {
        "weight": 20,
        "patterns": [
            r"\bfund verification\b", r"\bclear(ing)? (your )?frozen assets?\b",
            r"\brbi safety deposit\b", r"\btransfer .* (verification|safety)\b",
        ],
    },
}


def compute_psychological_script_score(english_text: str):
    """
    Scores translated English text against the weighted keyword categories.
    Returns a dict with the composite score (capped at 100) and matched phrases.
    """
    text_lower = english_text.lower()
    score = 0
    detected_phrases = []

    for category, cfg in KEYWORD_WEIGHTS.items():
        for pattern in cfg["patterns"]:
            match = re.search(pattern, text_lower)
            if match:
                score += cfg["weight"]
                detected_phrases.append(match.group(0))
                break  # only count each category once

    score = min(score, 100)
    return {
        "psychological_script_score": score,
        "detected_phrases": detected_phrases,
    }


def translate_and_score(text: str, src_lang_code: str):
    """Convenience wrapper: translate then score in one call."""
    english_text = translate_to_english(text, src_lang_code)
    result = compute_psychological_script_score(english_text)
    result["translated_text"] = english_text
    return result


if __name__ == "__main__":
    # quick manual test
    load_model()
    sample = "मैं सीबीआई अफसर बोल रहा हूं। कॉल मत काटिए, यह डिजिटल अरेस्ट है।"
    print(translate_and_score(sample, "hin_Deva"))