const $ = (id) => document.getElementById(id);
const transcript = $("transcript");
const record = $("record");
const status = $("status");
const MAX_BYTES = 10 * 1024 * 1024;
const LOCAL = ["127.0.0.1", "localhost", "[::1]"].includes(location.hostname);
let phase = "idle";
let capture = null;
let generation = 0;
let pending = null;
let lastAudio = null;
let playbackUrl = null;
let configuration;
let remoteClient;

transcript.placeholder =
  "Your voice goes here.\n\nStart recording, or choose an audio file. Your words will appear here, ready to edit and copy.";

function say(message, tone = "") {
  status.textContent = message;
  status.dataset.tone = tone;
}

function updateEditor() {
  const text = transcript.value.trim();
  const words = text ? text.split(/\s+/u).length : 0;
  $("word-count").textContent = `${words} ${words === 1 ? "word" : "words"}`;
  $("copy").disabled = !text;
  $("clear").disabled = !text || phase === "processing";
  $("empty-mark").hidden = Boolean(text);
}

function setPhase(next) {
  phase = next;
  document.body.classList.toggle("is-recording", next === "recording");
  const busy = next !== "idle";
  record.disabled = next === "requesting" || next === "processing";
  record.querySelector("span").textContent =
    next === "recording"
      ? "Stop & transcribe"
      : next === "processing"
        ? "Transcribing…"
        : "Start recording";
  $("cancel").hidden = !busy;
  $("language").disabled = busy;
  $("audio-file").disabled = busy;
  $("retry").hidden = busy || !lastAudio;
  transcript.readOnly = next === "processing";
  $("record-state").textContent =
    next === "recording"
      ? "Listening. Say it your way."
      : next === "processing"
        ? "Finding your words…"
        : next === "requesting"
          ? "Waiting for microphone access…"
          : "Ready when you are.";
  updateEditor();
}

async function config() {
  if (!configuration) {
    const response = await fetch("./config.json", { cache: "no-store" });
    if (!response.ok)
      throw new Error(
        "The app could not load. Refresh the page and try again.",
      );
    configuration = await response.json();
    if (
      configuration.space &&
      !/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(configuration.space)
    ) {
      throw new Error(
        "The hosted demo is not connected correctly. Please try again later.",
      );
    }
  }
  return configuration;
}

async function ensureService() {
  const settings = await config();
  if (!settings.space && !LOCAL)
    throw new Error(
      "The hosted transcription service is not connected yet. Please come back after the demo is published.",
    );
  return settings;
}

function rememberAudio(blob, filename) {
  lastAudio = { blob, filename, language: $("language").value };
  if (playbackUrl) URL.revokeObjectURL(playbackUrl);
  playbackUrl = URL.createObjectURL(blob);
  $("playback").src = playbackUrl;
  $("playback").hidden = false;
}

async function remoteTranscribe(settings, blob, filename, language, token) {
  const { Client, handle_file } =
    await import("https://cdn.jsdelivr.net/npm/@gradio/client@2.8.0/dist/index.min.js");
  if (token !== generation) throw new DOMException("Canceled", "AbortError");
  if (!remoteClient)
    remoteClient = await Client.connect(settings.space, {
      events: ["status", "data"],
    });
  if (token !== generation) throw new DOMException("Canceled", "AbortError");
  const job = remoteClient.submit("/transcribe", {
    audio: handle_file(new File([blob], filename, { type: blob.type })),
    language,
  });
  pending.job = job;
  let result;
  for await (const message of job) {
    if (token !== generation) throw new DOMException("Canceled", "AbortError");
    if (message.type === "status") {
      if (message.stage === "error" || message.success === false)
        throw new Error(
          message.message ||
            "The free inference service is unavailable or its daily quota has been reached. Try again later.",
        );
      if (message.stage === "pending")
        say(
          "Waiting for a free GPU. Shared demos can have a queue; your existing words are safe.",
          "busy",
        );
      if (message.stage === "generating")
        say("Turning your recording into text…", "busy");
    }
    if (message.type === "data") result = message.data[0];
  }
  return result;
}

