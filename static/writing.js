const $ = (id) => document.getElementById(id);
let controller;
let revision = 0;
function reset() {
  revision++;
  controller?.abort();
  controller = null;
  $("writing-status").textContent = "";
  $("writing-output").value = "";
  $("writing-output").hidden = true;
  $("copy-writing").hidden = true;
  for (const id of ["make-prompt", "clean-text"]) $(id).disabled = false;
}
document.addEventListener("vani:route", reset);
$("transcript").addEventListener("input", reset);
document.addEventListener("vani:result", reset);
async function run(action) {
  const text = $("transcript").value.trim();
  if (!text || text.length > 12000) {
    $("writing-status").textContent = "Add 1–12,000 characters of text first.";
    return;
  }
  reset();
  const id = revision;
  controller = new AbortController();
  const pending = controller;
  const signal = pending.signal;
  const timeout = setTimeout(() => pending.abort(), 45000);
  for (const name of ["make-prompt", "clean-text"]) $(name).disabled = true;
  $("writing-status").textContent = "Preparing a suggestion…";
  try {
    const config = await (await fetch("./config.json", { signal })).json();
    const body = {
      text,
      action,
      context: "",
      language: $("language").value === "hi" ? "Hindi" : "English",
      consent: true,
    };
    let result;
    if (config.space) {
      const { Client } =
        await import("https://cdn.jsdelivr.net/npm/@gradio/client@2.8.0/dist/index.min.js");
      if (signal.aborted) throw new Error("Request stopped.");
      const client = await Client.connect(config.space);
      result = (
        await Promise.race([
          client.predict("/assist", body),
          new Promise((_, reject) => {
            if (signal.aborted) reject(new Error("Request stopped."));
            else
              signal.addEventListener(
                "abort",
                () => reject(new Error("Request stopped.")),
                { once: true },
              );
          }),
        ])
      ).data[0];
    } else {
      const response = await fetch("./api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      result = await response.json();
      if (!response.ok)
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "AI unavailable. Try later.",
        );
    }
    if (id !== revision) return;
    if (typeof result.text !== "string" || !result.text.trim())
      throw new Error("No usable suggestion returned.");
    $("writing-output").value = result.text;
    $("writing-output").hidden = false;
    $("copy-writing").hidden = false;
    $("writing-status").textContent =
      "Review before using. Your original text is unchanged.";
  } catch (error) {
    if (id === revision)
      $("writing-status").textContent = signal.aborted
        ? "Request stopped. Your text is safe."
        : error.message;
  } finally {
    clearTimeout(timeout);
    if (id === revision) {
      controller = null;
      for (const name of ["make-prompt", "clean-text"])
        $(name).disabled = false;
    }
  }
}
$("make-prompt").onclick = () => run("prompt");
$("clean-text").onclick = () => run("clean");
$("copy-writing").onclick = async () => {
  try {
    await navigator.clipboard.writeText($("writing-output").value);
    $("writing-status").textContent = "Copied.";
  } catch {
    $("writing-status").textContent = "Select the result and copy manually.";
  }
};
