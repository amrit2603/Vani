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
    await p.waitForFunction(() => document.getElementById("card-open").onclick);
    assert.equal(await p.locator("#feature-card").isVisible(), false);
    assert.equal(await p.locator("#card-open").isVisible(), true);
    const help = await p.locator("#card-open").boundingBox(),
      motion = await p.locator("#motion-toggle").boundingBox();
    assert.ok(help.y > motion.y);
    await p.locator("#card-open").click();
    await p.locator("#workspace-intro").waitFor({ state: "visible" });
    await p.waitForTimeout(400);
    let box = await p.locator("#feature-card").boundingBox();
    assert.equal(Math.round(box.y), 90);
    assert.equal(Math.round(1440 - box.x - box.width), 16);
    const before = await p.locator(".workspace-grid").boundingBox();
    await p.locator("#card-close").click();
    await p.locator("#feature-card").waitFor({ state: "hidden" });
    const after = await p.locator(".workspace-grid").boundingBox();
    assert.deepEqual(before, after);
    await p.getByRole("link", { name: "Practice", exact: true }).click();
    await p.locator("#practice-panel").waitFor({ state: "visible" });
    await p.waitForTimeout(400);
    assert.equal(await p.locator("#feature-card").isVisible(), true);
    await p.screenshot({
      path: "docs/screenshots/vani-feature-overlay.png",
      fullPage: true,
    });
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForTimeout(350);
    box = await p.locator("#feature-card").boundingBox();
    assert.equal(Math.round(box.y), 90);
    assert.equal(Math.round(390 - box.x - box.width), 16);
    assert.equal(
      await p
        .locator("#feature-card")
        .evaluate((e) => getComputedStyle(e).position),
      "fixed",
    );
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await p.screenshot({ path: "tmp/qa/overlay-mobile.png", fullPage: true });
    await p.getByRole("link", { name: "Vani home", exact: true }).click();
    await p.locator("#home-view").waitFor({ state: "visible" });
    assert.equal(await p.locator("#feature-card").isVisible(), false);
    console.log(
      "Landing hidden card + preserved help, room entry, fixed top-right overlay, no layout shift, X and mobile checks passed.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
