import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification

MODEL_NAME = "dima806/deepfake_vs_real_image_detection"


def load_deepfake_model():
    """
    Loads the real EfficientNet-B0-based deepfake detector from HuggingFace.
    Called once at FastAPI startup (see main.py lifespan), not per-request.
    Applies dynamic INT8 quantization on the linear layers to keep it inside
    a small free-tier memory envelope.
    """
    processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
    model = AutoModelForImageClassification.from_pretrained(MODEL_NAME)
    model.eval()

    # Dynamic INT8 quantization (CPU inference — fine for hackathon deployment)
    quantized_model = torch.quantization.quantize_dynamic(
        model, {torch.nn.Linear}, dtype=torch.qint8
    )

    return quantized_model, processor