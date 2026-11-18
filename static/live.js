const $ = (id) => document.getElementById(id);
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let generation = 0;
if (!Recognition) {
  $("live-enabled").disabled = true;
  $("live-status").textContent =
    "Live draft is unavailable in this browser. Recording and final transcription still work.";
}
function stop() {
  generation++;
  recognition?.abort();
  recognition = null;
}
document.addEventListener("vani:phase", (event) => {
  $("live-enabled").disabled = !Recognition || event.detail !== "idle";
  if (event.detail !== "recording") {
    stop();
    return;
  }
  $("live-draft").textContent = "";
  if (!$("live-enabled").checked || !Recognition) return;
  const id = ++generation;
  recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = $("language").value === "hi" ? "hi-IN" : "en-IN";
  recognition.onresult = (event) => {
    if (id !== generation) return;
    $("live-draft").textContent = Array.from(
      event.results,
      (result) => result[0].transcript,
    ).join(" ");
  };
  recognition.onerror = () => {
    if (id === generation)
      $("live-status").textContent =
        "Live draft could not continue. Keep speaking; Qwen will transcribe after Stop.";
  };
  recognition.onend = () => {
    if (id === generation)
      $("live-status").textContent =
        "Browser live session ended. Qwen transcription is still available after Stop.";
  };
  try {
    recognition.start();
    $("live-status").textContent =
      "Live draft — provisional words may change. Mixed-language accuracy varies.";
  } catch {
    stop();
    $("live-status").textContent =
      "Live draft unavailable. Recording continues normally.";
  }
});
document.addEventListener("vani:route", () => {
  stop();
  $("live-draft").textContent = "";
});
document.addEventListener("vani:result", () => {
  $("live-draft").textContent = "";
  if (Recognition)
    $("live-status").textContent = "Final Qwen transcript is ready.";
});
