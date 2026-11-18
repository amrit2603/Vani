"""Run against start.ps1 using an explicitly provided, consented audio fixture."""
import argparse
import json
from pathlib import Path
from time import perf_counter

import httpx


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("audio", type=Path)
    parser.add_argument("--expected", required=True)
    args = parser.parse_args()
    results = []
    with httpx.Client(base_url="http://127.0.0.1:8787", timeout=320) as client:
        health = client.get("/api/health")
        health.raise_for_status()
        invalid = client.post("/api/transcribe", files={"audio": ("invalid.wav", b"invalid audio")})
        assert invalid.status_code == 422, invalid.text
        for language in ("en", "auto"):
            started = perf_counter()
            with args.audio.open("rb") as source:
                response = client.post("/api/transcribe", files={"audio": (args.audio.name, source)}, data={"language": language})
            response.raise_for_status()
            result = response.json()
            assert result["text"].strip().casefold() == args.expected.strip().casefold(), result
            results.append({"hint": language, "wall_seconds": round(perf_counter() - started, 3), **result})
    print(json.dumps({"fixture": "explicitly supplied synthetic English clip", "invalid_audio_status": invalid.status_code,
                      "measurements": results, "limits": "Single synthetic English clip; no natural Hindi/Hinglish or physical microphone verification."}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
