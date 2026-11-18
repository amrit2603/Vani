"""Decode a bounded recording without expanding the entire file first."""
import io

import av
import numpy as np

SAMPLE_RATE = 16000
MAX_SECONDS = 120
MAX_BYTES = 10 * 1024 * 1024


def decode_audio(data: bytes) -> np.ndarray:
    pieces = []
    count = 0
    resampler = av.AudioResampler(format="s16", layout="mono", rate=SAMPLE_RATE)
    with av.open(io.BytesIO(data), mode="r") as container:
        for frame in container.decode(audio=0):
            for converted in resampler.resample(frame):
                samples = converted.to_ndarray().flatten()
                count += samples.size
                if count > SAMPLE_RATE * MAX_SECONDS:
                    raise ValueError("Record at most 120 seconds of audio.")
                pieces.append(samples)
        for converted in resampler.resample(None):
            samples = converted.to_ndarray().flatten()
            count += samples.size
            if count > SAMPLE_RATE * MAX_SECONDS:
                raise ValueError("Record at most 120 seconds of audio.")
            pieces.append(samples)
    result = np.concatenate(pieces).astype(np.float32) / 32768 if pieces else np.array([], dtype=np.float32)
    if not result.size or not np.any(result):
        raise ValueError("No sound found. Check your microphone and try again.")
    return result
