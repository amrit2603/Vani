# Standalone verification and limitations

18 November 2026. Current scope: **Vani — वाणी**, independent project at **D:\Vani**, video-inspired frontend and hosted Hindi/English/Hinglish dictation. User requires zero paid services and no visitor model downloads. Intended domain: **vani.amritkumar.dev**, preserving the www portfolio. Proposed speech service: **shubhamsingh123/vani-speech**. Public deployment still requires authenticated accounts and DNS access.

## Current frontend and hosted-runtime evidence

- GitHub publication, 18 November 2026: created the public repository https://github.com/amrit2603/Vani and pushed the current app on main. Initial application commit: c8ebfeef898490972103706c788188795fa17778, verified against the remote branch. Before publication, 21 tests, lint and JavaScript syntax checks passed. A limited known-pattern scan of 53 source/asset paths found no matching private keys or common token formats; this is not an exhaustive secret audit. Original references, user recordings, environments and credentials were excluded. Only the intentional cropped application animation is excepted from the MP4 ignore rule.

- Landing and recording/editor pages follow the supplied video. Bilingual name and "Your voice, in words." replace unrelated reference copy. Record/upload, stop, edit, copy, cancellation, retry, playback and reduced-motion controls are implemented.
- **21 unit tests pass**, including static serving, release-file boundaries and publisher account/overwrite guards. Lint and JavaScript syntax checks pass.
- Browser QA in installed Edge passed eight flows: synthetic microphone recording/stopping, copying to the clipboard, cancellation without upload, failure preserving text, retry appending, clear, navigation stopping the microphone, and mobile overflow. Evidence: browser-check.json. ASR replies in these flow tests are mocked; real ASR is checked separately.
- A separate **real browser-to-local-API check** uploaded the synthetic voice note, displayed "Hello. This is a short voice note.", and verified the actual clipboard matched the transcript. Wall time was 48.029 seconds including cold local-worker initialization; no browser errors were observed. Evidence: local-browser-asr.json and screenshots/vani-transcript.png. No physical microphone or natural Hindi/Hinglish accuracy certification is implied.
- Rendered desktop/mobile views were visually inspected. Small functional text was raised to 12 px after the design detector flagged legibility. The reference's hard speech-bubble frame is intentional. No horizontal overflow was observed at 390 px.
- A **separate** Python 3.12.12 native hosting environment uses Transformers 5.23.0, PyTorch 2.13.0, Gradio 6.32.0, Accelerate 1.16.0 and Pillow 13.0.0. Compatibility check passes. A fresh pip-audit reported **no known findings across 87 packages**: hosted-dependency-audit.json and tested-hosted-environment.txt. This does not prove zero vulnerabilities.
- Native Qwen3-ASR-0.6B-hf transcribed the 4.069-second synthetic clip as "Hello. This is a short voice note." on CPU, with 19.167 seconds of inference. First-use library imports and weights were slow; no GPU latency claim is made. Evidence: native-asr-smoke.json.
- After removing the deprecated processor keyword, the actual local **Gradio `/transcribe` API** returned the same English transcript through gradio_client. Its warm call took 6.033 seconds wall time / 5.765 seconds inference for 4.069 seconds of audio, including the correct English metadata. Evidence: native-api-smoke.json. This verifies the packaged service's named API on CPU, not a deployed ZeroGPU instance.
- Hosted Gradio endpoint uses the shared bounded decoder, 10 MB/two-minute audio limits, one inference slot, queue size eight, a 60-second ZeroGPU allocation and periodic temporary-upload cache cleanup. Actual ZeroGPU behavior, provider retention and logged-out quotas need testing on the user's deployed Space.
- Release export contains separate static web and five-file Space packages. The original reference video, naming image, recordings, virtual environments and credentials are excluded. The animated crop remains user-supplied artwork and is not relicensed MIT.
- Public DNS inspection found name.com authoritative nameservers for amritkumar.dev. No `vani` CNAME was found and no DNS record was changed. The existing portfolio records remain untouched.

## Historical local compatibility checks

The sections below retain the original local runtime observations and its advisory findings. That compatibility runtime is localhost-only and is not the selected public server.

## Implemented boundary

