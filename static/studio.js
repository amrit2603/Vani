import { agreement, measurements } from "./speech-tools.mjs";
const $ = (id) => document.getElementById(id);
const topics = {
  Everyday: [
    "Describe a habit that made your day better. Explain why it helped and give one example.",
    "Describe a place you would recommend to a friend and explain your reasons.",
    "Should people spend less time on their phones? Explain your view with an example.",
  ],
  College: [
    "Describe a group project, your contribution, and one lesson you learned.",
    "Explain a difficult subject to a student who is new to it.",
    "Suggest one change that would improve student life at your college.",
  ],
  Technology: [
    "Explain an application you built: the problem, your approach, and what you would improve.",
    "Explain an AI tool to someone who has never used one.",
    "Describe a technology trade-off and explain your choice.",
  ],
  Interviews: [
    "Introduce yourself through one project and one skill you want to develop.",
    "Describe a challenge, what you did, and what you learned.",
    "Explain a time you changed your approach after feedback.",
  ],
};
const passages = [
  "Learning a skill takes patience. Small attempts give us a chance to notice what works and what needs to change. When we explain an idea, a clear opening helps the listener understand our purpose. One concrete example can make a difficult point easier to follow. We can finish by returning to the main idea. The aim is to communicate something useful, in our own voice.",
  "A good project starts with a problem that someone actually faces. Before writing code, we can ask how that person solves the problem today. A small working solution gives us something to test. Feedback may show that a simple feature matters more than an impressive extra. Listening, testing, and improving are part of building software.",
  "हर नया कौशल अभ्यास से बेहतर होता है। छोटे प्रयास हमें अपनी बात को स्पष्ट करने का अवसर देते हैं। किसी विचार को समझाते समय एक उपयोगी उदाहरण सुनने वाले की मदद कर सकता है। अपनी बात समाप्त करते समय मुख्य विचार को दोहराना उपयोगी होता है। हमारा उद्देश्य अपनी आवाज़ में स्पष्ट और सहज संवाद करना है।",
];

let busy = false,
  attempt = null,
  previous = null,
  revision = 0,
  feedbackAbort = null;
