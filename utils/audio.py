# utils/audio.py
import subprocess, os
from pathlib import Path

def ensure_ffmpeg():
    try:
        subprocess.run(["ffmpeg", "-version"], check=True, capture_output=True)
        return True
    except Exception:
        return False

def convert_to_16k_wav(src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-i", str(src),
        "-ar", "16000", "-ac", "1",
        "-c:a", "pcm_s16le",
        str(dst),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