- Fresh independent virtual environment; no dependency on NILE's application, environment, database, Ollama, Temporal, or secrets. The user's shared Hugging Face cache may supply already-downloaded model weights.
- FastAPI health and transcription API, CPU Qwen3-ASR-0.6B, one reusable inference subprocess, nonblocking admission, five-minute worker deadline, and worker termination/recreation after timeout or crash.
- At most 10 MB per audio file and 11 MB per raw multipart request, with a 20-second upload deadline; decoded audio capped at 120 seconds while resampling to 16 kHz mono.
- Localhost-only launcher, eight concurrent HTTP connections, one Uvicorn worker, localhost host validation and same-origin upload rejection. These are local controls, not a public multi-user authentication or quota system.
- No deliberate recording/transcript persistence. Temporary multipart spool files are closed after reading; no claim of forensic erasure or zero transient storage. No transcript or upload-body access logging.
- Restrictive browser headers and no-store responses. The developer Swagger documentation route has a narrower exception for its upstream CDN scripts/styles; it requires internet access for those assets.

## Verification

- Python 3.14.4 on Windows, fresh isolated environment, 95 resolved packages. `uv pip check` passes. Exact installed versions: tested-environment.txt.
- `python -m unittest discover -s tests -v`: **16 tests passed** after removing a duplicate timeout case. Cases cover invalid/oversized/empty uploads, invalid language, Hinglish passthrough, cross-site and invalid-host rejection, busy responses, audio resampling/silence/duration limits, and worker failure/timeout slot release. Most inference paths are mocked in unit tests.
- `uv tool run --from ruff ruff check .`: passes.
- Starlette emits a deprecation notice for its current httpx TestClient integration. Tests pass; no new HTTP client dependency was added merely to silence a notice.
- Live HTTP smoke passed: invalid audio returned 422, then a synthetic 2.099-second English clip returned the expected text, "Print the receipt.", for both explicit English and automatic detection. Cold request wall time was 185.313 seconds (including first-use imports/loading), with 7.823 seconds of inference; the warm automatic request took 10.606 seconds wall time and 10.457 seconds of inference. Results: standalone-smoke.json. This is a single clip, not a latency guarantee or capacity/accuracy certification.

## Dependency audit: public-release blocker

A fresh pip-audit scan of this standalone environment reports **52 advisory findings across three packages**:

| Package | Installed version | Findings |
| --- | --- | --- |
| accelerate | 1.12.0 | 1 |
| pillow | 12.3.0 | 42 |
| transformers | 4.57.6 | 9 |

Full scanner evidence: dependency-audit.json. Advisory counts are scanner findings, not a claim that every vulnerable code path is reachable through dictation. qwen-asr 0.0.6 pins its ML runtime; blanket upgrades or ignored constraints are not a tested solution. No suppression or unsupported dependency override was used. No zero-vulnerability or production-readiness claim is made.

The [official Qwen3-ASR repository](https://github.com/QwenLM/Qwen3-ASR) documents the package API and a newer native Transformers integration with different checkpoint identifiers. Migrating to that backend is separate work requiring compatibility and accuracy verification; this extraction deliberately reuses the approved existing model/runtime. The [original model card metadata](https://huggingface.co/Qwen/Qwen3-ASR-0.6B/raw/main/README.md) declares Apache-2.0 and lists Hindi and English support. That does not prove accuracy for natural Hinglish on this machine.

## Historical remaining-work notes (superseded frontend items above)

- The frontend reference has not arrived. No completed frontend, physical microphone check, clipboard/browser end-to-end test, responsive capture, or visual QA is claimed.
- Real Hindi/Hinglish recordings have not been supplied or tested. CPU performance may be slower than real time; long recordings may exceed the five-minute deadline.
- Closing an HTTP client does not immediately stop a running model job; it remains bounded by the worker deadline. A future UI must explain cancellation honestly.
- Sample-count limits bound decoded output but do not replace OS process memory/resource isolation for hostile codecs. Public hosting needs stronger isolation and the controls in deployment.md.
- No public hosting, GitHub push, GPU path, desktop hotkey/paste, capacity/SLO commitment, or license-complete distribution audit has been performed.
