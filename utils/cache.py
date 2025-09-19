# utils/cache.py
from pathlib import Path
import hashlib, json

class SimpleCache:
    def __init__(self, base: Path):
        self.base = Path(base)
        self.base.mkdir(parents=True, exist_ok=True)

    def _key(self, data: dict) -> str:
        s = json.dumps(data, sort_keys=True).encode("utf-8")
        return hashlib.sha1(s).hexdigest()

    def get_path(self, data: dict, suffix: str) -> Path:
        return self.base / f"{self._key(data)}{suffix}"
