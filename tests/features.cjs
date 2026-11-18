const { chromium } = require("../tmp/qa/node_modules/playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
  });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
    await p.addInitScript(() => {
      window.SpeechRecognition = class {
        start() {
          window.fakeRecognition = this;
        }
        abort() {}
      };
    });
    await p.route("**/api/assist", (r) => {
      const body = r.request().postDataJSON();
      assert.ok(["prompt", "clean"].includes(body.action));
      assert.equal(body.consent, true);
      return r.fulfill({
        json: {
          text:
            body.action === "prompt"
              ? "Goal: Build a study planner."
              : "Build a study planner.",
        },
      });
    });
    await p.goto("http://127.0.0.1:8787/#dictate");
    await p.waitForFunction(
      () => document.getElementById("make-prompt").onclick,
    );
    assert.equal(await p.locator("nav a").first().textContent(), "Practice");
    await p.locator("#transcript").fill("Build a study planner");
    await p.locator("#make-prompt").click();
    await p.waitForFunction(() =>
      document.getElementById("writing-output").value.startsWith("Goal:"),
    );
    assert.equal(
      await p.locator("#transcript").inputValue(),
      "Build a study planner",
    );
    await p.locator("#clean-text").click();
    await p.waitForFunction(
      () =>
        document.getElementById("writing-output").value ===
        "Build a study planner.",
    );
    await p.evaluate(() => {
      document.dispatchEvent(
        new CustomEvent("vani:phase", { detail: "recording" }),
      );
      window.fakeRecognition.onresult({
        results: [[{ transcript: "Words arriving live" }]],
      });
    });
    assert.equal(
      await p.locator("#live-draft").textContent(),
      "Words arriving live",
    );
    await p.evaluate(() => {
      const old = window.fakeRecognition;
      document.dispatchEvent(new CustomEvent("vani:phase", { detail: "idle" }));
      old.onresult({ results: [[{ transcript: "stale" }]] });
    });
    assert.equal(
      await p.locator("#live-draft").textContent(),
      "Words arriving live",
    );
    await p.getByRole("link", { name: "Practice", exact: true }).click();
    await p.locator("#practice-panel").waitFor({ state: "visible" });
    await p.locator("#new-prompt").click();
    await p.evaluate(() => {
      document.dispatchEvent(
        new CustomEvent("vani:result", {
          detail: {
            result: { text: Array(120).fill("example").join(" ") },
            samples: new Float32Array(16000 * 60).fill(0.1),
          },
        }),
      );
    });
    assert.equal(await p.locator("#delivery-score").textContent(), "80");
    assert.match(await p.locator("#score-explanation").textContent(), /20\/40/);
    await p.locator("#try-again").click();
    await p.evaluate(() => {
      document.dispatchEvent(
        new CustomEvent("vani:result", {
          detail: {
            result: { text: Array(240).fill("example").join(" ") },
            samples: new Float32Array(16000 * 120).fill(0.1),
          },
        }),
      );
    });
    assert.equal(await p.locator("#delivery-score").textContent(), "100");
    assert.match(
      await p.locator("#score-change").textContent(),
      /\+20 percentage points/,
    );
    await p.locator("#transcript").fill(Array(240).fill("example").join(" "));
    await p.evaluate(() => document.activeElement.blur());
    await p.screenshot({
      path: "docs/screenshots/vani-score.png",
      fullPage: true,
    });
    await p.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await p.getByRole("link", { name: "Workspace", exact: true }).isVisible(),
      true,
    );
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await p.screenshot({ path: "tmp/qa/score-mobile.png", fullPage: true });
    console.log(
      "Writing tools, live event lifecycle, score and same-attempt comparison checks passed (mocked).",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
