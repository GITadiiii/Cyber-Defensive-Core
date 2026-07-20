import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification

MODEL_NAME = "sakshamkr1/deitfake-v2"


def load_deepfake_model():
    """
    Loads a DeiT-based (Vision Transformer family) deepfake detector from
    HuggingFace, fine-tuned on the Deepfake and Real Images dataset
    (derived from OpenForensics), published 2025-2026 — chosen specifically
    because the earlier dima806/deepfake_vs_real_image_detection model
    (trained ~3 years ago per its own model card) suffered from concept
    drift against modern, more realistic AI-generated video and failed to
    flag a real test video we tried. This model is more recently trained
    and should better reflect current-generation deepfake generation
    techniques.

    Called once at FastAPI startup (see main.py lifespan), not per-request.
    Applies dynamic INT8 quantization on the linear layers to keep it inside
    a small free-tier memory envelope.

    Note: we deliberately do NOT hardcode which numeric class index means
    "fake" here — routes/deepfake_routes.py reads model.config.id2label at
    inference time and matches on the string "fake", so this works
    correctly regardless of this model's exact label ordering.
    """
    processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
    model = AutoModelForImageClassification.from_pretrained(MODEL_NAME)
    model.eval()

    # Dynamic INT8 quantization (CPU inference — fine for hackathon deployment)
    quantized_model = torch.quantization.quantize_dynamic(
        model, {torch.nn.Linear}, dtype=torch.qint8
    )

    return quantized_model, processor

def load_voice_spoof_model():
    from transformers import AutoFeatureExtractor, AutoModelForAudioClassification

    model_name = "garystafford/wav2vec2-deepfake-voice-detector"
    feature_extractor = AutoFeatureExtractor.from_pretrained(model_name)
    model = AutoModelForAudioClassification.from_pretrained(model_name)
    model.eval()
    return model, feature_extractor