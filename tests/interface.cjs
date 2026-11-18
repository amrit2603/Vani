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
    await p.goto("http://127.0.0.1:8787/#practice", {
      waitUntil: "networkidle",
    });
    await p.waitForFunction(() => document.getElementById("card-flip").onclick);
    assert.equal(await p.locator("#feature-card").isVisible(), true);
    assert.equal(await p.locator("#live-enabled").count(), 0);
    await p.locator("#card-flip").click();
    assert.equal(
      await p.locator("#card-flip").getAttribute("aria-pressed"),
      "true",
    );
    await p.locator("#card-expand").click();
    assert.equal(
      await p.locator("#card-expand").getAttribute("aria-expanded"),
      "true",
    );
    await p.locator("#card-expand").click();
    await p.evaluate(() => document.activeElement.blur());
    await p.waitForTimeout(750);
    await p.screenshot({
      path: "docs/screenshots/vani-feature-card.png",
      fullPage: true,
    });
    await p.locator("#card-close").click();
    await p.locator("#feature-card").waitFor({ state: "hidden" });
    await p.getByRole("link", { name: "Workspace", exact: true }).click();
    await p.locator("#writing-tools").waitFor({ state: "visible" });
    assert.equal(await p.locator("#feature-card").isVisible(), false);
    const featured = await p.locator("#writing-tools").boundingBox(),
      editor = await p.locator(".workspace-grid").boundingBox();
    assert.ok(featured.y < editor.y);
    await p.locator("#card-open").click();
    await p.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.equal(
      await p.getByRole("link", { name: "Practice", exact: true }).isVisible(),
      true,
    );
    assert.equal(
      await p.getByRole("link", { name: "Workspace", exact: true }).isVisible(),
      true,
    );
    await p.waitForTimeout(750);
    await p.screenshot({ path: "tmp/qa/card-mobile.png", fullPage: true });
    console.log(
      "Card flip/expand/dismiss/reopen, route persistence, featured writing and mobile layout passed.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
