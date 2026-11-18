# Historical local deployment boundary

The current student release plan is [free-deployment.md](free-deployment.md): Cloudflare Pages at the intended vani.amritkumar.dev plus an eligible Hugging Face ZeroGPU speech service. The notes below describe the earlier local-only boundary. Do not expose the legacy compatibility worker; use the separately audited native hosting runtime.

This release is prepared locally. No host, GitHub repository, domain, budget, public identity system, or capacity target has been chosen. The local server and its host validation deliberately accept localhost only.

## Before public hosting

1. Resolve or formally assess the known upstream qwen-asr dependency advisories in docs/playbook-hardening.md. Do not disable audit findings or install incompatible ML versions simply to obtain a green scan.
2. Select a Python-capable inference host with enough measured RAM/CPU (or separately validate an explicit GPU implementation). Static-only hosting cannot execute this Python model. No paid provider is selected here.
3. Put an authenticated HTTPS reverse proxy in front of the API. It must enforce per-user quotas, bounded global admission and request/connection/body deadlines before forwarding. A local per-process lock alone does not protect a public service from abuse. No public authentication implementation is included in this local release.
4. Add the explicitly selected public hostname to application host validation and update same-origin checks for the trusted proxy's forwarding configuration. Trust forwarded headers only from that proxy. Never expose the underlying model service directly.
5. Publish an accurate privacy notice: on a hosted instance users' audio leaves their device and reaches your server. Document temporary upload handling, logs, deletion behavior and retention decisions. Do not label hosted inference on-device or private by default.
6. Measure concurrent transcription behavior and representative Hindi/English/Hinglish accuracy on the selected hardware. Set quotas and capacity from those measurements. Do not multiply server workers without budgeting a model copy per worker.
7. Validate microphone/clipboard flows over HTTPS and the target mobile/desktop browsers. HTTP microphone access is generally limited to trusted local contexts; a plain-HTTP public IP is insufficient.

## Local Linux evaluation (not validated here)

```sh
uv venv --python 3.14 .venv
uv pip install --python .venv/bin/python -r requirements.txt
.venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8787 --workers 1 --limit-concurrency 8 --timeout-keep-alive 5 --no-access-log
```

Bind the backend to loopback and keep TLS/authentication/quotas at the chosen proxy. Container recipes and provider-specific manifests should be added when a deployment target is selected, rather than shipping an untested public listener.
