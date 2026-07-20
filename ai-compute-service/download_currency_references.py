import os
import re
import requests

BASE_URL = "https://paisaboltahai.rbi.org.in"

DENOMINATIONS = {
    "10": "rupees-ten",
    "20": "rupees-twenty",
    "50": "rupees-fifty",
    "100": "rupees-one-hundred",
    "200": "rupees-two-hundred",
    "500": "rupees-five-hundred",
    "2000": "rupees-two-thousand",
}

OUTPUT_DIR = "reference_notes"


def fetch_note_image_url(page_slug: str, denom: str):
    page_url = f"{BASE_URL}/{page_slug}.aspx"
    resp = requests.get(page_url, timeout=15)
    resp.raise_for_status()

    # Find ALL image src attributes on the page (broader net than before)
    all_imgs = re.findall(r'src=["\']([^"\']+\.(?:png|jpg|jpeg|gif))["\']', resp.text, re.IGNORECASE)

    # Prefer ones that mention "front" (obverse side of the note)
    candidates = [img for img in all_imgs if "front" in img.lower()]

    if not candidates:
        # Nothing matched — print everything found so we can debug
        print(f"    [DEBUG] Rs.{denom}: no 'front' image found. All <img> srcs on page:")
        for img in all_imgs:
            print(f"        {img}")
        return None

    chosen = candidates[0]
    if chosen.startswith("http"):
        return chosen
    if chosen.startswith("/"):
        return f"{BASE_URL}{chosen}"
    return f"{BASE_URL}/{chosen.lstrip('/')}"


def download_all():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for denom, slug in DENOMINATIONS.items():
        try:
            img_url = fetch_note_image_url(slug, denom)
            if not img_url:
                print(f"[SKIP] Rs.{denom}: image URL not found on page")
                continue

            ext = os.path.splitext(img_url)[1] or ".png"
            out_path = os.path.join(OUTPUT_DIR, f"{denom}{ext}")

            img_resp = requests.get(img_url, timeout=15)
            img_resp.raise_for_status()

            with open(out_path, "wb") as f:
                f.write(img_resp.content)

            print(f"[OK] Rs.{denom} -> {out_path}  (from {img_url})")
        except Exception as exc:
            print(f"[FAIL] Rs.{denom}: {exc}")


if __name__ == "__main__":
    download_all()