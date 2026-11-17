/**
 * QA del grid de proyectos: con nº impar de tarjetas, la última debe
 * quedar centrada a media anchura. Uso: node scripts/test-projects-grid.js
 */
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:8777/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  const grid = page.locator('.projects__grid');
  await grid.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  const info = await page.evaluate(() => {
    const grid = document.querySelector('.projects__grid');
    const cards = [...grid.querySelectorAll('.p-card')];
    const last = cards[cards.length - 1];
    const lastStyle = getComputedStyle(last);
    const gridStyle = getComputedStyle(grid);
    const gr = last.getBoundingClientRect();
    const cols = gridStyle.gridTemplateColumns.split(' ').map((v) => parseFloat(v));
    return {
      nCards: cards.length,
      gridClass: grid.className,
      oddClass: grid.classList.contains('projects__grid--odd'),
      lastGridColumn: lastStyle.gridColumn,
      lastJustifySelf: lastStyle.justifySelf,
      lastWidth: Math.round(gr.width),
      colWidths: cols,
      gridWidth: Math.round(grid.getBoundingClientRect().width),
      lastLeft: Math.round(gr.left - grid.getBoundingClientRect().left),
    };
  });
  console.log('== GRID ==', JSON.stringify(info, null, 2));

  await page.screenshot({ path: 'C:\\Users\\L\\Desktop\\shots\\projects-grid.png' });
  await browser.close();
})();
