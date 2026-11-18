import { transcribeFile as transcribeAudio } from "./app.js";
import {
  agreement,
  measurements,
  captions,
  referenceDiff,
} from "./speech-tools.mjs";
const $ = (id) => document.getElementById(id),
  editor = $("transcript");
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
let segments = [],
  marks = [],
  lastMetrics = null,
  previous = null,
  undo = [],
  busy = false,
  lastPrompt = "",
  lastMode = "topic";
const tell = (text) => ($("status").textContent = text);
const update = () => editor.dispatchEvent(new Event("input"));
function edit(fn) {
  if (busy) return tell("Wait for transcription before editing.");
  undo.push(editor.value);
  if (undo.length > 20) undo.shift();
  editor.value = fn(editor.value);
  update();
}
function prompt() {
  const list =
    $("practice-mode").value === "read"
      ? passages.filter((text) =>
          $("language").value === "hi"
            ? /[\u0900-\u097f]/.test(text)
            : $("language").value === "en"
              ? !/[\u0900-\u097f]/.test(text)
              : true,
        )
      : topics[$("category").value];
  let next = list[Math.floor(Math.random() * list.length)];
  if (next === $("prompt").value)
    next = list[(list.indexOf(next) + 1) % list.length];
  $("prompt").value = next;
}
function download(name, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function timeline() {
  const query = $("search-recording").value.toLocaleLowerCase();
  $("timeline").replaceChildren();
  for (const segment of segments) {
    if (query && !segment.text.toLocaleLowerCase().includes(query)) continue;
    const row = document.createElement("div");
    row.className = "segment";
    const button = document.createElement("button");
    button.className = "button";
    button.textContent = `${Math.floor(segment.start / 60)}:${String(Math.floor(segment.start) % 60).padStart(2, "0")} — listen`;
    button.onclick = () => {
      $("playback").currentTime = segment.start;
      $("playback")
        .play()
        .catch(() => tell("Press Play to hear this moment."));
    };
    const text = document.createElement("textarea");
    text.rows = 2;
    text.value = segment.text;
    text.setAttribute("aria-label", `Caption at ${segment.start} seconds`);
    text.oninput = () => (segment.text = text.value.slice(0, 6000));
    row.append(button, text);
    $("timeline").append(row);
  }
}
function bookmarks() {
  $("bookmarks").replaceChildren();
  for (const time of marks) {
    const b = document.createElement("button");
    b.className = "button";
    b.textContent = `Bookmark ${time}s`;
    b.onclick = () => {
      $("playback").currentTime = time;
      $("playback")
        .play()
        .catch(() => {});
    };
    $("bookmarks").append(b);
  }
}
function library() {
  try {
    const data = JSON.parse(localStorage.getItem("vani-library") || "[]");
    return Array.isArray(data)
      ? data
          .filter(
            (n) => n && typeof n.text === "string" && n.text.length <= 12000,
          )
          .slice(-20)
      : [];
  } catch {
    return [];
  }
}
function showLibrary() {
  const query = $("library-search").value.toLowerCase();
  $("library").replaceChildren();
  for (const note of library().filter((n) =>
    n.text.toLowerCase().includes(query),
  )) {
    const row = document.createElement("div");
    row.className = "saved-note";
    const title = document.createElement("p");
    title.textContent = `${note.date || "Saved note"} · ${note.text.slice(0, 120)}`;
    const load = document.createElement("button");
    load.className = "button";
    load.textContent = "Load text";
    load.onclick = () => edit(() => note.text);
    const remove = document.createElement("button");
    remove.className = "button";
    remove.textContent = "Delete";
    remove.onclick = () => {
      try {
        localStorage.setItem(
          "vani-library",
          JSON.stringify(library().filter((n) => n.id !== note.id)),
        );
        showLibrary();
      } catch {
        tell("Could not update device storage.");
      }
    };
    row.append(title, load, remove);
    if (note.metrics) {
      const p = document.createElement("p");
      p.textContent = `${note.metrics.wpm} estimated words/min · ${note.metrics.longest_quiet}s longest quiet interval`;
      row.append(p);
    }
    $("library").append(row);
  }
}
$("new-prompt").onclick = prompt;
$("practice-mode").onchange = prompt;
$("category").onchange = prompt;
$("try-again").onclick = () => {
  if (busy) return;
  previous = lastMetrics
    ? { ...lastMetrics, prompt: lastPrompt, mode: lastMode }
    : null;
  edit(() => "");
  $("record").focus();
  tell("Same prompt is ready. Press Start recording for the next attempt.");
};
$("bookmark").onclick = () => {
  const [m, s] = $("timer").textContent.split(":").map(Number);
  const time = document.body.classList.contains("is-recording")
    ? m * 60 + s
    : Math.floor($("playback").currentTime || 0);
  marks.push(time);
  bookmarks();
};
$("undo-edit").onclick = () => {
  if (!busy && undo.length) {
    editor.value = undo.pop();
    update();
  }
};
$("replace-all").onclick = () => {
  const find = $("find-word").value;
  if (find) edit((s) => s.split(find).join($("replace-word").value));
};
$("apply-glossary").onclick = () =>
  edit((s) => {
    for (const line of $("glossary").value.split("\n")) {
      const [wrong, right] = line.split("→").map((x) => x.trim());
      if (wrong && right) s = s.split(wrong).join(right);
    }
    return s;
  });
$("search-recording").oninput = timeline;
$("export-txt").onclick = () => download("vani.txt", editor.value);
for (const format of ["srt", "vtt"])
  $(`export-${format}`).onclick = () => {
    if (!segments.length)
      return tell("Transcribe audio first to create timed captions.");
    download(`vani.${format}`, captions(segments, format));
  };
$("export-bundle").onclick = () =>
  download(
    "vani-review.json",
    JSON.stringify(
      {
        transcript: editor.value,
        segments,
        bookmarks: marks,
        measurements: lastMetrics,
        timing: "ASR chunk boundaries; not word-level alignment",
      },
      null,
      2,
    ),
    "application/json",
  );
$("save-note").onclick = () => {
  if (!$("save-consent").checked)
    return tell("Enable device-only saving first.");
  if (!editor.value.trim()) return tell("There is no text to save.");
  try {
    const notes = library();
    notes.push({
      id: crypto.randomUUID(),
      date: new Date().toLocaleString(),
      text: editor.value.slice(0, 12000),
      metrics: lastMetrics,
      prompt: lastPrompt,
    });
    localStorage.setItem("vani-library", JSON.stringify(notes.slice(-20)));
    showLibrary();
    tell("Saved on this device. Audio was not saved.");
  } catch {
    tell("Device storage is unavailable or full. Download your text instead.");
  }
};
$("delete-library").onclick = () => {
  try {
    localStorage.removeItem("vani-library");
    showLibrary();
    tell("Saved notes deleted from this browser.");
  } catch {
    tell("Device storage is unavailable.");
  }
};
$("library-search").oninput = showLibrary;
let batchCanceled = false;
$("batch-cancel").onclick = () => {
  batchCanceled = true;
  if (busy) $("cancel").click();
};
$("batch-start").onclick = async () => {
  if (busy) return;
  const files = [...$("batch-files").files];
  if (files.length > 5) return tell("Select at most five files.");
  batchCanceled = false;
  $("batch-status").replaceChildren();
  $("batch-start").disabled = true;
  try {
    for (const file of files) {
      if (batchCanceled) break;
      const item = document.createElement("li");
      item.textContent = `${file.name}: processing`;
      $("batch-status").append(item);
      let succeeded = false;
      const done = () => {
        succeeded = true;
      };
      document.addEventListener("vani:result", done, { once: true });
      await transcribeAudio(file, file.name, $("language").value);
      document.removeEventListener("vani:result", done);
      item.textContent = `${file.name}: ${succeeded ? "completed (text added above)" : "not completed; see status"}`;
    }
  } finally {
    $("batch-start").disabled = false;
  }
};
document.addEventListener("vani:phase", (event) => {
  busy = event.detail !== "idle";
  for (const id of [
    "practice-mode",
    "category",
    "duration",
    "prompt",
    "new-prompt",
    "clip-start",
    "clip-end",
  ])
    $(id).disabled = busy;
  if (event.detail === "requesting") {
    lastPrompt = $("prompt").value;
    lastMode = $("practice-mode").value;
    marks = [];
    bookmarks();
  }
});
document.addEventListener("vani:result", (event) => {
  const { result, samples } = event.detail;
  segments = event.detail.segments;
  timeline();
  lastMetrics = measurements(samples, 16000, result.text);
  const reading = $("practice-mode").value === "read";
  const match = reading ? agreement($("prompt").value, result.text) : null;
  lastMetrics.agreement = match;
  const m = lastMetrics;
  let report = `${m.seconds}s recorded · ${m.words} recognized words · ${m.wpm} estimated words/min · ${m.quiet.length} quiet intervals ≥0.8s · longest ${m.longest_quiet}s. Possible um/uh/erm mentions: ${m.possible_fillers} (ASR can omit fillers).`;
  if (reading)
    report += ` Reference agreement: ${match}% (text edit distance, NOT pronunciation accuracy; review transcription first).`;
  if (reading) {
    const diff = referenceDiff($("prompt").value, result.text);
    report += ` Reference words absent from recognition: ${diff.missing.slice(0, 12).join(", ") || "none"}. Extra/repeated recognized words: ${diff.extra.length}. Recognition errors can affect both.`;
  }
  report +=
    " Quiet detection uses an amplitude threshold, not speech diagnosis. For your next try: " +
    (m.longest_quiet > 3
      ? "review the longest quiet interval and practise that transition."
      : "open with one clear point and finish with a conclusion.");
  $("practice-report").textContent = report;
  if (
    previous &&
    previous.prompt === $("prompt").value &&
    previous.mode === $("practice-mode").value
  )
    $("comparison").textContent =
      `Previous → current: ${previous.wpm} → ${m.wpm} estimated words/min; ${previous.longest_quiet}s → ${m.longest_quiet}s longest quiet interval. Faster is not automatically better.`;
  else
    $("comparison").textContent =
      "Retry the same prompt to compare attempts. Save an attempt to keep it on this device.";
  lastPrompt = $("prompt").value;
  lastMode = $("practice-mode").value;
});
$("ai-run").onclick = async () => {
  if (!$("ai-consent").checked)
    return ($("ai-status").textContent =
      "Enable consent before sending text to Gemini.");
  if (!editor.value.trim())
    return ($("ai-status").textContent = "Add a transcript first.");
  $("ai-run").disabled = true;
  $("ai-status").textContent = "Requesting an AI suggestion…";
  try {
    const body = {
      text: editor.value,
      action: $("ai-action").value,
      context: $("prompt").value,
      language: $("ai-language").value,
      consent: true,
    };
    const config = await (await fetch("./config.json")).json();
    let result;
    if (config.space) {
      const { Client } =
        await import("https://cdn.jsdelivr.net/npm/@gradio/client@2.8.0/dist/index.min.js");
      const client = await Client.connect(config.space);
      result = (
        await client.predict("/assist", {
          text: body.text,
          action: body.action,
          context: body.context,
          language: body.language,
          consent: true,
        })
      ).data[0];
    } else {
      const response = await fetch("./api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45000),
      });
      result = await response.json();
      if (!response.ok)
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "AI request rejected.",
        );
    }
    $("ai-output").value = result.text;
    $("ai-status").textContent =
      "AI suggestion. Check meaning, names and dates; your original is unchanged.";
  } catch (error) {
    $("ai-status").textContent =
      error.message || "AI unavailable. Your text is unchanged.";
  } finally {
    $("ai-run").disabled = false;
  }
};
$("copy-ai").onclick = () =>
  navigator.clipboard.writeText($("ai-output").value).catch(() => {
    $("ai-output").focus();
    $("ai-output").select();
    $("ai-status").textContent = "Press Ctrl+C to copy the selected draft.";
  });
prompt();
showLibrary();
