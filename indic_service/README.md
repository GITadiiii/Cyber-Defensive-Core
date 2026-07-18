# Vernacular Text Analysis Service (IndicTrans2)

Drop-in replacement for the BHASHINI-based text analysis endpoint. No API key needed —
translation model runs locally via HuggingFace `transformers`.

## Setup

```bash
pip install -r requirements.txt --break-system-packages
```

First run will download the model (`ai4bharat/indictrans2-indic-en-dist-200M`, ~a few hundred MB)
and cache it locally under `~/.cache/huggingface`. Subsequent runs load from cache.

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## Test it

```bash
curl -X POST http://localhost:8001/api/v1/ai/analyze/text \
  -H "Content-Type: application/json" \
  -d '{
    "session_uuid": "test-123",
    "text": "मैं सीबीआई अफसर बोल रहा हूं। कॉल मत काटिए, यह डिजिटल अरेस्ट है।",
    "lang_code": "hin_Deva"
  }'
```

Expected shape back:
```json
{
  "session_uuid": "test-123",
  "psychological_script_score": 55,
  "detected_phrases": ["cbi officer", "do not cut the call"],
  "translated_text": "I am speaking as a CBI officer. Do not cut the call, this is a digital arrest."
}
```

## Supported lang_code values

| Code       | Language |
|------------|----------|
| hin_Deva   | Hindi    |
| tam_Taml   | Tamil    |
| tel_Telu   | Telugu   |
| mar_Deva   | Marathi  |
| ben_Beng   | Bangla   |

## Wiring into the gateway (Payal's side)

Point the existing Axios call for `/api/v1/ai/analyze/text` at this service's URL/port
(e.g. `http://localhost:8001/api/v1/ai/analyze/text` in dev, or the deployed host in prod).
Response shape matches what `API_CONTRACT.md` already expects — no gateway-side changes needed.

## Notes

- `num_beams=1` (greedy decoding) is used for speed to stay inside the ~450ms latency budget.
  If translations look off, try `num_beams=4` in `translator.py` at the cost of latency.
- Keyword patterns in `translator.py` (`KEYWORD_WEIGHTS`) are a starting set from the Phase 1/2
  spec — extend the regex lists as you test against more real script variants.
- If BHASHINI access comes through later, this can run alongside it or be swapped back in —
  the endpoint contract (`psychological_script_score`, `detected_phrases`) stays the same either way.