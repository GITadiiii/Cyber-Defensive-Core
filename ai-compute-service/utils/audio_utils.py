import numpy as np
import librosa


def extract_phase_gap_features(audio_path: str):
    """
    Extracts real acoustic features from an audio file, based on the same
    principle AASIST (https://github.com/clovaai/aasist) uses: spoofed/
    synthetic voice tends to show unnatural phase discontinuities and
    unusually flat spectral structure compared to genuine human speech.

    This is NOT a reimplementation of the trained AASIST network (that is a
    full deep-learning pipeline out of scope for a hackathon timeline).
    Instead it computes real, direct signal-processing measurements from the
    actual uploaded audio and combines them into a heuristic spoof score —
    every number here comes from real analysis of the real file, never mocked.
    """
    y, sr = librosa.load(audio_path, sr=None, mono=True)

    if y.size == 0:
        raise ValueError("Audio file contains no readable samples.")

    stft = librosa.stft(y, n_fft=1024, hop_length=256)
    phase = np.angle(stft)
    phase_unwrapped = np.unwrap(phase, axis=1)
    phase_diff = np.diff(phase_unwrapped, axis=1)
    phase_gap_score = float(np.mean(np.abs(phase_diff)))

    flatness = librosa.feature.spectral_flatness(y=y)
    spectral_flatness_score = float(np.mean(flatness))

    cqt = np.abs(librosa.cqt(y, sr=sr, hop_length=512))
    if cqt.shape[0] >= 2:
        low_band_energy = float(np.mean(cqt[: cqt.shape[0] // 2]))
        high_band_energy = float(np.mean(cqt[cqt.shape[0] // 2 :]))
        high_freq_ratio = high_band_energy / (low_band_energy + 1e-8)
    else:
        high_freq_ratio = 0.0

    duration_seconds = float(librosa.get_duration(y=y, sr=sr))

    return {
        "phase_gap_score": phase_gap_score,
        "spectral_flatness_score": spectral_flatness_score,
        "high_freq_ratio": high_freq_ratio,
        "duration_seconds": duration_seconds,
    }