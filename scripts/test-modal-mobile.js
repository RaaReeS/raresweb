/**
 * QA del modal en varios tamaños de móvil: ¿cabe todo? ¿etiquetas visibles?
 * Uso: node scripts/test-modal-mobile.js
 */
const { chromium } = require('playwright-core');

const VIEWPORTS = [
  { name: '390x844',  w: 390,  h: 844 },
  { name: '430x750',  w: 430,  h: 750 },
  { name: '360x640',  w: 360,  h: 640 },
  { name: '844x390',  w: 844,  h: 390 },
];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      isMobile: vp.w < 700,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await page.goto('http://localhost:8777/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3200);

    await page.locator('.p-card').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.locator('.p-card').first().click({ position: { x: 180, y: 140 } });
    await page.waitForTimeout(1000);

    const r = await page.evaluate(() => {
      const panel = document.querySelector('.p-modal__panel');
      const tags = [...document.querySelectorAll('[data-pmodal-tags] .tag')];
      const lastTag = tags[tags.length - 1];
      const tr = lastTag.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      // ¿La última etiqueta está dentro del área visible del panel?
      const tagInsidePanel = tr.bottom <= pr.bottom + 2 && panel.scrollTop >= 0;
      return {
        panelH: Math.round(pr.height),
        panelBottom: Math.round(pr.bottom),
        needsScroll: panel.scrollHeight > panel.clientHeight + 4,
        canScroll: panel.scrollHeight > panel.clientHeight + 4 &&
                   panel.scrollHeight > parseInt(getComputedStyle(panel).maxHeight) - 500,
        scrollWorks: (() => { const m = panel.scrollHeight > panel.clientHeight; if (!m) return 'no-needed'; const y0 = panel.scrollTop; panel.scrollTop = 99999; const moved = panel.scrollTop > 0; panel.scrollTop = 0; return moved; })(),
        tagsCount: tags.length,
        lastTagTop: Math.round(tr.top),
        lastTagVisibleInViewport: tr.bottom > 0 && tr.top < innerHeight,
        lastTagInsidePanel: tagInsidePanel,
      };
    });
    console.log(`== ${vp.name} ==>`, JSON.stringify(r));

    if (vp.name === '360x640') {
      await page.screenshot({ path: 'C:\\Users\\L\\Desktop\\shots\\modal-360x640.png' });
    }
    await ctx.close();
  }
  await browser.close();
})();
