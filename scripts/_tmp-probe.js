const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8777/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  await page.locator('.p-card').first().click({ position: { x: 180, y: 140 } });
  await page.waitForTimeout(1000);
  const info = await page.evaluate(() => {
    const get = (sel, prop) => getComputedStyle(document.querySelector(sel))[prop];
    const media = document.querySelector('.p-modal__media');
    const body = document.querySelector('.p-modal__body');
    const b = body.getBoundingClientRect();
    return {
      mediaH: media.getBoundingClientRect().height,
      mediaComputedHeight: get('.p-modal__media', 'height'),
      bodyPadding: get('.p-modal__body', 'paddingTop'),
      bodyW: Math.round(b.width),
      longFs: get('.p-modal__long', 'fontSize'),
      itemFs: get('.p-modal__item', 'fontSize'),
      titleFs: get('.p-modal__title', 'fontSize'),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
