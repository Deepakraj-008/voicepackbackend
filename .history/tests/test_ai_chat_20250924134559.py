import json
from fastapi.testclient import TestClient
import os

from app import app

client = TestClient(app)


def test_chat_fallback_no_key():
    # Ensure fallback works when no API key present
    resp = client.post("/api/ai/chat?prompt=Hello")
    assert resp.status_code == 200
    j = resp.json()
    assert j.get("ok") is True
    assert "response" in j


def test_ws_chat_fallback():
    with client.websocket_connect("/api/ai/chat/stream") as ws:
        ws.send_json({"prompt": "Hello WS"})
        parts = []
        try:
            for _ in range(10):
                m = ws.receive_json()
                if m.get("type") == "chunk":
                    parts.append(m.get("data"))
                if m.get("type") == "done":
                    break
        except Exception:
            pass
        full = "".join(parts)
        assert "Echo" in full or full
