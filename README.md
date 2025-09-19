# Backend

1) Install Python 3.9+ and ffmpeg on your machine.
2) Download Vosk model:
   https://alphacephei.com/vosk/models  → "vosk-model-small-en-us-0.15"
   Extract to: backend/models/vosk-model-small-en-us-0.15

3) Create venv & install:
   python -m venv .venv
   .venv/Scripts/activate (Windows)  OR  source .venv/bin/activate (mac/Linux)
   pip install -r requirements.txt

4) Run:
   uvicorn app:app --reload --host 0.0.0.0 --port 8000

Test: POST /v1/assist with an audio file (the Flutter app will do this).
