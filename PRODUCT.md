# Vani

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated by the user: plain HTML/CSS/JavaScript served by Python/FastAPI. Reuse Qwen3-ASR; necessary dependencies approved. No Node build required.

## Users

An individual who wants to dictate Hindi, English, and mixed Hindi/English speech, review the text, and copy it into other applications. Future self-hosting for others is a goal.

## Product Purpose

A standalone open-source browser dictation tool, independent of NILE Instinct AI's tasks, memory, databases, and Temporal workflows.

## Operating Context

Windows local CPU use first. Record, stop, transcribe, edit, copy. Global shortcuts and direct insertion into other applications are deferred by the user.

## Capabilities and Constraints

- Separate project at D:\Vani; MIT license for original code.
- Qwen3-ASR Hindi/English/mixed-language transcription.
- Current release scope: prepare a free public demo; do not incur charges. Frontend intended for vani.amritkumar.dev, preserving the existing www portfolio. Hugging Face account: shubhamsingh123; free ZeroGPU eligibility and authenticated deployment must be verified.
- No accounts, billing, shared history, retained recordings, external outreach, or task execution.
- CPU inference may be slower than real time. No latency or language-accuracy guarantee.

## Brand Commitments

Confirmed name: Vani — वाणी. Tagline: "Your voice, in words." The user supplied a 12.28-second video of a pale blue, pixel-lettered landing page with animated monochrome penguin, compact navigation, and square controls. Match this visual language. Their later name reference supplies the bilingual naming cue, not the unrelated Vedas/Sanskrit/history subtitle or devotional artwork. No Sanskrit transcription support is claimed.

## Updated hosting requirements

Visitors should not install software or download model weights. Keep inference on the server. User declined browser-model inference. Research selected a free static frontend plus an eligible Hugging Face ZeroGPU service, subject to queues and daily quotas; no always-fast or unlimited-free inference claim is permitted.

## Approved practice extension

Keep voice-to-text as the core; put Read Aloud and Topic Speaking in a separate Practice section with the established UI. User approved optional Gemini using a server-side key and consent. Implemented scope and evidence are in docs/practice-release.md. The user explicitly deferred speaker labels, pronunciation grading and live draft transcription pending a separate model/requirements proposal.

## Evidence on Hand

Existing NILE transcription implementation and documented CPU observations. Fresh standalone checks are recorded under docs/playbook-hardening.md. No natural multilingual accuracy corpus was supplied.

## Simplicity requirement

Workspace and Practice are centered main navigation choices. No onboarding, personalization, batch upload, history or advanced editing panels. Topics/passages appear only after New topic / New passage is clicked. Selected 2/3/5-minute sessions use a countdown and auto-stop. Show the transcript, audio playback/download and a short result after recording, with same-topic retry and explicitly requested AI coaching. Preserve the original visual language and animation. Existing browser history data is left untouched, with no automatic persistent recording storage. Local users open the app through Open Vani.cmd after setup.

## Latest approved extension

Workspace is first in navigation and launcher. Recording automatically starts browser preview, falling back to bounded four-second Qwen audio sections. Full-recording final transcription remains available after Stop. Support/privacy information is compact. Transparent experimental delivery score and same-session retry comparison are separate from semantic AI coaching. Workspace exposes prompt creation and cleanup as explicit Gemini actions, leaving source text intact. Native Qwen streaming, pronunciation grading and daily progress storage are not implemented.

## Compact interface update

Preserve landing design. Use a sliding black active tab and a dismissible/expandable Vani feature card on both rooms, inspired by the supplied FlipCard reference without changing the framework. Feature prompt tools above the editor. No separate live checkbox; microphone still starts only with Start recording. Native token streaming is not claimed.

## Latest requested layout and identity

Workspace first, Practice second. Language/recording/transcript precede prompt and cleanup tools. Keep Practice behavior unchanged. Front and back of the feature card show the same features and an explicit click-to-flip instruction in inverse black/white themes. Only X dismisses; Warning / Info reopens. Include the card below the landing hero. User explicitly selected the Om mark from the supplied name reference for Vani branding, replacing the round face/penguin card identity. Preserve reference pale-blue palette. Smooth the penguin loop and make real playback state obvious.

## Latest card placement correction

No feature card on the initial landing page. Keep Warning / Info below Play/Pause; it leads into Workspace and shows the card. On entering either Workspace or Practice, slide the card from the right into a fixed top-right overlay, including on mobile. Do not move, shrink or push down the workspace. X dismisses the current room card, Warning / Info reopens it, and entering the other room shows its card again.

## Final once-per-session correction

Remove both card and Warning / Info from landing. On first entry into either room, show the card once per tab session using only a sessionStorage boolean. No repeated automatic display after topic generation, recording, route changes or reload. Manual in-room Info can reopen it. Place the card below the top introductory text, toward middle-right, without changing workspace bounds.
