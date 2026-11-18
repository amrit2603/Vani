const { chromium } = require("../tmp/qa/node_modules/playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
  });
  try {
    const p = await b.newPage();
    await p.addInitScript(() => {
      window.workletStarts = 0;
      window.AudioContext = class {
        constructor() {
          window.workletStarts++;
          throw new Error("Hosted preview must not start");
        }
      };
    });
    await p.route("**/config.json", (r) =>
      r.fulfill({ json: { space: "shubhamsingh123/vani-speech" } }),
    );
    await p.goto("http://127.0.0.1:8787/#dictate", {
      waitUntil: "networkidle",
    });
    await p.evaluate(() =>
      document.dispatchEvent(
        new CustomEvent("vani:capture", { detail: { stream: null } }),
      ),
    );
    await p.waitForFunction(() =>
      document.getElementById("live-status").textContent.includes("final text"),
    );
    assert.equal(await p.evaluate(() => window.workletStarts), 0);
    console.log(
      "Hosted recurring GPU previews disabled; local inference path remains available.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
