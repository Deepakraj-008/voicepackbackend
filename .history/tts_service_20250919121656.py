# tts_service.py
from gtts import gTTS
from pathlib import Path

class TTSService:
    def __init__(self, out_dir: Path, lang="en"):
        self.out_dir = Path(out_dir)
        self.out_dir.mkdir(parents=True, exist_ok=True)
        self.lang = lang

    def synth(self, text: str, filename: str) -> Path:
        p = self.out_dir / filename
        tts = gTTS(text=text, lang=self.lang)
        tts.save(str(p))
        return p
