/**
 * QA del grid de repos públicos: la última fila incompleta debe quedar
 * centrada. Uso: node scripts/test-gh-grid.js
 */
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:8777/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500); // espera a que cargue la API/caché

  const gh = page.locator('[data-gh-grid]');
  await gh.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  const info = await page.evaluate(() => {
    const grid = document.querySelector('[data-gh-grid]');
    const lastWrap = grid.querySelector('.gh__grid-last');
    const cards = [...grid.querySelectorAll('.repo-card')];
    const gRect = grid.getBoundingClientRect();
    let lastRow = { centered: null, width: null, offset: null };
    if (lastWrap) {
      const wRect = lastWrap.getBoundingClientRect();
      const card = lastWrap.querySelector('.repo-card');
      const cRect = card.getBoundingClientRect();
      lastRow = {
        centered: Math.abs((cRect.left + cRect.width / 2) - (gRect.left + gRect.width / 2)) < 2,
        width: Math.round(cRect.width),
        offset: Math.round(cRect.left - gRect.left),
      };
    }
    return {
      nCards: cards.length,
      columns: getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
      hasLastRowWrapper: Boolean(lastWrap),
      nInLastRow: lastWrap ? lastWrap.querySelectorAll('.repo-card').length : 0,
      ...lastRow,
    };
  });
  console.log('== GH GRID ==', JSON.stringify(info, null, 2));

  await page.screenshot({ path: 'C:\\Users\\L\\Desktop\\shots\\gh-grid.png' });
  await browser.close();
})();
