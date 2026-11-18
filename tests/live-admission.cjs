const { chromium } = require("../tmp/qa/node_modules/playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  try {
    const p = await b.newPage({ permissions: ["microphone"] });
    p.on("dialog", (d) => d.accept());
    await p.addInitScript(() => {
      window.SpeechRecognition = undefined;
      window.webkitSpeechRecognition = undefined;
      const Native = window.AudioWorkletNode;
      window.AudioWorkletNode = class extends Native {
        constructor(...args) {
          super(...args);
          window.testProcessor = this;
        }
      };
    });
    let calls = 0,
      active = 0,
      max = 0;
    await p.route("**/api/transcribe", async (r) => {
      calls++;
      active++;
      max = Math.max(max, active);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await r.fulfill({
        json: { text: "A complete final voice note.", language: "English" },
      });
      active--;
    });
    await p.goto("http://127.0.0.1:8787/#dictate");
    await p.locator("#card-close").click();
    await p
      .getByRole("button", { name: "Start recording", exact: true })
      .click();
    await p.waitForFunction(() => window.testProcessor?.port.onmessage);
    await p.evaluate(() => {
      for (let i = 0; i < 10; i++)
        window.testProcessor.port.onmessage({
          data: new Float32Array(64000).fill(0.1),
        });
    });
    await p.getByRole("button", { name: "Stop & transcribe" }).click();
    await p.waitForFunction(
      () => document.getElementById("transcript").value.trim().length,
    );
    await p
      .getByRole("button", { name: "Start recording", exact: true })
      .waitFor();
    assert.equal(max, 1);
    assert.equal(calls, 2);
    console.log(
      "Stop discards queued previews and waits for the active preview before final ASR; no overlapping requests.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
