# asr.py
from vosk import Model, KaldiRecognizer
from pathlib import Path
import json

class VoskASR:
    def __init__(self, model_dir: Path):
        if not Path(model_dir).exists():
            raise RuntimeError(f"Vosk model not found: {model_dir}")
        self.model = Model(str(model_dir))

    def transcribe_wav(self, wav_path: Path, sample_rate=16000) -> str:
        rec = KaldiRecognizer(self.model, sample_rate)
        text = []
        with open(wav_path, "rb") as f:
            while True:
                data = f.read(4096)
                if not data:
                    break
                if rec.AcceptWaveform(data):
                    r = json.loads(rec.Result())
                    if r.get("text"):
                        text.append(r["text"])
            final = json.loads(rec.FinalResult())
            if final.get("text"):
                text.append(final["text"])
        return " ".join(text).strip()
