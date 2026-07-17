import cv2
from PIL import Image


def extract_every_nth_frame(video_path: str, n: int = 10):
    """
    Reads a real video file from disk with OpenCV and returns a list of
    PIL Images for every nth frame (default: every 10th frame), as required
    by the contract with Payal/Aditi's spec.
    """
    frames = []
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError("Could not open video file — possibly corrupt or unsupported format.")

    frame_index = 0
    while True:
        success, frame = cap.read()
        if not success:
            break
        if frame_index % n == 0:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(Image.fromarray(rgb_frame))
        frame_index += 1

    cap.release()

    if not frames:
        raise ValueError("No frames could be extracted from the video.")

    return frames