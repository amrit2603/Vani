"""One reusable model process; a deadline can terminate decoding or inference."""
import logging
import multiprocessing
import os
import threading
from time import perf_counter

from audio import SAMPLE_RATE, decode_audio

MODEL_ID = "Qwen/Qwen3-ASR-0.6B"
TIMEOUT_SECONDS = 300
LOG = logging.getLogger(__name__)


def model_worker(connection):
    model = None
    try:
        while True:
            data, language = connection.recv()
            try:
                samples = decode_audio(data)
            except Exception as exc:
                message = str(exc) if isinstance(exc, ValueError) else "Cannot decode this audio. Try WAV, MP3, M4A, or WebM."
                connection.send((422, {"detail": message}))
                continue
            if model is None:
                try:
                    import torch
                    from qwen_asr import Qwen3ASRModel

                    # Keep CPU inference from starving the browser on small laptops.
                    torch.set_num_threads(min(4, os.cpu_count() or 1))
                    model = Qwen3ASRModel.from_pretrained(
                        MODEL_ID, dtype=torch.float32, device_map="cpu",
                        max_inference_batch_size=1, max_new_tokens=4096,
                    )
                except Exception:
                    LOG.exception("Model initialization failed")
                    connection.send((503, {"detail": "Model could not load. Check internet access, disk space, and available RAM."}))
                    continue
            started = perf_counter()
            try:
                result = model.transcribe(audio=(samples, SAMPLE_RATE), language={"en": "English", "hi": "Hindi"}.get(language))[0]
                text = result.text.strip()
                if not text:
                    connection.send((422, {"detail": "No speech recognized. Try speaking closer to the microphone."}))
                    continue
                connection.send((200, {
                    "text": text, "language": result.language,
                    "audio_seconds": round(len(samples) / SAMPLE_RATE, 3),
                    "inference_seconds": round(perf_counter() - started, 3), "model": MODEL_ID,
                }))
            except Exception:
                LOG.exception("Transcription failed")
                connection.send((503, {"detail": "Transcription failed. Try a shorter recording."}))
    except (EOFError, BrokenPipeError):
        pass
    finally:
        connection.close()


class Engine:
    def __init__(self):
        self.lock = threading.Lock()
        self.process = None
        self.connection = None

    def close(self):
        if self.process is not None:
            if self.process.is_alive():
                self.process.terminate()
            self.process.join(timeout=3)
            if self.process.is_alive():
                self.process.kill()
                self.process.join(timeout=3)
            self.process.close()
            self.process = None
        if self.connection is not None:
            self.connection.close()
            self.connection = None

    def transcribe(self, data, language):
        if not self.lock.acquire(blocking=False):
            return 429, {"detail": "The model is busy. Wait for the current transcription, then retry."}
        try:
            if self.process is None or not self.process.is_alive():
                self.close()
                context = multiprocessing.get_context("spawn")
                self.connection, child = context.Pipe()
                self.process = context.Process(target=model_worker, args=(child,), daemon=True)
                self.process.start()
                child.close()
            self.connection.send((data, language))
            if not self.connection.poll(TIMEOUT_SECONDS):
                self.close()
                return 504, {"detail": "Transcription exceeded five minutes. Try a shorter recording; the worker has been reset."}
            return self.connection.recv()
        except (OSError, EOFError):
            self.close()
            return 503, {"detail": "The speech worker stopped. Check available RAM and try again."}
        finally:
            self.lock.release()