async function transcribeAudio(blob, filename, language) {
  if (!blob.size)
    return say("This recording is empty. Try recording again.", "error");
  if (blob.size > MAX_BYTES)
    return say("Choose audio under 10 MB and two minutes.", "error");
  const token = ++generation;
  setPhase("processing");
  $("retry").hidden = true;
  say(
    "Turning your recording into text. First use may take longer while the server starts.",
    "busy",
  );
  const controller = new AbortController();
  pending = { controller, job: null };
  let timedOut = false;
  const deadline = setTimeout(() => {
    timedOut = true;
    controller.abort();
    pending?.job?.cancel();
    if (token === generation) {
      generation++;
      pending = null;
      setPhase("idle");
      say(
        "The server took too long. Your audio is still available below; try transcription again.",
        "error",
      );
    }
  }, 315000);
  try {
    const settings = await ensureService();
    let result;
    if (settings.space) {
      result = await remoteTranscribe(
        settings,
        blob,
        filename,
        language,
        token,
      );
    } else {
      const form = new FormData();
      form.append("audio", blob, filename);
      form.append("language", language);
      const response = await fetch("./api/transcribe", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          typeof body.detail === "string"
            ? body.detail
            : "The recording could not be transcribed. Try a shorter clip.",
        );
      result = body;
    }
    if (token !== generation || timedOut) return;
    if (!result || typeof result.text !== "string" || !result.text.trim())
      throw new Error(
        "No speech was recognized. Try speaking a little closer to the microphone.",
      );
    transcript.value = [transcript.value.trim(), result.text.trim()]
      .filter(Boolean)
      .join("\n\n");
    updateEditor();
    $("result-meta").textContent = [
      result.language,
      result.audio_seconds != null ? `${result.audio_seconds}s audio` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    say(
      "There you are. Your words are ready to edit and copy. Record again to add more.",
    );
    transcript.focus();
    // A successful recording is not offered as a retry, avoiding duplicate paragraphs.
    lastAudio = null;
  } catch (error) {
    if (token !== generation) return;
    if (error.name !== "AbortError")
      say(
        error.message ||
          "Cannot reach the transcription service. Check your connection, then retry.",
        "error",
      );
  } finally {
    clearTimeout(deadline);
    if (token === generation) {
      pending = null;
      setPhase("idle");
    }
  }
}

function releaseCapture(session) {
  clearInterval(session.interval);
  clearTimeout(session.deadline);
  session.stream.getTracks().forEach((track) => track.stop());
  if (capture === session) capture = null;
}

async function startRecording() {
  const token = ++generation;
  setPhase("requesting");
  say("Allow microphone access in your browser to begin.");
  let stream;
  try {
    await ensureService();
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
      throw new Error(
        "This browser cannot record audio here. Open the HTTPS site in a current browser, or choose an audio file.",
      );
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (token !== generation)
      return stream.getTracks().forEach((track) => track.stop());
    const mimeType = [
      "audio/webm;codecs=opus",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ].find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    const session = {
      recorder,
      stream,
      chunks: [],
      bytes: 0,
      canceled: false,
      started: performance.now(),
      token,
    };
    capture = session;
    recorder.ondataavailable = (event) => {
      session.bytes += event.data.size;
      if (session.bytes > MAX_BYTES) {
        session.canceled = true;
        if (recorder.state !== "inactive") recorder.stop();
        say(
          "Recording reached 10 MB. Please try a shorter recording.",
          "error",
        );
      } else if (event.data.size) session.chunks.push(event.data);
    };
    recorder.onerror = () => {
      session.canceled = true;
      releaseCapture(session);
      setPhase("idle");
      say(
        "The microphone recording stopped unexpectedly. Check your microphone and try again.",
        "error",
      );
    };
    recorder.onstop = async () => {
      releaseCapture(session);
      if (session.canceled || token !== generation) {
        if (token === generation) setPhase("idle");
        return;
      }
      const blob = new Blob(session.chunks, {
        type: recorder.mimeType || mimeType || "audio/webm",
      });
      const extension = blob.type.includes("mp4")
        ? "m4a"
        : blob.type.includes("ogg")
          ? "ogg"
          : "webm";
      rememberAudio(blob, `recording.${extension}`);
      await transcribeAudio(blob, lastAudio.filename, lastAudio.language);
    };
    stream.getAudioTracks().forEach((track) =>
      track.addEventListener("ended", () => {
        if (recorder.state === "recording") recorder.stop();
      }),
    );
    recorder.start(1000);
    session.interval = setInterval(() => {
      const seconds = Math.floor((performance.now() - session.started) / 1000);
      $("timer").textContent =
        `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    }, 250);
    // Stop just short of the server limit to allow for recorder scheduling jitter.
    session.deadline = setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, 119000);
    $("timer").textContent = "00:00";
    setPhase("recording");
    say("Recording now. Speak naturally, then choose Stop & transcribe.");
  } catch (error) {
    stream?.getTracks().forEach((track) => track.stop());
    if (token !== generation) return;
    setPhase("idle");
    const messages = {
      NotAllowedError:
        "Microphone access was blocked. Allow it in your browser’s site settings, or choose an audio file.",
      NotFoundError:
        "No microphone was found. Connect one, or choose an audio file.",
      NotReadableError:
        "Your microphone is busy. Close other recording apps and try again.",
    };
    say(
      messages[error.name] ||
        error.message ||
        "Could not start recording. Please try again.",
      "error",
    );
  }
}

function cancel() {
  const processing = phase === "processing";
  generation++;
  if (capture) {
    capture.canceled = true;
    const session = capture;
    if (session.recorder.state !== "inactive") session.recorder.stop();
    releaseCapture(session);
  }
  pending?.controller.abort();
  pending?.job?.cancel();
  pending = null;
  setPhase("idle");
  say(
    processing
      ? "Stopped waiting. A server job that already started may still finish, but its result will not be added."
      : "Recording canceled. Your existing text is safe.",
  );
}

record.addEventListener("click", () => {
  if (phase === "recording" && capture) capture.recorder.stop();
  else if (phase === "idle") startRecording();
});
$("cancel").addEventListener("click", cancel);
$("retry").addEventListener("click", () => {
  if (lastAudio && phase === "idle")
    transcribeAudio(lastAudio.blob, lastAudio.filename, lastAudio.language);
});
$("audio-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file || phase !== "idle") return;
  if (!file.size || file.size > MAX_BYTES)
    return say(
      "Choose a nonempty audio file under 10 MB and two minutes.",
      "error",
    );
  rememberAudio(file, file.name);
  await transcribeAudio(file, file.name, lastAudio.language);
});
transcript.addEventListener("input", updateEditor);
$("clear").addEventListener("click", () => {
  transcript.value = "";
  $("result-meta").textContent = "";
  updateEditor();
  transcript.focus();
  say("A fresh page. Record again whenever you’re ready.");
});
$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(transcript.value);
    say("Copied. Paste your words wherever you need them.");
  } catch {
    transcript.focus();
    transcript.select();
    say(
      "Clipboard access is blocked. Your text is selected; press Ctrl+C or use your device’s Copy command.",
    );
  }
});

const info = {
  how: [
    "HOW IT WORKS",
    [
      "Open the workspace and choose Hindi, English, or automatic detection for mixed speech.",
      "Start recording and allow the microphone when your browser asks. Speak naturally, then stop to transcribe. You can also choose an audio file.",
      "Review your transcript, change any words, and copy it into your notes, messages, or documents. Record again to add another paragraph.",
      "The open-source model runs on a server. Nothing needs installing and visitors do not download model weights. A free shared-GPU demo may have a queue or daily usage limits.",
    ],
  ],
  privacy: [
    "YOUR VOICE. YOUR CHOICE.",
    [
      "Recording begins only after you press Start recording and allow microphone access. You can cancel at any time.",
      "When you stop or choose a file, the audio is sent to the transcription server. This is server-side transcription, not on-device processing.",
      "The app does not deliberately save transcript history or add recordings to a database. Uploads can exist temporarily on the server. Hosting providers may keep operational logs and apply their own policies.",
      "Your editable text stays in this page until you close or refresh it. Copy anything you want to keep. Do not submit sensitive recordings to a public demo.",
    ],
  ],
  help: [
    "A LITTLE HELP.",
    [
      "Microphone blocked? Allow microphone access in your browser’s site settings, or choose an existing audio file.",
      "Use a short, clear recording in a quiet place. Files must be under 10 MB and two minutes. Hindi text may use Devanagari; Romanized Hinglish is not guaranteed.",
      "Waiting for a free GPU? Shared hosting can queue requests or reach a daily quota. Try again later. Local CPU mode can also be slower than real time.",
      "The transcript appears after recording ends. Always review it: speech recognition can miss or change words, especially when switching languages.",
    ],
  ],
};

function route() {
  const page = location.hash.slice(1) || "home";
  if (phase === "recording" || phase === "requesting") {
    if (page !== "dictate") cancel();
  }
  $("home-view").hidden =
    page !== "home" && !(!info[page] && page !== "dictate");
  $("dictate-view").hidden = page !== "dictate";
  $("info-view").hidden = !info[page];
  document.querySelector(".workspace-brand").hidden = page === "home";
  if (info[page]) {
    $("info-title").textContent = info[page][0];
    $("info-copy").replaceChildren(
      ...info[page][1].map((text) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        return paragraph;
      }),
    );
  }
  document.title =
    page === "dictate"
      ? "Your workspace — Vani"
      : "Vani — Your voice, in words";
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
window.addEventListener("beforeunload", (event) => {
  if (phase !== "idle" || transcript.value.trim()) event.preventDefault();
});

const penguin = $("penguin");
function motion(paused) {
  if (paused) penguin.pause();
  else penguin.play().catch(() => {});
  $("motion-toggle").setAttribute(
    "aria-label",
    paused ? "Play penguin animation" : "Pause penguin animation",
  );
  $("motion-toggle").title = paused ? "Play animation" : "Pause animation";
}
$("motion-toggle").addEventListener("click", () => motion(!penguin.paused));
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
if (reducedMotion.matches) motion(true);
reducedMotion.addEventListener("change", (event) => motion(event.matches));
route();
updateEditor();
