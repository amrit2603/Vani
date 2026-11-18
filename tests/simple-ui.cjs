const { chromium } = require("../tmp/qa/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const b = await chromium.launch({
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
    const p = await b.newPage({
      viewport: { width: 1440, height: 900 },
      permissions: ["microphone"],
    });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("dialog", (d) => d.accept());
    let text = "A useful idea with an example.",
      aiCalls = 0,
      delayAI = false;
    await p.addInitScript(() =>
      localStorage.setItem("vani-library", "existing notes"),
    );
    await p.route("**/api/transcribe", (r) =>
      r.fulfill({ json: { text, language: "English", audio_seconds: 1 } }),
    );
    await p.route("**/api/assist", async (r) => {
      aiCalls++;
      const body = r.request().postDataJSON();
      assert.equal(body.action, "coach");
      assert.equal(body.consent, true);
      assert.equal(body.text, text);
      if (delayAI) await new Promise((resolve) => setTimeout(resolve, 400));
      return r.fulfill({
        json: { text: "Add one concrete example and a clear ending." },
      });
    });
    await p.goto("http://127.0.0.1:8787/#dictate", {
      waitUntil: "networkidle",
    });
    await p.waitForFunction(
      () => document.getElementById("new-prompt").onclick,
    );
    assert.equal(await p.locator("nav a").count(), 2);
    assert.equal(await p.locator(".studio-tools").count(), 0);
    assert.equal(await p.locator("#batch-start").count(), 0);
    assert.equal(await p.locator("#audio-file").count(), 0);
    await p.screenshot({
      path: "docs/screenshots/vani-workspace.png",
      fullPage: true,
    });
    await p.locator("#transcript").fill("Keep my workspace draft.");
    await p.getByRole("link", { name: "Practice", exact: true }).click();
    assert.equal(await p.locator("#workspace-intro").isVisible(), false);
    assert.equal(await p.locator("#transcript").inputValue(), "");
    assert.equal(await p.locator("#record").isDisabled(), true);
    assert.equal(await p.locator("#prompt").textContent(), "");
    assert.equal(await p.locator("#practice-result").isVisible(), false);
    await p.screenshot({
      path: "docs/screenshots/vani-practice.png",
      fullPage: true,
    });
    await p.locator("#duration").selectOption("300");
    assert.equal(await p.locator("#prompt").textContent(), "");
    await p.locator("#new-prompt").click();
    const prompt = await p.locator("#prompt").textContent();
    assert.ok(prompt.length > 20);
    assert.equal(await p.locator("#record").isEnabled(), true);
    async function speak() {
      await p.locator("#record").click();
      await p.getByRole("button", { name: "Stop & transcribe" }).waitFor();
      await p.waitForTimeout(700);
      await p.locator("#record").click();
      await p.waitForFunction(
        () => !document.getElementById("practice-result").hidden,
      );
      await p.getByRole("button", { name: "Start recording" }).waitFor();
    }
    await speak();
    assert.equal(await p.locator(".transcript-panel").isVisible(), false);
    assert.match(
      await p.locator("#practice-report").textContent(),
      /at least 10 seconds/,
    );
    assert.equal(aiCalls, 0);
    await p.locator("#ai-run").click();
    await p.waitForFunction(() =>
      document
        .getElementById("ai-output")
        .textContent.includes("concrete example"),
    );
    assert.equal(aiCalls, 1);
    await p.locator("#review-transcript").click();
    assert.equal(await p.locator(".transcript-panel").isVisible(), true);
    assert.equal(await p.locator("#transcript").inputValue(), text);
    await p.locator("#try-again").click();
    assert.equal(await p.locator("#prompt").textContent(), prompt);
    assert.equal(await p.locator("#practice-result").isVisible(), false);
    assert.equal(await p.locator("#transcript").inputValue(), "");
    assert.equal(
      await p.locator("#review-transcript").textContent(),
      "Review transcript",
    );
    await speak();
    assert.match(await p.locator("#comparison").textContent(), /Last attempt/);
    delayAI = true;
    await p.locator("#ai-run").click();
    await p.waitForFunction(() =>
      document.getElementById("ai-status").textContent.includes("Preparing"),
    );
    await p.getByRole("link", { name: "Workspace", exact: true }).click();
    assert.equal(
      await p.locator("#transcript").inputValue(),
      "Keep my workspace draft.",
    );
    assert.equal(await p.locator("#practice-result").isVisible(), false);
    await p.getByRole("link", { name: "Practice", exact: true }).click();
    await p.waitForTimeout(500);
    assert.equal(await p.locator("#ai-output").textContent(), "");
    assert.equal(await p.locator("#ai-run").isEnabled(), true);
    await p.locator("#practice-mode").selectOption("read");
    assert.equal(await p.locator("#prompt").textContent(), "");
    assert.equal(await p.locator("#record").isDisabled(), true);
    await p.locator("#new-prompt").click();
    text = await p.locator("#prompt").textContent();
    await speak();
    assert.match(await p.locator("#practice-tip").textContent(), /100%/);
    await p.evaluate(() => {
      document.activeElement.blur();
      scrollTo(0, 0);
    });
    await p.screenshot({ path: "tmp/qa/simple-practice.png", fullPage: true });
    await p.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await p.screenshot({
      path: "tmp/qa/simple-practice-mobile.png",
      fullPage: true,
    });
    assert.equal(
      await p.getByRole("link", { name: "Practice", exact: true }).isVisible(),
      true,
    );
    assert.deepEqual(errors, []);
    assert.equal(
      await p.evaluate(() => localStorage.getItem("vani-library")),
      "existing notes",
    );
    fs.writeFileSync(
      "docs/simple-ui-check.json",
      JSON.stringify(
        {
          tests: [
            "two-navigation-choices",
            "no-advanced-controls",
            "explicit-prompt-generation",
            "independent-room-drafts",
            "record-and-feedback",
            "explicit-AI-coaching",
            "navigation-discards-pending-AI",
            "existing-local-notes-preserved",
            "review-transcript",
            "same-prompt-retry",
            "read-aloud-reference-match",
            "mobile-no-overflow",
          ],
          errors,
          limits:
            "Synthetic microphone with mocked ASR and AI network replies.",
        },
        null,
        2,
      ),
    );
    console.log("Simplified workspace and practice checks passed.");
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
