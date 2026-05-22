#!/usr/bin/env python3
"""
Generate the demo / poster cover for Album Cover Generator.

Uploads a 1024x1024 black square as the aspect-ratio anchor, calls the
wdabuliu img2img API with a shoegaze prompt + album/band text, downloads
to public/demo_cover.jpg.

Usage:
  python3 gen_demo_cover.py
"""
import datetime
import hashlib
import hmac
import json
import os
import ssl
import subprocess
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))

# ── R2 ────────────────────────────────────────────────────────────────────────
R2_ACCOUNT_ID  = "bdccd2c68ff0d2e622994d24dbb1bae3"
R2_ACCESS_KEY  = "b203adb7561b4f8800cbc1fa02424467"
R2_SECRET_KEY  = "e7926e4175b7a0914496b9c999afd914cd1e4af7db8f83e0cf2bfad9773fa2b0"
R2_BUCKET      = "aigram"
R2_ENDPOINT    = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_PUBLIC      = "https://images.aiwaves.tech"

API_URL      = "http://aiservice.wdabuliu.com:8019/genl_image"
API_TIMEOUT  = 120
RATE_LIMIT_S = 78

_SSL_CTX = ssl.create_default_context()
_SSL_CTX.check_hostname = False
_SSL_CTX.verify_mode = ssl.CERT_NONE


def _r2_sign(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode(), hashlib.sha256).digest()


def upload_ref(path: str) -> str:
    with open(path, "rb") as f:
        data = f.read()
    obj_key   = f"refs/acg-{int(time.time())}-{os.path.basename(path)}"
    host      = f"{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    now       = datetime.datetime.utcnow()
    amz_date  = now.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = now.strftime("%Y%m%d")
    region, service = "auto", "s3"

    content_type = "image/png"
    content_hash = hashlib.sha256(data).hexdigest()
    canon_uri    = "/" + R2_BUCKET + "/" + urllib.parse.quote(obj_key, safe="/")

    canon_headers = (
        f"content-type:{content_type}\n"
        f"host:{host}\n"
        f"x-amz-content-sha256:{content_hash}\n"
        f"x-amz-date:{amz_date}\n"
    )
    signed_headers = "content-type;host;x-amz-content-sha256;x-amz-date"
    canon_req = "\n".join(["PUT", canon_uri, "", canon_headers, signed_headers, content_hash])

    cred_scope = f"{date_stamp}/{region}/{service}/aws4_request"
    string_to_sign = "\n".join([
        "AWS4-HMAC-SHA256", amz_date, cred_scope,
        hashlib.sha256(canon_req.encode()).hexdigest(),
    ])
    k_date    = _r2_sign(("AWS4" + R2_SECRET_KEY).encode(), date_stamp)
    k_region  = _r2_sign(k_date, region)
    k_service = _r2_sign(k_region, service)
    k_signing = _r2_sign(k_service, "aws4_request")
    signature = hmac.new(k_signing, string_to_sign.encode(), hashlib.sha256).hexdigest()

    auth = (
        f"AWS4-HMAC-SHA256 Credential={R2_ACCESS_KEY}/{cred_scope}, "
        f"SignedHeaders={signed_headers}, Signature={signature}"
    )
    url = f"{R2_ENDPOINT}/{R2_BUCKET}/{urllib.parse.quote(obj_key, safe='/')}"
    req = urllib.request.Request(url, data=data, method="PUT", headers={
        "Content-Type":         content_type,
        "x-amz-content-sha256": content_hash,
        "x-amz-date":           amz_date,
        "Authorization":        auth,
        "Content-Length":       str(len(data)),
    })
    with urllib.request.urlopen(req, timeout=60) as r:
        r.read()
    return f"{R2_PUBLIC}/{obj_key}"


def call_api(ref_url: str, prompt: str) -> str | None:
    payload = json.dumps({
        "query": "",
        "params": {"url": ref_url, "prompt": prompt},
    }).encode()
    req = urllib.request.Request(
        API_URL, data=payload,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=API_TIMEOUT) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            result = json.loads(body)
        except Exception:
            sys.exit(f"ERROR HTTP {e.code}: {body}")
    code = result.get("code")
    if code == 200:
        return result["url"]
    if code == 429:
        raise RuntimeError("rate_limit")
    print(f"  ✗ API returned code={code} body={result}")
    return None


