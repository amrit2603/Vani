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
    const p = await b.newPage({
      viewport: { width: 1440, height: 900 },
      permissions: ["microphone"],
    });
    p.on("dialog", (d) => d.accept());
    await p.goto("http://127.0.0.1:8787/", { waitUntil: "networkidle" });
    await p.waitForFunction(() => document.getElementById("card-open").onclick);
    assert.equal(await p.locator("#feature-card").isVisible(), false);
    assert.equal(await p.locator("#card-open").isVisible(), false);
    await p.getByRole("link", { name: "Workspace", exact: true }).click();
    await p.locator("#workspace-intro").waitFor({ state: "visible" });
    await p.waitForTimeout(400);
    let box = await p.locator("#feature-card").boundingBox();
    const heading = await p.locator(".workspace-top").boundingBox();
    assert.ok(box.y > heading.y + heading.height);
    assert.equal(Math.round(1440 - box.x - box.width), 16);
    const before = await p.locator(".workspace-grid").boundingBox();
    await p.locator("#card-close").click();
    await p.locator("#feature-card").waitFor({ state: "hidden" });
    assert.deepEqual(before, await p.locator(".workspace-grid").boundingBox());
    await p.getByRole("link", { name: "Practice", exact: true }).click();
    await p.locator("#practice-panel").waitFor({ state: "visible" });
    assert.equal(await p.locator("#feature-card").isVisible(), false);
    await p.locator("#new-prompt").click();
    assert.equal(await p.locator("#feature-card").isVisible(), false);
    await p.locator("#record").click();
    await p.getByRole("button", { name: "Stop & transcribe" }).waitFor();
    await p.locator("#cancel").click();
    assert.equal(await p.locator("#feature-card").isVisible(), false);
    await p.reload();
    await p.locator("#practice-panel").waitFor({ state: "visible" });
    await p.waitForFunction(() => document.getElementById("card-open").onclick);
    assert.equal(await p.locator("#feature-card").isVisible(), false);
    await p.locator("#card-open").click();
    await p.waitForTimeout(400);
    await p.screenshot({
      path: "docs/screenshots/vani-feature-overlay.png",
      fullPage: true,
    });
    await p.setViewportSize({ width: 390, height: 844 });
    box = await p.locator("#feature-card").boundingBox();
    assert.ok(box.y >= 160);
    assert.equal(Math.round(390 - box.x - box.width), 16);
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await p.screenshot({ path: "tmp/qa/overlay-mobile.png", fullPage: true });
    await p.getByRole("link", { name: "Vani home", exact: true }).click();
    await p.locator("#home-view").waitFor({ state: "visible" });
    assert.equal(await p.locator("#feature-card").isVisible(), false);
    assert.equal(await p.locator("#card-open").isVisible(), false);
    console.log(
      "Once-per-tab session, no landing help, lower-right placement, topic/record/navigation/reload suppression and manual reopening passed.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
