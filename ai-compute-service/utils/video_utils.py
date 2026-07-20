import cv2
from PIL import Image

# OpenCV ships this pretrained Haar Cascade face detector out of the box —
# no extra download needed, it's part of the cv2 package installation.
_face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


def extract_every_nth_frame(video_path: str, n: int = 10):
    """
    Reads a real video file from disk with OpenCV, and for every nth frame,
    detects the largest face in that frame and crops to it (with a small
    margin) before returning it as a PIL Image. This matches how the
    deepfake model was trained — on face-cropped images, not full video
    frames — which is critical for getting meaningful predictions rather
    than near-random confidence scores from a frame full of background/
    body/irrelevant content.

    If no face is detected in a sampled frame, that frame is skipped
    (rather than silently passing the full frame to the model, which
    would reintroduce the original accuracy problem).

    Returns a tuple: (list of PIL Images, average smallest-dimension of
    all face crops in pixels). The average dimension is used downstream
    to flag low-resolution/heavily-compressed videos where detection
    confidence may be less reliable — see routes/deepfake_routes.py.
    """
    frames = []
    crop_min_dimensions = []
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError("Could not open video file — possibly corrupt or unsupported format.")

    frame_index = 0
    while True:
        success, frame = cap.read()
        if not success:
            break

        if frame_index % n == 0:
            cropped_face = _detect_and_crop_face(frame)
            if cropped_face is not None:
                crop_h, crop_w = cropped_face.shape[:2]
                crop_min_dimensions.append(min(crop_h, crop_w))
                rgb_frame = cv2.cvtColor(cropped_face, cv2.COLOR_BGR2RGB)
                frames.append(Image.fromarray(rgb_frame))

        frame_index += 1

    cap.release()

    if not frames:
        raise ValueError(
            "No faces could be detected in any sampled frame — cannot run "
            "face-based deepfake analysis on this video."
        )

    avg_min_dimension = sum(crop_min_dimensions) / len(crop_min_dimensions)

    return frames, avg_min_dimension


def _detect_and_crop_face(frame, margin_ratio: float = 0.25):
    """
    Detects faces in a single BGR frame using OpenCV's Haar Cascade,
    picks the largest detected face (assumed to be the primary subject),
    and returns a cropped region around it with a margin so context
    (hairline, jaw, ears) isn't cut off — matching typical face-crop
    training data conventions. Returns None if no face is found.
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
    )

    if len(faces) == 0:
        return None

    # Pick the largest face by area — most likely the main subject
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])

    margin_x = int(w * margin_ratio)
    margin_y = int(h * margin_ratio)

    frame_h, frame_w = frame.shape[:2]
    x1 = max(0, x - margin_x)
    y1 = max(0, y - margin_y)
    x2 = min(frame_w, x + w + margin_x)
    y2 = min(frame_h, y + h + margin_y)

    return frame[y1:y2, x1:x2]