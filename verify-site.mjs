/**
 * One-shot headless verification of the portfolio dev build.
 * Run: node verify-site.mjs   (playwright resolved from impeccable repo)
 */
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/dibso/protfolio/impeccable-main/impeccable-main/package.json');
const { chromium } = require('playwright');

const URL = 'http://127.0.0.1:5173/';
const results = [];
const errors = [];

const browser = await chromium.launch({
  executablePath: 'C:/Users/dibso/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

// 1. Hero visible?
const heroOpacity = await page.$eval('.hero__title', (el) => getComputedStyle(el).opacity);
results.push(['hero visible on load', Number(heroOpacity) > 0.9]);

// 2. All five sections present?
const sections = await page.$$eval('section', (els) => els.length);
results.push(['5 sections mounted', sections >= 5]);

// 3. Scroll to About — skill blocks stagger in?
await page.evaluate(() => document.querySelector('#about').scrollIntoView());
await page.waitForTimeout(1300);
const skillsIn = await page.$$eval('.skill-block.reveal.is-in', (els) => els.length);
results.push(['skill blocks revealed (stagger)', skillsIn === 4]);

// 4. Scroll through the Experience folder stage — active card changes?
const stageInfo = await page.evaluate(async () => {
  const stage = document.querySelector('.folder-stage');
  const top = stage.getBoundingClientRect().top + scrollY;
  const total = stage.offsetHeight - innerHeight;
  const states = [];
  for (const f of [0.1, 0.45, 0.8]) {
    scrollTo(0, top + f * total);
    await new Promise((r) => setTimeout(r, 700));
    const visible = [...document.querySelectorAll('.folder-card')]
      .filter((c) => c.style.visibility !== 'hidden').length;
    const active = document.querySelector('.folder-tabs__tab.is-active')?.textContent ?? '';
    const cardOpaque = [...document.querySelectorAll('.folder-card')]
      .some((c) => c.style.visibility !== 'hidden' && Number(c.style.opacity) > 0.85);
    states.push({ f, visible, active, cardOpaque });
  }
  return states;
});
const activeTabs = new Set(stageInfo.map((s) => s.active));
results.push(['folder flips through cards while scrolling', activeTabs.size >= 2]);
results.push(['≤2 cards visible at once (no text bleed)', stageInfo.every((s) => s.visible <= 2)]);
results.push(['a fully opaque card at each stop', stageInfo.every((s) => s.cardOpaque)]);

// 5. Past the folder — section hides (exit fade)?
const exitOpacity = await page.evaluate(async () => {
  const stage = document.querySelector('.folder-stage');
  const top = stage.getBoundingClientRect().top + scrollY;
  scrollTo(0, top + stage.offsetHeight - innerHeight * 0.55);
  await new Promise((r) => setTimeout(r, 700));
  return Number(document.querySelector('.folder-sticky').style.opacity);
});
results.push(['folder fades out at stage end', exitOpacity < 0.6]);

// 6. Lazy sections (Projects/Contact) loaded + reveal?
await page.evaluate(() => document.querySelector('#projects').scrollIntoView());
await page.waitForTimeout(1400);
const projectsIn = await page.$$eval('.project.reveal.is-in', (els) => els.length);
results.push(['project cards revealed (lazy chunk)', projectsIn === 5]);

await page.evaluate(() => document.querySelector('#contact').scrollIntoView());
await page.waitForTimeout(1200);
const contactIn = await page.$eval('.contact h2', (el) => getComputedStyle(el).opacity);
results.push(['contact section revealed', Number(contactIn) > 0.9]);

// 7. Nav anchor click works?
await page.evaluate(() => scrollTo(0, 0));
await page.waitForTimeout(400);
await page.click('.nav__link[href="#projects"]');
await page.waitForTimeout(1200);
const nearProjects = await page.evaluate(() => {
  const r = document.querySelector('#projects').getBoundingClientRect();
  return Math.abs(r.top) < 200;
});
results.push(['nav link scrolls to section', nearProjects]);

await page.screenshot({ path: 'verify-hero.png' });
await browser.close();

let pass = 0, fail = 0;
for (const [name, ok] of results) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  ok ? pass++ : fail++;
}
console.log(`\n${pass}/${results.length} checks passed`);
if (errors.length) {
  console.log('\nCONSOLE/PAGE ERRORS:');
  errors.forEach((e) => console.log(' -', e));
} else {
  console.log('No console or page errors.');
}
process.exit(fail || errors.length ? 1 : 0);
