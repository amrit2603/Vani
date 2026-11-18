---
title: Vani Speech
emoji: 🎙️
colorFrom: gray
colorTo: gray
sdk: gradio
sdk_version: 6.32.0
python_version: 3.12.12
app_file: app.py
pinned: false
license: mit
short_description: Hindi, English and mixed-speech dictation with Qwen3-ASR
---

# Vani speech service

Public Gradio endpoint for the Vani frontend. Uses the native Transformers Qwen3-ASR-0.6B checkpoint, whose own license is Apache-2.0. Application code is MIT.

Select **ZeroGPU** hardware explicitly. Free hosting is subject to account eligibility, visitor GPU quotas, queues, and provider policy. Do not select paid hardware or add prepaid credits for this zero-budget demo.

No visitor downloads model weights. Audio is uploaded to the server and processed there. Short recordings work best. Review all transcripts; no accuracy or realtime guarantee is made.

Set `HF_HOME` only if a different provider-managed model cache is required. Do not add access tokens to the frontend or commit them here. Public model loading does not require a token.