def download(url: str, out_path: str) -> None:
    print(f"  ↓ downloading…")
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    src_ext = os.path.splitext(url.split("?")[0])[1].lower()
    dst_ext = os.path.splitext(out_path)[1].lower()
    tmp_path = out_path if src_ext == dst_ext else out_path + src_ext
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60, context=_SSL_CTX) as resp:
        data = resp.read()
    with open(tmp_path, "wb") as f:
        f.write(data)
    if src_ext != dst_ext and dst_ext in (".png", ".jpg", ".jpeg"):
        fmt = "png" if dst_ext == ".png" else "jpeg"
        subprocess.run(["sips", "-s", "format", fmt, tmp_path, "--out", out_path],
                       check=True, capture_output=True)
        os.remove(tmp_path)
    elif tmp_path != out_path:
        os.rename(tmp_path, out_path)
    kb = os.path.getsize(out_path) // 1024
    print(f"  ✓ {out_path}  ({kb} KB)")


# ── Covers to generate ────────────────────────────────────────────────────────

COVERS = [
    {
        "out": "public/demo_cover.jpg",
        "prompt": (
            "Indie shoegaze / dream-pop album cover artwork. "
            "Theme keywords (subject matter): lonely, train, blue. "
            "Aesthetic: hazy soft-focus 35mm photograph of an empty rural train station at dawn, "
            "blue-tinted twilight, heavy motion blur, washed-out muted color palette with one bruised "
            "accent color, vintage film grain, gentle bloom, dreamy melancholic atmosphere, slightly "
            "overexposed window light. Loveless / Slowdive / Cocteau Twins vibe. "
            "Text rendering — required: a handwritten serif phrase reading 'Slow Hours' centered "
            "at the top, in cream off-white, slightly faded into the photo. Below it in small italic "
            "lowercase letters: 'the fading stations'. "
            "Composition: square 1:1 vinyl format. Wide negative space. No frame, no logos, no "
            "watermarks, no extra text artifacts, no border. The photo must occupy the whole square "
            "edge to edge."
        ),
    },
    {
        "out": "public/demo_cover_xerox.jpg",
        "prompt": (
            "DIY zine / post-punk lo-fi album cover. "
            "Theme keywords (subject matter): burnt, map, static. "
            "Aesthetic: stark high-contrast black-and-white photocopier xerox aesthetic, visible halftone "
            "dot pattern, toner streaks, copy machine grain, fingerprint and dust on the platen, "
            "cut-and-paste collage feel, raw DIY punk fanzine energy, fifth-generation photocopy "
            "degradation. Sonic Youth / Crass / Daydream Nation vibe. "
            "Text rendering — required: ransom-note style headline reading 'Burnt Map' at the top — "
            "mismatched bold black serif and sans letters of slightly different sizes, glued at random "
            "angles onto torn white paper. Below the artwork, typewritten small caps reading "
            "'CHEAP HALO' in a single neat line. "
            "Composition: square 1:1 format. White paper background, black ink only — no other colors. "
            "No frame, no logos, no watermarks, no extra text artifacts."
        ),
    },
]


def main() -> None:
    # Make the 1:1 ref once.
    ref_path = os.path.join(HERE, "_ref_square.png")
    if not os.path.exists(ref_path):
        Image.new("RGB", (1024, 1024), (20, 17, 15)).save(ref_path)
    print(f"  ↑ uploading ref {os.path.basename(ref_path)}…")
    ref_url = upload_ref(ref_path)
    print(f"  ✓ ref → {ref_url}")

    for i, c in enumerate(COVERS):
        out_path = os.path.join(HERE, c["out"])
        print(f"\n[{i+1}/{len(COVERS)}] {c['out']}")
        while True:
            try:
                result_url = call_api(ref_url, c["prompt"])
                break
            except RuntimeError as e:
                if str(e) == "rate_limit":
                    print(f"  ⏳ rate limit — waiting {RATE_LIMIT_S}s…")
                    time.sleep(RATE_LIMIT_S)
                    continue
                raise
        if not result_url:
            print(f"  ✗ generation failed")
            continue
        download(result_url, out_path)
        if i < len(COVERS) - 1:
            print(f"  ⏳ waiting {RATE_LIMIT_S}s before next request…")
            time.sleep(RATE_LIMIT_S)


if __name__ == "__main__":
    main()
