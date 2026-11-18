import { wav } from "./speech-tools.mjs";
const $ = (id) => document.getElementById(id);
let session;
async function send(samples, language) {
  const signal = AbortSignal.timeout(310000);
  const blob = wav(samples);
  const body = new FormData();
  body.append("audio", blob, "live.wav");
  body.append("language", language);
  const response = await fetch("./api/transcribe", {
    method: "POST",
    body,
    signal,
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Live service unavailable",
    );
  return result;
}
document.addEventListener("vani:capture", async (event) => {
  const current = {
    queue: [],
    running: false,
    closed: false,
    text: [],
    context: null,
    work: Promise.resolve(),
    language: $("language").value,
  };
  session = current;
  try {
    const config = await (
      await fetch("./config.json", { signal: AbortSignal.timeout(10000) })
    ).json();
    if (current.closed) return;
    if (config.space) {
      // Shared hosted GPU runs are reserved for final transcription, not recurring previews.
      if (document.body.dataset.browserLive !== "working")
        $("live-status").textContent = "Listening; final text after Stop.";
      return;
    }
    const context = new AudioContext({ sampleRate: 16000 });
    current.context = context;
    await context.audioWorklet.addModule("./pcm-worklet.js");
    if (current.closed) {
      await context.close();
      return;
    }
    const source = context.createMediaStreamSource(event.detail.stream);
    const processor = new AudioWorkletNode(context, "vani-pcm");
    const mute = context.createGain();
    mute.gain.value = 0;
    source.connect(processor);
    processor.connect(mute);
    mute.connect(context.destination);
    await context.resume();
    processor.port.onmessage = ({ data }) => {
      if (current.closed || document.body.dataset.browserLive === "working")
        return;
      let energy = 0;
      for (const value of data) energy += value * value;
      if (Math.sqrt(energy / data.length) < 0.008) return;
      // Preview stays bounded when inference falls behind; the full recording is retained for the final pass.
      if (current.queue.length >= 3) current.queue.shift();
      current.queue.push(data);
      if (current.running) return;
      current.running = true;
      current.work = (async () => {
        try {
          while (!current.closed && current.queue.length) {
            const result = await send(current.queue.shift(), current.language);
            if (current.closed || session !== current) return;
            if (document.body.dataset.browserLive === "working") {
              current.queue = [];
              return;
            }
            if (result.text?.trim()) {
              current.text.push(result.text.trim());
              $("live-draft").textContent = current.text.join(" ");
              $("live-draft").scrollTop = $("live-draft").scrollHeight;
              $("live-status").textContent =
                "Live preview · final text after Stop";
            }
          }
        } catch {
          if (!current.closed)
            $("live-status").textContent =
              "Live service unavailable. Recording is safe; Stop to transcribe.";
          current.queue = [];
        } finally {
          current.running = false;
        }
      })();
    };
  } catch {
    if (!current.closed && document.body.dataset.browserLive !== "working")
      $("live-status").textContent =
        "Live preview unavailable. Stop for final text.";
  }
});
function finish() {
  const current = session;
  if (!current) return Promise.resolve();
  current.closed = true;
  current.queue = [];
  session = null;
  current.context?.close().catch(() => {});
  return current.work;
}
document.addEventListener("vani:finish-live", (event) =>
  event.detail.wait.push(finish()),
);
document.addEventListener("vani:route", finish);
document.addEventListener("vani:phase", (event) => {
  if (event.detail === "idle") finish();
});
