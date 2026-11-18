# Vani — वाणी

Standalone local Hindi, English, and Hinglish dictation powered by Qwen3-ASR. MIT-licensed application code; model weights and dependencies retain their own licenses. This is an independent project, not affiliated with Wispr Flow or OpenAI Whisper.

**Your voice, in words.** The video-inspired landing page and recording workspace are implemented: record/upload, stop, transcribe, edit and copy. No visitor installation or model download. The project is independent of NILE's workflows.

Open <http://127.0.0.1:8787/> after starting the server. Browser-flow checks cover synthetic recording, cancellation, clipboard, retries and mobile layout; actual ASR checks are recorded separately. The intended public site is **vani.amritkumar.dev**, with a separate **shubhamsingh123/vani-speech** ZeroGPU service. These are deployment targets, not claimed live URLs. Follow [the verified free deployment plan](docs/free-deployment.md).

![Vani landing page](docs/screenshots/vani-landing.png)

Create upload packages with `.\.venv\Scripts\python.exe prepare_release.py`: `dist/web`, `dist/space`, `dist/vani-website.zip` and `dist/vani-space.zip`. Public speech uses the separate native Transformers runtime in `hosting/requirements.txt`; do not expose the legacy local API publicly. Free hosted inference has queues and daily quotas.

Optional browser checks: `npm.cmd install --prefix tmp/qa playwright`, then `node tests/browser.cjs` against the running local server. These use a synthetic microphone and mocked ASR replies; see docs for separate real-model results.

## Local setup (Windows)

Install [uv](https://docs.astral.sh/uv/getting-started/installation/), then in PowerShell:

```powershell
cd D:\Vani
powershell -ExecutionPolicy Bypass -File .\setup.ps1
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

The server binds only to `127.0.0.1:8787`. API documentation: <http://127.0.0.1:8787/api/docs>. The first transcription downloads Qwen3-ASR-0.6B from Hugging Face into the user's model cache unless already available; allow disk space, RAM, internet access, and extra startup time. Subsequent transcriptions reuse the worker/model. No API key or paid transcription service is needed.

Python 3.14 is used by this Windows setup. Other Python versions/platforms have not been validated. Use one server worker: each additional worker would load another model and bypass the per-process admission limit.

```powershell
curl.exe -F "audio=@sample.wav" -F "language=hi-en" http://127.0.0.1:8787/api/transcribe
```

`language` is `auto` (default), `en`, `hi`, or `hi-en`. Mixed speech uses model auto-detection, without forcing a single language or translating. The model may emit Hindi in Devanagari; Romanized Hinglish output is not guaranteed. Output text is never executed as a command.

## Limits and privacy

- At most 10 MB and 120 seconds per recording. One active transcription; concurrent attempts receive 429 with Retry-After.
- Decoding and inference run in a reusable subprocess with a five-minute deadline. A timeout terminates and resets that process.
- Uploaded files are closed and no audio/transcript history is deliberately retained. Multipart uploads may spool to OS temporary storage while being parsed, then are closed; this is not a forensic erasure guarantee.
- Health checks report API liveness, not model readiness. First-request time includes model loading.
- Local host validation, same-origin upload checks, no-store replies, and restrictive browser headers are enabled.
- CPU operation is supported; realtime latency is not promised. This implementation has no GPU mode.

## Development checks

```powershell
uv pip install --python .venv\Scripts\python.exe -r requirements-dev.txt
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
uv tool run --from ruff ruff check .
uv tool run --from pip-audit pip-audit --path .venv/Lib/site-packages
```

See [verification and limitations](docs/playbook-hardening.md), [deployment notes](docs/deployment.md), and [third-party notices](THIRD_PARTY_NOTICES.md). Known upstream ML dependency advisories mean this is **not approved for public exposure**.

## GitHub preparation

This folder is separate from NILE. Review the ignore rules before adding files: recordings, model weights, caches, environments, and secrets must stay out of Git. Once ready, create your own empty GitHub repository and add its URL as the remote. No remote, push, or commit identity is guessed on your behalf.
