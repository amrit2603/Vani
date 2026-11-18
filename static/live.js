const $ = (id) => document.getElementById(id);
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition,
  generation = 0;
function stop() {
  generation++;
  recognition?.abort();
  recognition = null;
}
document.addEventListener("vani:phase", (event) => {
  if (event.detail !== "recording") {
    stop();
    return;
  }
  $("live-draft").textContent = "";
  document.body.dataset.browserLive = "waiting";
  if (!Recognition) return;
  const id = ++generation;
  recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = $("language").value === "hi" ? "hi-IN" : "en-IN";
  recognition.onresult = (event) => {
    if (id !== generation) return;
    document.body.dataset.browserLive = "working";
    $("live-draft").textContent = Array.from(
      event.results,
      (result) => result[0].transcript,
    ).join(" ");
    $("live-status").textContent = "Live preview";
    $("live-draft").scrollTop = $("live-draft").scrollHeight;
  };
  const fallback = () => {
    if (id === generation) {
      document.body.dataset.browserLive = "failed";
      $("live-status").textContent = "Connecting live text...";
    }
  };
  recognition.onerror = fallback;
  recognition.onend = fallback;
  try {
    recognition.start();
    $("live-status").textContent = "Listening...";
  } catch {
    stop();
    document.body.dataset.browserLive = "failed";
  }
});
document.addEventListener("vani:route", () => {
  stop();
  $("live-draft").textContent = "";
  $("live-status").textContent = "";
});
document.addEventListener("vani:result", () => {
  $("live-draft").textContent = "";
  $("live-status").textContent = "";
});
