from transformers import AutoFeatureExtractor, AutoModelForAudioClassification

MODEL_NAME = "Gustking/wav2vec2-large-xlsr-deepfake-audio-classification"

print("Loading model, this may take a minute (first time downloads ~1.2GB)...")
feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_NAME)
model = AutoModelForAudioClassification.from_pretrained(MODEL_NAME)

print("Model loaded successfully!")
print("Label mapping:", model.config.id2label)