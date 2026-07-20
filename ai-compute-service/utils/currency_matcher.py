import os
import cv2
import numpy as np

REFERENCE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "reference_notes")

_orb = cv2.ORB_create(nfeatures=1500)

# Cache: {denomination: (keypoints, descriptors, grayscale_image)}
_reference_cache = {}


def _load_reference_notes():
    if not os.path.isdir(REFERENCE_DIR):
        raise FileNotFoundError(
            f"reference_notes folder not found at {REFERENCE_DIR}. "
            "Run download_currency_references.py first."
        )

    for filename in os.listdir(REFERENCE_DIR):
        name, ext = os.path.splitext(filename)
        if ext.lower() not in (".png", ".jpg", ".jpeg"):
            continue

        path = os.path.join(REFERENCE_DIR, filename)
        img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            continue

        kp, des = _orb.detectAndCompute(img, None)
        if des is not None:
            _reference_cache[name] = (kp, des, img)

    return _reference_cache


def _laplacian_sharpness(gray_img, keypoints):
    """
    Computes Laplacian variance (a standard blur-detection metric) inside
    the bounding box of the given keypoints. High value = sharp, fine
    detail (genuine-note-like). Low value = blurry/flat detail (a common
    sign of photocopied/counterfeit notes, per real-world fake-note
    forensic reports).
    """
    if not keypoints:
        return 0.0

    xs = [kp.pt[0] for kp in keypoints]
    ys = [kp.pt[1] for kp in keypoints]
    x1, x2 = int(max(min(xs) - 10, 0)), int(min(max(xs) + 10, gray_img.shape[1]))
    y1, y2 = int(max(min(ys) - 10, 0)), int(min(max(ys) + 10, gray_img.shape[0]))

    if x2 - x1 < 5 or y2 - y1 < 5:
        return 0.0

    region = gray_img[y1:y2, x1:x2]
    return float(cv2.Laplacian(region, cv2.CV_64F).var())


def match_currency(image_path: str):
    """
    1. Finds the best-matching genuine denomination via ORB keypoints.
    2. Within just the matched-keypoint region (e.g. Ashoka Pillar /
       watermark area), compares local sharpness between the uploaded
       image and the genuine reference — a proxy for "did the forger
       copy the layout but with poor print quality", the exact pattern
       described in real fake-currency forensic reports.
    """
    if not _reference_cache:
        _load_reference_notes()

    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("Could not read image for currency matching.")

    kp_upload, des_upload = _orb.detectAndCompute(img, None)
    if des_upload is None or len(kp_upload) < 10:
        return None, 0.0, 0, 0.0

    bf = cv2.BFMatcher(cv2.NORM_HAMMING)

    best_denom = None
    best_confidence = 0.0
    best_good_matches = 0
    best_sharpness_ratio = 0.0

    for denom, (kp_ref, des_ref, ref_img) in _reference_cache.items():
        if des_ref is None or len(des_ref) < 2:
            continue

        matches = bf.knnMatch(des_upload, des_ref, k=2)
        good_matches = [
            m for m, n in matches
            if len(matches) > 0 and m.distance < 0.75 * n.distance
        ]

        good_count = len(good_matches)
        denom_confidence = good_count / min(len(kp_upload), len(kp_ref))

        if denom_confidence > best_confidence:
            best_confidence = denom_confidence
            best_denom = denom
            best_good_matches = good_count

            # Regional sharpness comparison, only for the current best match
            upload_matched_kps = [kp_upload[m.queryIdx] for m in good_matches]
            ref_matched_kps = [kp_ref[m.trainIdx] for m in good_matches]

            upload_sharpness = _laplacian_sharpness(img, upload_matched_kps)
            ref_sharpness = _laplacian_sharpness(ref_img, ref_matched_kps)

            if ref_sharpness > 0:
                best_sharpness_ratio = round(min(upload_sharpness / ref_sharpness, 1.0), 4)
            else:
                best_sharpness_ratio = 0.0

    return best_denom, round(min(best_confidence, 1.0), 4), best_good_matches, best_sharpness_ratio