function practice() {
  return location.hash === "#practice";
}
function updateModeCopy() {
  const reading = $("practice-mode").value === "read";
  $("new-prompt").textContent = reading ? "New passage" : "New topic";
  $("try-again").textContent = reading
    ? "Read this again"
    : "Try this topic again";
  $("prompt-placeholder").textContent = reading
    ? "Click New passage to get something to read aloud."
    : "Click New topic to get something to talk about.";
}
function stopFeedback() {
  revision++;
  if (feedbackAbort) {
    $("ai-run").disabled = false;
    $("ai-status").textContent = "";
  }
  feedbackAbort?.abort();
  feedbackAbort = null;
}
function resetResult() {
  stopFeedback();
  attempt = null;
  $("practice-result").hidden = true;
  $("ai-output").textContent = "";
  $("ai-status").textContent = "";
  $("ai-run").disabled = false;
  document.body.classList.remove("show-transcript");
}
function updateRecord() {
  if (!busy && practice())
    $("record").disabled = !$("prompt").textContent.trim();
}
function clearPrompt() {
  if (busy) return;
  $("prompt").textContent = "";
  $("prompt").hidden = true;
  $("prompt-placeholder").hidden = false;
  previous = null;
  resetResult();
  updateModeCopy();
  updateRecord();
}
function newPrompt() {
  if (busy) return;
  const language = $("language").value;
  const list =
    $("practice-mode").value === "read"
      ? passages.filter((t) =>
          language === "hi"
            ? /[\u0900-\u097f]/.test(t)
            : !/[\u0900-\u097f]/.test(t),
        )
      : Object.values(topics).flat();
  const old = $("prompt").textContent;
  let text = list[Math.floor(Math.random() * list.length)];
  if (text === old && list.length > 1)
    text = list[(list.indexOf(text) + 1) % list.length];
  resetResult();
  previous = null;
  $("prompt").textContent = text;
  $("prompt").hidden = false;
  $("prompt-placeholder").hidden = true;
  updateRecord();
  $("status").textContent =
    "Ready. Press Start recording and speak until the timer ends, or stop earlier.";
}
$("new-prompt").onclick = newPrompt;
$("practice-mode").onchange = clearPrompt;
$("language").addEventListener("change", clearPrompt);
$("try-again").onclick = () => {
  if (busy || !attempt) return;
  previous = attempt;
  resetResult();
  $("transcript").value = "";
  $("transcript").dispatchEvent(new Event("input"));
  $("playback").pause();
  $("duration").dispatchEvent(new Event("change"));
  updateRecord();
  $("record").focus();
  $("status").textContent =
    "Same topic or passage. Start recording to try again.";
};
document.addEventListener("vani:phase", (event) => {
  busy = event.detail !== "idle";
  for (const id of ["practice-mode", "duration", "new-prompt"])
    $(id).disabled = busy;
  if (event.detail === "requesting" && practice()) resetResult();
  updateRecord();
});
document.addEventListener("vani:route", (event) => {
  stopFeedback();
  $("practice-result").hidden = event.detail !== "practice" || !attempt;
  document.body.classList.toggle(
    "show-transcript",
    event.detail === "practice" && Boolean(attempt),
  );
  updateRecord();
});
document.addEventListener("vani:result", (event) => {
  if (!practice()) return;
  const { result, samples } = event.detail;
  const metrics = measurements(samples, 16000, result.text);
  const reference = $("prompt").textContent;
  const reading = $("practice-mode").value === "read";
  const score = reading ? agreement(reference, result.text) : null;
  attempt = { text: result.text, prompt: reference, metrics, reading };
  const pace =
    metrics.seconds >= 10
      ? `About ${metrics.wpm} words/min`
      : "Speak for at least 10 seconds to estimate pace";
  $("practice-report").textContent =
    `${metrics.seconds}s recorded · ${pace} · ${metrics.longest_quiet}s longest quiet interval`;
  $("practice-tip").textContent = reading
    ? `Reference word match: ${score}%. Check the transcript before using this estimate; it is not a pronunciation score.`
    : metrics.longest_quiet > 3
      ? "Next time, listen to the long pause and practise that transition. Try adding one concrete example."
      : "For your next attempt, make one clear point, add an example, and finish with a short conclusion.";
  $("comparison").textContent =
    previous && previous.prompt === reference && previous.reading === reading
      ? `Last attempt: ${previous.metrics.seconds}s recorded${previous.metrics.seconds >= 10 ? `, about ${previous.metrics.wpm} words/min` : ""}. Faster is not always better.`
      : "";
  $("ai-output").textContent = "";
  $("ai-status").textContent = "";
  $("ai-run").disabled = false;
  $("practice-result").hidden = false;
  document.body.classList.add("show-transcript");
  setTimeout(() => {
    if (practice())
      $("practice-result").scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
  }, 0);
});
$("ai-run").onclick = async () => {
  if (!attempt || busy) return;
  const id = ++revision;
  feedbackAbort?.abort();
  const controller = new AbortController();
  feedbackAbort = controller;
  const timeout = setTimeout(() => controller.abort(), 45000);
  $("ai-run").disabled = true;
  $("ai-status").textContent = "Preparing your feedback…";
  const body = {
    text: attempt.text,
    action: "coach",
    context: attempt.prompt,
    language: $("language").value === "hi" ? "Hindi" : "English",
    consent: true,
  };
  try {
    const config = await (
      await fetch("./config.json", { signal: controller.signal })
    ).json();
    let result;
    if (config.space) {
      const { Client } =
        await import("https://cdn.jsdelivr.net/npm/@gradio/client@2.8.0/dist/index.min.js");
      if (controller.signal.aborted) throw new Error("Feedback stopped.");
      const client = await Client.connect(config.space);
      if (controller.signal.aborted) throw new Error("Feedback stopped.");
      result = (
        await Promise.race([
          client.predict("/assist", body),
          new Promise((_, reject) =>
            controller.signal.addEventListener(
              "abort",
              () => reject(new Error("Feedback timed out. Try again later.")),
              { once: true },
            ),
          ),
        ])
      ).data[0];
    } else {
      const response = await fetch("./api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      result = await response.json();
      if (!response.ok)
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "Coaching is unavailable. Please try later.",
        );
    }
    if (id !== revision) return;
    if (typeof result.text !== "string" || !result.text.trim())
      throw new Error(
        "No usable feedback returned. Your recording and text are safe.",
      );
    $("ai-output").textContent = result.text;
    $("ai-status").textContent =
      "AI coaching — use the suggestions that help you.";
  } catch (error) {
    if (id === revision) {
      $("ai-status").textContent =
        error.name === "AbortError"
          ? "Feedback timed out. Please try later."
          : error.message;
      $("ai-run").disabled = false;
    }
  } finally {
    clearTimeout(timeout);
    if (id === revision) feedbackAbort = null;
  }
};
updateModeCopy();
updateRecord();
