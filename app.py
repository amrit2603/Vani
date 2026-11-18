"""Standalone localhost dictation API. No database, task execution, or retained audio."""
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated, Literal

from fastapi import FastAPI, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.staticfiles import StaticFiles

from audio import MAX_BYTES, MAX_SECONDS
from engine import MODEL_ID, Engine

ROOT = Path(__file__).parent
engine = Engine()


@asynccontextmanager
async def lifespan(app):
    yield
    engine.close()


app = FastAPI(title="Vani", version="0.1.0", lifespan=lifespan, docs_url="/api/docs", redoc_url=None)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["127.0.0.1", "localhost", "[::1]"])


class RequestBoundary:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        headers = dict(scope["headers"])

        async def safe_send(message):
            if message["type"] == "http.response.start":
                policy = b"default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self'; connect-src 'self' https://huggingface.co https://*.hf.space wss://*.hf.space; media-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
                if scope["path"] == "/api/docs":
                    policy = b"default-src 'self'; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; img-src 'self' https://fastapi.tiangolo.com; frame-ancestors 'none'"
                message["headers"] = list(message.get("headers", [])) + [
                    (b"cache-control", b"no-store"), (b"x-content-type-options", b"nosniff"),
                    (b"x-frame-options", b"DENY"), (b"referrer-policy", b"no-referrer"),
                    (b"permissions-policy", b"microphone=(self), camera=(), geolocation=()"),
                    (b"content-security-policy", policy),
                ]
            await send(message)

        if scope["method"] == "POST":
            expected_origin = scope["scheme"].encode() + b"://" + headers.get(b"host", b"")
            if headers.get(b"sec-fetch-site") == b"cross-site" or headers.get(b"origin", expected_origin) != expected_origin:
                return await JSONResponse({"detail": "Open Vani directly to record or upload."}, 403)(scope, receive, safe_send)
            body = bytearray()
            try:
                async with asyncio.timeout(20):
                    while True:
                        message = await receive()
                        if message["type"] == "http.disconnect":
                            return
                        body.extend(message.get("body", b""))
                        if len(body) > MAX_BYTES + 1024 * 1024:
                            return await JSONResponse({"detail": "Upload must be under 10 MB."}, 413)(scope, receive, safe_send)
                        if not message.get("more_body", False):
                            break
            except TimeoutError:
                return await JSONResponse({"detail": "Upload timed out. Please retry."}, 408)(scope, receive, safe_send)
            original_receive = receive
            delivered = False

            async def replay():
                nonlocal delivered
                if not delivered:
                    delivered = True
                    return {"type": "http.request", "body": bytes(body), "more_body": False}
                return await original_receive()
            receive = replay
        await self.app(scope, receive, safe_send)


app.add_middleware(RequestBoundary)


@app.get("/api/health")
def health():
    return {"status": "ok", "model": MODEL_ID, "device": "cpu", "max_seconds": MAX_SECONDS, "max_bytes": MAX_BYTES, "busy": engine.lock.locked()}


@app.post("/api/transcribe")
def transcribe(audio: UploadFile, language: Annotated[Literal["auto", "en", "hi", "hi-en"], Form()] = "auto"):
    try:
        data = audio.file.read(MAX_BYTES + 1)
    finally:
        audio.file.close()
    if not data:
        raise HTTPException(400, "The recording is empty. Record again before transcribing.")
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Upload must be under 10 MB.")
    status, result = engine.transcribe(data, language)
    return JSONResponse(result, status, headers={"Retry-After": "5"} if status == 429 else None)


app.mount("/", StaticFiles(directory=ROOT / "static", html=True), name="frontend")
