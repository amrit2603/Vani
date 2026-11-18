# Standalone verification and limitations

18 November 2026. Current scope: **Vani — वाणी**, independent project at **D:\Vani**, video-inspired frontend and hosted Hindi/English/Hinglish dictation. User requires zero paid services and no visitor model downloads. Intended domain: **vani.amritkumar.dev**, preserving the www portfolio. Proposed speech service: **shubhamsingh123/vani-speech**. Public deployment still requires authenticated accounts and DNS access.

## Current frontend and hosted-runtime evidence

- Practice extension: docs/practice-release.md records the approved scope, validation, secret handling, local-only storage and deferred experiments. Twenty-six Python tests and browser/Node checks pass. Real synthetic-text Gemini coaching returned 200; its key is in an ignored server .env, never browser configuration or release archives. The local five-minute interface sends bounded 30-second sections; direct ASR decoding limits are preserved. This is not a 100-user capacity or pronunciation certification.

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

## Simplified UI verification — 2026-11-18

### Later local-opening and speaking update

The reported opening failure was not reproduced at the HTTP layer: both local health and the page responded 200. Open Vani.cmd / open.ps1 now checks the correct model service, refuses an occupied/unresponsive port, starts uvicorn hidden on localhost if needed, waits for health, and opens Workspace in the default browser. The cold-start/reuse test on port 8788 passed without stopping the existing user server. No startup service or scheduled task was added.

Navigation is centered. Topic Speaking uses New topic, Read Aloud uses New passage, both selected from authored content without an AI request. The selected 120/180/300-second session drives a countdown and automatic stop. Accelerated timer checks verify those actual scheduled deadline values, auto-stop, transcript and playback. Synthetic decoder-boundary checks verify a five-minute output cap, one-second recorder-tail tolerance and rejection beyond it. These are not full-length hardware recordings.

Practice now shows the transcript automatically, plus playback and explicit Save recording. The latest clip in each room survives navigation while the page remains open. Save a copy to listen after closing/refreshing or recording another attempt; no automatic persistent recording storage was added.

A fresh real Qwen browser recording passed with synthetic English audio through the browser microphone: stop, transcription, playback, room switching and clipboard. See recording-e2e.json and screenshots/vani-practice-result.png. Post-stop waiting was approximately eight seconds with the already-loaded model in this single check, not a latency promise. No physical microphone, natural Hindi/Hinglish, full five-minute session or new Gemini request was tested. All 26 Python tests, Ruff, Node helpers, browser suites, accelerated timer checks and launcher checks passed. Mechanical design scan: no findings. The in-app browser-opening automation timed out even though the HTTP and headless-browser checks worked; the independent local launcher is the entry point.

The latest interface replaces the expanded studio with Workspace (record, edit, copy) and Practice (mode, duration, explicitly generated prompt, record, feedback, same-prompt retry). No personalization, batch uploads or advanced tool panels. The original landing and animated penguin remain. Existing device notes are untouched; separate in-page drafts prevent practice text replacing workspace writing.

All 26 Python tests, Node metric/WAV checks and Ruff pass. The dictation browser flow passes for recording, clipboard, cancellation, failed transcription preserving text, retry and mobile overflow. The simplified browser flow passes for explicit prompt generation, separate drafts, reference agreement, explicit mocked AI coaching, discarding pending feedback on navigation, preserving existing local notes, same-prompt retry and desktop/mobile layout. One concurrent baseline browser run timed out entering Workspace; the sequential rerun passed. No new real AI request or physical microphone test was performed. See simple-ui-check.json and current screenshots/vani-workspace.png and vani-practice.png. Old studio-check.json is historical and covers removed controls.

No inference/runtime dependency or server security change. Existing ASR accuracy, dependency-advisory, hosted quota and deployment limitations above still apply. Feedback is observational, not a communication-ability or pronunciation grade. Pace is withheld below ten seconds to avoid misleading short-recording estimates.

## Live draft and feedback extension

Added optional browser SpeechRecognition interim drafts, separately labeled provisional and explicitly opt-in with provider-audio notice. Session cancellation ignores stale results; unsupported/error/end states explain final Qwen fallback. This does not alter the bounded ASR backend or implement native Qwen streaming. Actual browser-service latency and physical microphone compatibility remain unverified.

Practice-first navigation/launcher, large experimental delivery rubric, evidence-based observable next steps and comparable-attempt percentage-point/relative change were added. Formula and limitations are documented in README. No pronunciation, grammar, topic accuracy, confidence, daily progress or certified ability is inferred from these numbers. Optional Gemini coaching handles content observations cautiously. Workspace prompt/cleanup actions preserve original text. The new prompt action is admitted in both local Pydantic validation and hosted action options. Existing consent, admission, timeout and quota controls are retained.

27 Python tests, score formula checks, mocked live event lifecycle/writing/score UI checks, recording baseline and accelerated timer checks pass. Mechanical design scan reported no findings. Mobile checking caught a hidden second nav link after reordering; both links are now explicitly visible. New visual score evidence uses synthetic metric inputs, not a real speaker grade. No new real AI or live-provider request was made.

## Automatic preview and compact flip-card update

