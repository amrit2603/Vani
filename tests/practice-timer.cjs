const { chromium } = require("../tmp/qa/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    executablePath:
      process.env.VANI_BROWSER ||
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  try {
    const page = await browser.newPage({ permissions: ["microphone"] });
    page.on("dialog", (d) => d.accept());
    await page.addInitScript(() => {
      const schedule = window.setTimeout.bind(window);
      window.practiceDeadlines = [];
      window.setTimeout = (fn, delay, ...args) => {
        if ([120000, 180000, 300000].includes(delay)) {
          window.practiceDeadlines.push(delay);
          return schedule(fn, 1000, ...args);
        }
        return schedule(fn, delay, ...args);
      };
    });
    await page.route("**/api/transcribe", (r) =>
      r.fulfill({
        json: {
          text: "An example with a clear conclusion.",
          language: "English",
        },
      }),
    );
    await page.goto("http://127.0.0.1:8787/#practice");
    for (const seconds of [120, 180, 300]) {
      await page.locator("#duration").selectOption(String(seconds));
      assert.equal(
        await page.locator("#timer").textContent(),
        `0${seconds / 60}:00 left`,
      );
      await page
        .getByRole("button", { name: "New topic", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Start recording", exact: true })
        .click();
      await page.waitForFunction(
        () => !document.getElementById("practice-result").hidden,
      );
      assert.equal(await page.locator("#timer").textContent(), "00:00 left");
      assert.ok(await page.locator("#transcript").inputValue());
      assert.equal(await page.locator("#playback").isVisible(), true);
    }
    assert.deepEqual(
      await page.evaluate(() => window.practiceDeadlines),
      [120000, 180000, 300000],
    );
    const decoded = await page.evaluate(async () => {
      const { decode, wav } = await import("./speech-tools.mjs");
      const trimmed = await decode(wav(new Float32Array(16000 * 300.5)));
      let rejected = false;
      try {
        await decode(wav(new Float32Array(16000 * 301.2)));
      } catch {
        rejected = true;
      }
      return { samples: trimmed.length, rejected };
    });
    assert.deepEqual(decoded, { samples: 4800000, rejected: true });
    fs.writeFileSync(
      "docs/practice-timer-check.json",
      JSON.stringify(
        {
          seconds: [120, 180, 300],
          auto_stop: true,
          transcript_and_playback: true,
          recorder_tail_capped_at_300_seconds: true,
          limits:
            "Requested deadline values verified; browser test accelerates each stop timer to one second. Synthetic microphone and mocked ASR; not real five-minute hardware recordings.",
        },
        null,
        2,
      ),
    );
    console.log(
      "2/3/5-minute deadline, countdown and automatic-stop checks passed.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
