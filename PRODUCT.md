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

Windows local CPU use first. Record or upload audio, transcribe, edit, copy. Global shortcuts and direct insertion into other applications are deferred by the user.

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

## Evidence on Hand

Existing NILE transcription implementation and documented CPU observations. Fresh standalone checks are recorded under docs/playbook-hardening.md. No natural multilingual accuracy corpus was supplied.
