# Third-party notices

The supplied reference video contributes the cropped `static/assets/penguin.mp4` animation and poster. Its source artwork is user-supplied and is not relicensed as MIT by this project; confirm its redistribution rights before publishing it as an open-source asset. No original reference video or naming image is included in the repository.

Self-hosted Silkscreen and Noto Serif Devanagari fonts use SIL OFL 1.1. Their complete notices are included beside the font files under static/assets. The branding image is used only as a naming reference, without its devotional artwork or unrelated subtitle.

The MIT license in LICENSE covers this project's original application code. It does not replace the licenses of models or installed dependencies. Weights are downloaded separately; no model weights are committed or redistributed here.

- [Qwen3-ASR source](https://github.com/QwenLM/Qwen3-ASR): Apache-2.0. Python API reused through the installed qwen-asr package.
- [Qwen3-ASR-0.6B model card](https://huggingface.co/Qwen/Qwen3-ASR-0.6B/raw/main/README.md): its metadata declares Apache-2.0. Preserve the model's own license and notices before redistributing weights.
- [FastAPI](https://github.com/fastapi/fastapi) and [Uvicorn](https://github.com/encode/uvicorn): retain their upstream licenses.
- [PyTorch](https://github.com/pytorch/pytorch), [NumPy](https://github.com/numpy/numpy), [PyAV](https://github.com/PyAV-Org/PyAV), and all transitive dependencies: retain their own licenses and notices. PyAV's bundled FFmpeg components have additional licensing implications for redistributed binaries.

Audio decoder and transcription behavior were adapted from the user's local NILE Instinct AI implementation. No NILE secrets, recordings, model weights, databases, reference PDFs, or unrelated workflow functionality were copied. Before publishing, confirm rights to any upstream source you add beyond this extraction and audit the complete resolved distribution's licenses. This is not a complete software bill of materials.

Browser API reference: [MDN MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder). No browser demo source is vendored.

## Flip-card interaction reference

The user supplied a React Bits FlipCard example and source as a visual/interaction reference. The application uses an original vanilla HTML/CSS/JavaScript implementation of click-to-flip, expand, dismiss and entry/exit motion; it does not bundle that React/Motion component or its dependencies. Existing fonts and penguin media notices above remain applicable.
