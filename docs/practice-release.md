# Simple workspace and practice

The core is voice-to-text. The original landing design and penguin animation remain. Centered main navigation has two choices: Workspace and Practice.

## Current interface

- Workspace: select language, record, stop, edit and copy. Record again to append another paragraph. Failed transcription preserves existing text and offers a retry.
- Practice: choose Speak on a Topic or Read Aloud and a 2/3/5-minute session. Click New topic or New passage to select authored content. Nothing is generated on entry or when changing mode. A countdown stops recording automatically at the selected time; stopping earlier is also supported.
- Record, stop, then see duration, estimated pace for recordings of at least ten seconds, longest quiet interval and a short suggestion. Read Aloud also shows normalized reference word agreement, not pronunciation grading.
- Try this topic again retains the topic and compares the previous attempt. The editable transcript appears automatically. Playback and Save recording allow listening now or downloading a copy for later. Workspace and Practice drafts and latest recordings stay separate while the page is open. Older clips are replaced by the next recording; save a copy before recording again or closing/refreshing.
- Get AI coaching is optional and explicitly sends that attempt's text and prompt to Gemini. It never runs automatically. Changing prompt or leaving the room discards pending feedback.

Removed from the interface: personalization, uploads/batch processing, clipping, caption exports, find/replace, custom vocabulary, bookmarks and saved-history controls. Previously saved browser notes are not deleted. Advanced backend assist actions remain available to existing API clients, but the UI exposes coaching only.

## Bounds and privacy

Browser recordings are limited to five minutes / 10 MB, resampled locally, and sent as sequential 30-second WAV sections. The direct API retains its two-minute bound. Text appears after stopping, rather than as live partial captions. Copy anything needed before closing or refreshing.

For optional coaching, put GEMINI_API_KEY and GEMINI_MODEL in the ignored server-side .env using .env.example. Hosted deployments use Space Secrets. The key is never included in frontend files or release packages. The unchanged helper has a 40-second network timeout, input/output limits, one active request, ten-second spacing and 50 requests per rolling day per process. No automatic retries or plan changes. This local limiter is not a provider spending cap; provider billing and free-tier eligibility depend on the user's Google project.

## Validation and limits

Run node tests/browser.cjs, node tests/simple-ui.cjs, node tests/speech-tools.mjs and the Python tests described in README.md. Browser tests use a synthetic microphone and mocked ASR/AI responses; current simplified-flow results are in simple-ui-check.json and browser-check.json. Historical studio-check.json covers the older expanded interface and is not evidence for current UI controls. Earlier actual model checks remain in local-browser-asr.json and gemini-smoke.json; no new paid AI request was needed for this UI change.

Pace uses recognized words divided by recording time. Quiet intervals use amplitude, which is sensitive to microphone/background noise. Neither is an ability grade. Speaker labels, pronunciation grading and live partial transcription remain deferred. No natural Hindi/Hinglish accuracy or physical microphone certification. Public hosting is prepared, not deployed; free shared inference has queues and quotas.

## Opening and latest verification

After one-time setup, double-click Open Vani.cmd. It starts a hidden localhost server if needed, waits for health, and opens Workspace in the default browser. Closing the browser does not stop that server; start.ps1 remains the foreground option.

Launcher cold-start/reuse check: `powershell -ExecutionPolicy Bypass -File tests/launcher.ps1` (requires unused port 8788). Deadline/countdown/auto-stop check: `node tests/practice-timer.cjs`. That test verifies 120/180/300-second deadline values with accelerated stop timers and synthetic speech; it also verifies that decoder output is capped at 300 seconds while tolerating up to one second of recorder tail. It is not a real five-minute microphone test.

Fresh real Qwen browser-recording evidence is in recording-e2e.json: synthetic English audio through the browser microphone, transcript, playback, room switching and clipboard all passed. No Gemini request was needed.
