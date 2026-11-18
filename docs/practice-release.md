# Practice and transcript workspace

The core is still voice-to-text. The existing landing design and penguin animation are preserved; Practice is a separate navigation destination at `/#practice`.

## Implemented

- Read Aloud and Topic Speaking, editable original passages and randomly selected topics across everyday, college, technology and interview categories.
- 2/3/5-minute recording presets. Files are limited to 10 MB and five minutes in the browser, resampled locally and sent as sequential 30-second WAV sections to the existing bounded ASR service. Direct backend uploads retain their two-minute bound.
- Duration, ASR word count, estimated words/minute, amplitude-based quiet intervals and longest quiet interval. Possible um/uh/erm counts are transcript estimates; the model may omit fillers.
- Read-aloud text agreement using normalized word edit distance, with missing/extra recognized-word observations. This is not pronunciation or ability scoring.
- Same-prompt retry comparison, timestamped playback at chunk boundaries, recording bookmarks, search of the latest recording, editable captions, TXT/SRT/VTT and JSON review-bundle exports.
- Find/replace, undo of those edits, explicit personal-term replacements, and opt-in English “new paragraph” / “new line” dictation formatting. Vocabulary replacement is post-editing, not an accuracy guarantee.
- Up to five audio files processed serially; batch cancellation prevents subsequent files and completed text remains. Each file updates playback to that file. Individual failed files retain a retry path.
- Opt-in device-only text/measurement library (20 notes), note search, load and deletion. Audio is never saved to the library. Clipboard and files remain user-triggered.
- Optional Gemini coaching, cleanup, messages, work updates, structured notes/action items and Hindi/English translation. Source transcript remains unchanged. Consent is required before sending text/prompt to Google; no audio is sent to Gemini.

## Gemini setup and limits

Use `.env.example` as a template for an ignored `.env`, with `GEMINI_API_KEY` and an account-supported `GEMINI_MODEL`. The local helper reads settings on each request. For the hosted Space, use server Secrets, never static/config.json. `coaching.py` is included in the six-file service export; the key file is excluded.

Gemini uses the official REST generateContent endpoint through existing httpx. Key travels in a header, not a URL. Text/context limits, 40-second network timeout, output-token cap, one active request, 10-second spacing and a 50-request rolling-day **per-process** limit are enforced. There are no automatic retries or billing/plan changes. This demo limiter resets on server restart and is not a provider spending cap or distributed abuse prevention. Provider billing, free-tier eligibility and data policies depend on the user's Google project.

Source: [Google generateContent REST reference](https://ai.google.dev/api/generate-content). All AI output is untrusted plain text; it is not sent, executed or used as a certified grade.

## Validation

- 26 Python tests pass, including no-consent rejection, input limits, unavailable configuration, secret-header handling, request spacing and key-file isolation.
- Node self-checks verify edit-distance agreement, quiet interval calculations, WAV encoding and SRT/VTT serialization.
- Existing browser-flow suite passes. New browser suite verifies the separate Practice route, read-aloud comparison, replace/undo, storage consent, five minutes split into ten bounded requests, editable SRT output, search, Gemini consent/source preservation, and mobile overflow. ASR and AI replies in these browser-flow checks are mocked.
- Real ASR browser upload/clipboard smoke passed with a synthesized English voice note. Real Gemini coaching returned HTTP 200 for an explicitly consented synthetic project description. See gemini-smoke.json, studio-check.json and local-browser-asr.json. No natural Hindi/Hinglish accuracy or physical microphone certification.

## Explicitly deferred by the user

Speaker diarization, pronunciation grading and live partial transcription require a separate model/latency proposal and validation. They are not represented as implemented or hidden behind fabricated scores. Captions are coarse chunk timings, not word-aligned professional subtitle timing. Hosted deployment, quotas and longer natural recordings still need verification on the user's real Space.