The old browser-only opt-in draft is superseded. Recording automatically starts browser recognition and PCM capture. Browser results are provisional; when unavailable, four-second 16-kHz mono AudioWorklet sections feed Qwen via the existing bounded transcription endpoint. One preview request runs at a time, at most three preview sections queue, and stale preview sections can be dropped while the original recording is retained. Silence below the same amplitude threshold is skipped. Network waiting is bounded at 310 seconds, with existing server inference timeout/admission unchanged. Stop closes preview capture and waits for an active preview before final transcription; canceled jobs already on the server are not instantly terminated. Hosted preview calls consume shared GPU quotas. This is segmented preview, not native Qwen word/token streaming.

A real synthetic-English browser microphone test, with browser recognition explicitly unavailable, showed first Qwen text before Stop at 7.082 seconds and a final complete transcript with playback. Evidence: live-qwen-evidence.json. Mocked inference plus real AudioWorklet capture also passed (live-flow-check.json). This is not a latency promise, physical microphone test, natural multilingual test, hosted inference test or production capacity claim. No new paid AI call was made.

The UI removes the Live checkbox and verbose provider text; Speech privacy and a feature-card back retain the disclosure. Prompt tools are above the editor. Both rooms show an original vanilla flip card inspired by the user-supplied React Bits reference: flip, expand/shrink, close with exit animation, reopen, session dismissal across routes, and reduced-motion handling. No React or Motion dependency was added. Card placement initially overlapped Copy; reserved desktop space fixes the observed regression, and recording/clipboard baseline passes with the card open. Mobile places it in flow. Navigation has a moving black indicator.

27 Python tests, score helpers, feature tests, card interaction/mobile checks, recording baseline and accelerated timers pass. Hosted ZeroGPU/Cloudflare documentation was rechecked; free accounts meeting eligibility can host up to two ZeroGPU Spaces, with visitor queues/daily quotas. Deployment guide now includes Space Secrets and mandatory live-preview acceptance tests. Public domain/Space deployment remains unperformed.

Stop/admission regression: tests/live-admission.cjs injects queued preview sections while one mocked ASR call is active, stops recording, and verifies queued previews are discarded and final ASR starts only after that active call completes (two calls total, maximum concurrency one).

## Workspace-first identity and playback revision

Workspace/launcher comes before Practice; transcript controls precede writing tools. Practice logic is unchanged. Both flip-card faces now expose the same six features, explicit click-to-flip guidance and inverse black/white colors, with only X dismissal and Warning / Info restoration. Landing also shows the card below its hero. User-selected Om replaces the round face identity in header/card/favicon using the existing font. No Sanskrit recognition is claimed.

The penguin's 12.28-second clip was converted into a forward/reverse loop at its original 25 fps to avoid an abrupt reset; no new frames or higher-frame-rate claim. Original local media backup remains in ignored tmp, and supplied references are untouched. Visible Play/Pause icon/text and aria-pressed follow real play/pause events; failed playback updates actual state, errors are labeled, and reduced-motion disables autoplay.

The two-tab reduced-motion regression uncovered a real startup issue: uvicorn logged repeated Exceeded concurrency limit warnings, and the second tab had default HTML controls, no loaded video and no running UI scripts. Local HTTP admission was 8, insufficient for parallel static assets/media in multiple tabs. Both launch scripts now use a bounded 32 HTTP connections; Qwen's one-inference admission and localhost binding remain unchanged. After restarting the verified idle local server, the same two-tab playback/reduced-motion check passed. This is a static-loading fix, not a user-capacity/SLO claim.

Brand/media UI, matching-face/X/reopen/mobile checks, separate-draft Practice checks, recording/copy baseline, timer checks, launcher and 27 Python tests pass. No new real AI request or language-accuracy test was performed for this visual/media change.

## Top-right overlay placement

Landing no longer displays a card. Warning / Info remains below Play/Pause and opens Workspace. Workspace and Practice entry slides the card from the right to a fixed top-right position (90px from top, 16px from right), including mobile. It overlays the page without changing content bounds. X dismisses the current room card; help restores it; changing rooms reveals the card again. Reduced-motion skips sliding. A revision check prevents a stale close animation from hiding a newly entered room's card.

The overlay test confirms hidden landing card, preserved help placement, room entry, exact desktop/mobile positioning, no horizontal overflow and identical workspace bounds before/after dismissal. Card flip/X/reopen, branding/playback/reduced-motion and recording/copy baseline checks pass. Existing recording tests now explicitly dismiss the intentional overlay before working with controls beneath it. No backend, inference or microphone change; no new real ASR/AI request was needed.

## Once-per-session card correction

Landing now hides both feature card and Info. First room entry auto-opens it once per tab session, storing only vani-info-seen=1 in sessionStorage. New topic, recording/cancel, navigation and reload do not automatically reopen it. Manual in-room Info remains. If browser sessionStorage is unavailable, the guard still works in memory for the page lifetime. No transcript, recording or saved-note data is added/deleted. Animation runs only on hidden-to-visible transitions. Placement is lower on the right, below the introductory session-label region; viewport height bounds remain.

Updated browser regression covers first-entry display, no landing controls, no reappearance on topic/record/navigation/reload, manual reopen, desktop header clearance, mobile bounds/no overflow and unchanged workspace geometry. Interface, media/reduced-motion and recording/clipboard baselines pass; no new backend or real inference test was needed. Hugging Face auth check found no configured login, so no Space/domain deployment is claimed. Public upload packages are rebuilt with deployment instructions.
