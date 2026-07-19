import librosa
import torch


def load_and_resample_audio(audio_path: str, target_sr: int = 16000):
    """
    Loads audio and resamples to 16kHz (required input rate for the
    wav2vec2-based deepfake-audio-classification model).
    """
    y, sr = librosa.load(audio_path, sr=target_sr, mono=True)

    if y.size == 0:
        raise ValueError("Audio file contains no readable samples.")

    duration_seconds = float(librosa.get_duration(y=y, sr=sr))
    return y, sr, duration_seconds


def run_spoof_inference(y, sr, model, feature_extractor):
    """
    Runs real inference using the pretrained wav2vec2 deepfake-audio model.
    Labels from the model: {0: 'real', 1: 'fake'}
    """
    inputs = feature_extractor(y, sampling_rate=sr, return_tensors="pt")

    with torch.no_grad():
        logits = model(**inputs).logits
        probs = torch.nn.functional.softmax(logits, dim=-1)[0]

    real_prob = float(probs[0])
    fake_prob = float(probs[1])

    return real_prob, fake_prob