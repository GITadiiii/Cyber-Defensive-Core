import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification

MODEL_NAME = "sakshamkr1/deitfake-v2"

# Module-level cache — models load only on first actual use (lazy),
# then stay cached in memory for subsequent requests. This avoids
# holding both the deepfake model AND the voice model in RAM at all
# times (important for low-RAM hosting tiers like a 1GB EC2 instance).
_cache = {
    "deepfake_model": None,
    "deepfake_processor": None,
    "voice_model": None,
    "voice_feature_extractor": None,
}


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

    quantized_model = torch.quantization.quantize_dynamic(
        model, {torch.nn.Linear}, dtype=torch.qint8
    )

    return quantized_model, processor


def load_voice_spoof_model():
    """
    Loads the wav2vec2-based voice spoof/deepfake-audio detector.
    Applies the same dynamic INT8 quantization used for the deepfake
    image model, to shrink memory footprint for low-RAM (~1GB) hosting
    tiers. Expected to reduce this model's size roughly 4x (~1.2GB -> ~300-400MB).
    """
    from transformers import AutoFeatureExtractor, AutoModelForAudioClassification

    model_name = "garystafford/wav2vec2-deepfake-voice-detector"
    feature_extractor = AutoFeatureExtractor.from_pretrained(model_name)
    model = AutoModelForAudioClassification.from_pretrained(model_name)
    model.eval()

    quantized_model = torch.quantization.quantize_dynamic(
        model, {torch.nn.Linear}, dtype=torch.qint8
    )

    return quantized_model, feature_extractor


def get_deepfake_model():
    """Lazy-loads + caches the deepfake model. Only loads on first call."""
    if _cache["deepfake_model"] is None:
        print("[lazy-load] Loading deepfake model (first request for this endpoint)...")
        model, processor = load_deepfake_model()
        _cache["deepfake_model"] = model
        _cache["deepfake_processor"] = processor
    return _cache["deepfake_model"], _cache["deepfake_processor"]


def get_voice_model():
    """Lazy-loads + caches the voice model. Only loads on first call."""
    if _cache["voice_model"] is None:
        print("[lazy-load] Loading voice model (first request for this endpoint)...")
        model, feature_extractor = load_voice_spoof_model()
        _cache["voice_model"] = model
        _cache["voice_feature_extractor"] = feature_extractor
    return _cache["voice_model"], _cache["voice_feature_extractor"]