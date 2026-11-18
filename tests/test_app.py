import io
import unittest
import wave
from unittest.mock import Mock, patch

import numpy as np
from fastapi.testclient import TestClient

import app as api
from audio import MAX_BYTES, decode_audio
from engine import Engine


def wav(seconds=0.1, rate=16000, silent=False):
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as recording:
        recording.setnchannels(1)
        recording.setsampwidth(2)
        recording.setframerate(rate)
        samples = np.zeros(round(rate * seconds), dtype="<i2") if silent else (
            np.sin(np.arange(round(rate * seconds)) * 440 * 2 * np.pi / rate) * 2000
        ).astype("<i2")
        recording.writeframes(samples.tobytes())
    return buffer.getvalue()


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(api.app, base_url="http://localhost")

    def test_health_is_not_a_model_readiness_claim(self):
        result = self.client.get("/api/health")
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["device"], "cpu")
        self.assertEqual(result.headers["cache-control"], "no-store")

    def test_invalid_host_rejected(self):
        self.assertEqual(self.client.get("/api/health", headers={"host": "attacker.example"}).status_code, 400)

    def test_frontend_and_config_are_served(self):
        self.assertIn("Start dictating", self.client.get("/").text)
        self.assertIn("text/javascript", self.client.get("/app.js").headers["content-type"])
        self.assertIsNone(self.client.get("/config.json").json()["space"])
        self.assertEqual(self.client.get("/assets/Silkscreen-Bold.ttf").status_code, 200)
        self.assertIn("frame-ancestors 'none'", self.client.get("/").headers["content-security-policy"])

    @patch.object(api.engine, "transcribe")
    def test_cross_site_upload_rejected_before_inference(self, transcribe):
        for headers in ({"origin": "https://attacker.example"}, {"sec-fetch-site": "cross-site"}):
            result = self.client.post("/api/transcribe", files={"audio": ("test.wav", wav())}, headers=headers)
            self.assertEqual(result.status_code, 403)
        transcribe.assert_not_called()

    @patch.object(api.engine, "transcribe", return_value=(200, {"text": "कल meeting है", "language": "Hindi"}))
    def test_hinglish_is_passed_through_without_task_creation(self, transcribe):
        result = self.client.post("/api/transcribe", files={"audio": ("test.wav", wav())}, data={"language": "hi-en"})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["text"], "कल meeting है")
        self.assertEqual(transcribe.call_args.args[1], "hi-en")

    @patch.object(api.engine, "transcribe")
    def test_invalid_language(self, transcribe):
        result = self.client.post("/api/transcribe", files={"audio": ("test.wav", wav())}, data={"language": "invalid"})
        self.assertEqual(result.status_code, 422)
        transcribe.assert_not_called()

    @patch.object(api.engine, "transcribe")
    def test_empty_and_large_upload(self, transcribe):
        for content, status in ((b"", 400), (b"x" * (MAX_BYTES + 1), 413), (b"x" * (MAX_BYTES + 1024 * 1024), 413)):
            with self.subTest(size=len(content)):
                self.assertEqual(self.client.post("/api/transcribe", files={"audio": ("test.wav", content)}).status_code, status)
        transcribe.assert_not_called()

    @patch.object(api.engine, "transcribe", return_value=(429, {"detail": "busy"}))
    def test_busy_retry_header(self, transcribe):
        response = self.client.post("/api/transcribe", files={"audio": ("test.wav", wav())})
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.headers["retry-after"], "5")


class AudioTests(unittest.TestCase):
    def test_resamples_to_mono_float32(self):
        result = decode_audio(wav(0.1, 48000))
        self.assertEqual(len(result), 1600)
        self.assertEqual(result.dtype, np.float32)

    def test_rejects_silence(self):
        with self.assertRaisesRegex(ValueError, "No sound"):
            decode_audio(wav(silent=True))

    def test_rejects_decoded_duration_over_limit(self):
        with self.assertRaisesRegex(ValueError, "120 seconds"):
            decode_audio(wav(120.1, rate=8000))

    def test_rejects_invalid_audio(self):
        with self.assertRaises(Exception):
            decode_audio(b"invalid audio")


class EngineTests(unittest.TestCase):
    def test_worker_deadline_terminates_and_releases_slot(self):
        engine = Engine()
        engine.process = Mock()
        engine.process.is_alive.return_value = True
        engine.connection = Mock()
        engine.connection.poll.return_value = False
        with patch.object(engine, "close") as close:
            self.assertEqual(engine.transcribe(b"x", "auto")[0], 504)
            close.assert_called_once()
        self.assertFalse(engine.lock.locked())

    def test_worker_crash_releases_slot(self):
        engine = Engine()
        engine.process = Mock()
        engine.process.is_alive.return_value = True
        engine.connection = Mock()
        engine.connection.send.side_effect = BrokenPipeError
        with patch.object(engine, "close") as close:
            self.assertEqual(engine.transcribe(b"x", "auto")[0], 503)
            close.assert_called_once()
        self.assertFalse(engine.lock.locked())

    def test_result_passes_through(self):
        engine = Engine()
        engine.process = Mock()
        engine.process.is_alive.return_value = True
        engine.connection = Mock()
        engine.connection.recv.return_value = (200, {"text": "नमस्ते"})
        self.assertEqual(engine.transcribe(b"x", "hi"), (200, {"text": "नमस्ते"}))
        self.assertFalse(engine.lock.locked())

    def test_no_unbounded_inference_queue(self):
        engine = Engine()
        engine.lock.acquire()
        try:
            self.assertEqual(engine.transcribe(b"x", "auto")[0], 429)
            self.assertIsNone(engine.process)
        finally:
            engine.lock.release()

    def test_crashed_worker_is_recoverable(self):
        engine = Engine()
        engine.process = Mock()
        engine.connection = Mock()
        engine.connection.recv.side_effect = EOFError
        with patch.object(engine, "close") as close:
            self.assertEqual(engine.transcribe(b"x", "auto")[0], 503)
            close.assert_called_once()
        self.assertFalse(engine.lock.locked())


if __name__ == "__main__":
    unittest.main()
