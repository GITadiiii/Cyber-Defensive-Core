import re
import pytesseract
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = r"C:\Users\BIT\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"

# Text patterns that MUST appear somewhere on a genuine RBI note
GENUINE_MARKERS = [
    "RESERVE BANK OF INDIA",
    "RESERVE BANK",
]

# Known fake/prank-note text patterns (e.g. the widely-circulated
# "Children Bank of India" prank notes from 2016)
FRAUD_MARKERS = [
    "CHILDREN BANK",
    "CHILDREN'S BANK",
    "RESERVE BANK OF CHILDREN",
]


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.upper()).strip()


def verify_note_text(image_path: str):
    """
    Runs OCR on the currency image and checks for:
      1. Presence of genuine RBI markers (should be present)
      2. Presence of known fraud/prank-note markers (should NOT be present)

    Returns (text_verified: bool, detected_issue: str | None, raw_text_snippet: str)
    """
    try:
        img = Image.open(image_path)
        raw_text = pytesseract.image_to_string(img)
    except Exception as exc:
        # OCR failing shouldn't crash the whole endpoint — just skip this check
        return None, f"OCR unavailable: {exc}", ""

    normalized = _normalize(raw_text)

    for fraud_marker in FRAUD_MARKERS:
        if fraud_marker in normalized:
            return False, f"Detected known fraudulent note text: '{fraud_marker}'", raw_text.strip()[:200]

    has_genuine_marker = any(marker in normalized for marker in GENUINE_MARKERS)

    if not has_genuine_marker:
        return False, "Expected 'RESERVE BANK OF INDIA' text not found on note", raw_text.strip()[:200]

    return True, None, raw_text.strip()[:200]