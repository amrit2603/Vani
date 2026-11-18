const { chromium } = require("../tmp/qa/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const real = process.env.VANI_REAL_ASR === "1";
  const args = [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
  ];
  if (real) args.push("--use-file-for-fake-audio-capture=D:/Vani/tmp/demo.wav");
  const b = await chromium.launch({
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
    args,
  });
  try {
    const p = await b.newPage({ permissions: ["microphone"] });
    p.on("dialog", (d) => d.accept());
    await p.addInitScript(() => {
      window.SpeechRecognition = undefined;
      window.webkitSpeechRecognition = undefined;
    });
    let calls = 0;
    if (!real)
      await p.route("**/api/transcribe", (r) => {
        calls++;
        return r.fulfill({
          json: {
            text: "Hello this is a useful voice note.",
            language: "English",
          },
        });
      });
    await p.goto("http://127.0.0.1:8787/#dictate", {
      waitUntil: "networkidle",
    });
    await p.waitForFunction(
      () => document.getElementById("card-close").onclick,
    );
    await p.locator("#card-close").click();
    const start = Date.now();
    await p
      .getByRole("button", { name: "Start recording", exact: true })
      .click();
    await p.waitForFunction(
      () => document.getElementById("live-draft").textContent.trim().length > 0,
      null,
      { timeout: real ? 120000 : 15000 },
    );
    const first = (Date.now() - start) / 1000;
    assert.equal(
      await p.getByRole("button", { name: "Stop & transcribe" }).isVisible(),
      true,
    );
    const preview = await p.locator("#live-draft").textContent();
    console.log("Live text before Stop:", first, preview);
    await p.getByRole("button", { name: "Stop & transcribe" }).click();
    await p.waitForFunction(
      () => document.getElementById("transcript").value.trim().length > 0,
      null,
      { timeout: real ? 320000 : 15000 },
    );
    assert.equal(await p.locator("#playback").isVisible(), true);
    if (!real) assert.ok(calls >= 2);
    const result = {
      real_qwen: real,
      first_preview_seconds: first,
      preview,
      final_text: await p.locator("#transcript").inputValue(),
      limits: real
        ? "Synthetic English microphone on this CPU, not a latency promise or natural Hindi/Hinglish test."
        : "Real AudioWorklet capture with mocked ASR replies.",
    };
    fs.writeFileSync(
      real ? "docs/live-qwen-evidence.json" : "docs/live-flow-check.json",
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result));
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
