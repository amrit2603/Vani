// Optional QA dependency: npm install --prefix tmp/qa playwright
const { chromium } = require('../tmp/qa/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const executablePath = process.env.VANI_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const browser = await chromium.launch({ executablePath, headless: true, args: [
    '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream',
  ] });
  try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 800 }, permissions: ['microphone', 'clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  let fail = false;
  let uploads = 0;
  await page.route('**/api/transcribe', async route => {
    assert.equal(route.request().method(), 'POST');
    assert.ok(route.request().postDataBuffer().length > 100);
    uploads++;
    await route.fulfill({ status: fail ? 422 : 200, json: fail ? { detail: 'No speech recognized. Try again.' } : {
      text: 'Hello. This is a short voice note.', language: 'English', audio_seconds: 2.5,
    } });
  });
  await page.goto('http://127.0.0.1:8787/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  assert.match(await page.title(), /Vani/);
  assert.match(await page.locator('#hero-title').textContent(), /वाणी.*VANI/);
  await page.getByRole('link', { name: 'Start dictating' }).click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.getByRole('button', { name: 'Stop & transcribe' }).waitFor();
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Stop & transcribe' }).click();
  await page.waitForFunction(() => document.getElementById('transcript').value.includes('short voice note'));
  await page.getByRole('button', { name: 'Copy text' }).click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /short voice note/);
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.getByRole('button', { name: 'Stop & transcribe' }).waitFor();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  const before = uploads;
  await page.waitForTimeout(300);
  assert.equal(uploads, before);
  assert.match(await page.locator('#status').textContent(), /canceled/);
  fail = true;
  await page.getByRole('button', {name:'Start recording'}).click();
  await page.getByRole('button', {name:'Stop & transcribe'}).waitFor();
  await page.waitForTimeout(700);
  await page.getByRole('button', {name:'Stop & transcribe'}).click();
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('No speech'));
  assert.match(await page.locator('#transcript').inputValue(), /short voice note/);
  fail = false;
  await page.getByRole('button', { name: /Try transcription again/ }).click();
  await page.waitForFunction(() => document.getElementById('transcript').value.split('short voice note').length === 3);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  assert.equal(await page.locator('#transcript').inputValue(), '');
  assert.equal(await page.locator('#word-count').textContent(), '0 words');
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.getByRole('button', { name: 'Stop & transcribe' }).waitFor();
  await page.getByRole('link', { name: 'Back home' }).click();
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => document.body.classList.contains('is-recording')), false);
  await page.screenshot({ path: 'tmp/qa/vani-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'tmp/qa/vani-mobile.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.getByRole('link', { name: 'Start dictating' }).click();
  await page.screenshot({ path: 'tmp/qa/vani-workspace-mobile.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  const result = { tests: ['record-stop', 'clipboard', 'cancel-no-upload', 'failure-preserves-text', 'retry-appends', 'clear', 'navigation-stops-mic', 'mobile-no-overflow'], errors,
    limits: 'Synthetic browser microphone with mocked transcription replies; real ASR is checked separately.' };
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync(path.join('docs', 'browser-check.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
