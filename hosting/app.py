"""ZeroGPU-compatible native Qwen3-ASR service; no qwen-asr 0.0.6 dependency."""
import logging
import os
from pathlib import Path
from time import perf_counter

import gradio as gr
import spaces
import torch
from transformers import AutoModelForMultimodalLM, AutoProcessor

from audio import MAX_BYTES, SAMPLE_RATE, decode_audio
from coaching import assist

MODEL_ID = "Qwen/Qwen3-ASR-0.6B-hf"
LOG = logging.getLogger(__name__)
# ZeroGPU requires CUDA placement at module scope for its startup emulation.
DEVICE = "cuda" if os.getenv("SPACE_ID") else "cpu"
DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32
processor = AutoProcessor.from_pretrained(MODEL_ID)
model = AutoModelForMultimodalLM.from_pretrained(MODEL_ID, dtype=DTYPE).to(DEVICE).eval()
if DEVICE == "cpu":
    torch.set_num_threads(min(4, os.cpu_count() or 1))


@spaces.GPU(duration=60)
def transcribe(audio, language):
    if language not in {"auto", "en", "hi", "hi-en"}:
        raise gr.Error("Choose Hindi, English, or automatic detection.")
    if not audio:
        raise gr.Error("Choose a recording first.")
    try:
        with Path(audio).open("rb") as source:
            data = source.read(MAX_BYTES + 1)
        if not data or len(data) > MAX_BYTES:
            raise ValueError("Invalid file size")
        samples = decode_audio(data)
    except Exception:
        raise gr.Error("Choose valid audio under 10 MB and two minutes, with audible speech.") from None
    started = perf_counter()
    try:
        inputs = processor.apply_transcription_request(
            audio=samples,
            language={"en": "English", "hi": "Hindi"}.get(language),
        ).to(model.device, model.dtype)
        with torch.inference_mode():
            output = model.generate(**inputs, max_new_tokens=4096)
        tokens = output[:, inputs["input_ids"].shape[1]:]
        parsed = processor.decode(tokens, return_format="parsed")[0]
        text = parsed["transcription"].strip()
        if not text:
            raise ValueError("Empty transcript")
        return {"text": text, "language": parsed.get("language") or {"en": "English", "hi": "Hindi"}.get(language, "auto"),
                "audio_seconds": round(len(samples) / SAMPLE_RATE, 3),
                "inference_seconds": round(perf_counter() - started, 3), "model": MODEL_ID}
    except Exception:
        LOG.exception("Speech inference failed")
        raise gr.Error("Transcription failed. Please try a shorter recording.") from None


with gr.Blocks(title="Vani Speech", delete_cache=(60, 300)) as demo:
    gr.Markdown("# Vani\nHindi, English, or both. Upload a short recording and turn it into editable text. Free shared GPU: queues and daily quotas apply.")
    audio_input = gr.File(label="Audio (up to 10 MB / 2 minutes)", file_types=["audio"], type="filepath")
    language_input = gr.Dropdown(["hi-en", "en", "hi", "auto"], value="hi-en", label="Language")
    button = gr.Button("Transcribe")
    output = gr.JSON(label="Transcript")
    button.click(transcribe, [audio_input, language_input], output, api_name="transcribe", concurrency_limit=1)
    with gr.Accordion("Optional Gemini assistance", open=False):
        ai_text = gr.Textbox(label="Transcript", max_lines=15)
        ai_action = gr.Dropdown(["coach", "clean", "message", "update", "notes", "translate"], value="coach", label="Action")
        ai_context = gr.Textbox(label="Practice prompt")
        ai_language = gr.Dropdown(["English", "Hindi"], value="English", label="Output language")
        ai_consent = gr.Checkbox(label="Send this text and prompt to Gemini", value=False)
        ai_button = gr.Button("Ask Gemini")
        ai_result = gr.JSON(label="AI suggestion")

        def ai_request(text, action, context, language, consent):
            if consent is not True:
                raise gr.Error("Consent is required before sending text to Gemini.")
            try:
                return assist(text, action, context, language)
            except (ValueError, RuntimeError) as exc:
                raise gr.Error(str(exc)) from None

        ai_button.click(ai_request, [ai_text, ai_action, ai_context, ai_language, ai_consent], ai_result,
                        api_name="assist", concurrency_limit=1)

if __name__ == "__main__":
    demo.queue(max_size=8, default_concurrency_limit=1).launch(max_file_size="10mb", show_error=False)
