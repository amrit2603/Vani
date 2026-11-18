const { chromium } = require("../tmp/qa/node_modules/playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
  });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto("http://127.0.0.1:8787/", { waitUntil: "networkidle" });
    await p.waitForFunction(
      () => document.getElementById("penguin").readyState >= 3,
    );
    assert.equal(await p.locator(".brand .om-mark").textContent(), "ॐ");
    assert.equal(await p.locator("nav a").first().textContent(), "Workspace");
    assert.equal(await p.locator("#feature-card").isVisible(), true);
    await p.locator("#motion-toggle").click();
    await p.waitForFunction(
      () =>
        document.getElementById("motion-label").textContent ===
        "Play animation",
    );
    const stopped = await p.locator("#penguin").evaluate((v) => v.currentTime);
    await p.waitForTimeout(300);
    assert.equal(
      await p.locator("#penguin").evaluate((v) => v.currentTime),
      stopped,
    );
    await p.locator("#motion-toggle").click();
    await p.waitForFunction(() => !document.getElementById("penguin").paused);
    await p.waitForTimeout(350);
    assert.ok(
      await p
        .locator("#penguin")
        .evaluate((v, t) => v.currentTime > t, stopped),
    );
    assert.equal(
      await p.locator("#motion-label").textContent(),
      "Pause animation",
    );
    await p.screenshot({
      path: "docs/screenshots/vani-landing.png",
      fullPage: true,
    });
    await p.getByRole("link", { name: "Workspace", exact: true }).click();
    await p.locator("#workspace-intro").waitFor({ state: "visible" });
    await p.waitForTimeout(450);
    await p.screenshot({
      path: "docs/screenshots/vani-workspace.png",
      fullPage: true,
    });
    await p.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await p.screenshot({ path: "tmp/qa/brand-mobile.png", fullPage: true });
    const reduced = await b.newPage({ reducedMotion: "reduce" });
    await reduced.goto("http://127.0.0.1:8787/");
    await reduced
      .waitForFunction(
        () =>
          document.getElementById("penguin").paused &&
          document.getElementById("motion-label").textContent ===
            "Play animation",
      )
      .catch(async (error) => {
        console.log(
          await reduced.evaluate(() => ({
            paused: document.getElementById("penguin").paused,
            label: document.getElementById("motion-label").textContent,
            autoplay: document.getElementById("penguin").autoplay,
            ready: document.getElementById("penguin").readyState,
            reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
          })),
        );
        throw error;
      });
    assert.equal(
      await reduced
        .locator(".card-flip")
        .evaluate((e) => getComputedStyle(e).transitionDuration),
      "0s",
    );
    console.log(
      "Om branding, workspace-first, home feature card, actual play/pause state, mobile and reduced-motion passed.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
