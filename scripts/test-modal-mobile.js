/**
 * QA del modal en MÓVIL (390x844, táctil): ¿cabe? ¿se puede scrollear dentro?
 * Uso: node scripts/test-modal-mobile.js
 */
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8777/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  await page.locator('.p-card').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.locator('.p-card').first().click({ position: { x: 180, y: 140 } });
  await page.waitForTimeout(1200);

  const geo = await page.evaluate(() => {
    const dlg = document.querySelector('.p-modal');
    const panel = document.querySelector('.p-modal__panel');
    const pr = panel.getBoundingClientRect();
    const dr = dlg.getBoundingClientRect();
    return {
      viewport: { w: innerWidth, h: innerHeight },
      dialog: { top: Math.round(dr.top), bottom: Math.round(dr.bottom), h: Math.round(dr.height) },
      panel: {
        h: Math.round(pr.height),
        scrollH: panel.scrollHeight,
        clientH: panel.clientHeight,
        needsScroll: panel.scrollHeight > panel.clientHeight + 4,
        canScroll: (() => { panel.scrollTop = 200; const y = panel.scrollTop; panel.scrollTop = 0; return y > 0; })(),
        top: Math.round(pr.top),
        bottom: Math.round(pr.bottom),
      },
      clippedOffscreen: pr.top < 0 || pr.bottom > innerHeight + 2,
    };
  });
  console.log('== GEOMETRÍA MÓVIL ==', JSON.stringify(geo, null, 2));

  await page.screenshot({ path: 'C:\\Users\\L\\Desktop\\shots\\modal-movil.png' });
  await browser.close();
})();
