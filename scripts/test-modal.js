/**
 * QA del modal de proyectos: cursor personalizado encima + sin scroll de fondo
 * + foco atrapado. Uso: node scripts/test-modal.js
 */
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:8777/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  // Abre el modal (clic en la primera tarjeta de proyecto)
  await page.locator('.p-card').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.locator('.p-card').first().click({ position: { x: 200, y: 120 } });
  await page.waitForTimeout(1200);

  // ¿El panel cabe en el viewport sin scroll interno?
  const fit = await page.evaluate(() => {
    const panel = document.querySelector('.p-modal__panel');
    const p = panel.getBoundingClientRect();
    return { fits: p.height <= window.innerHeight - 48 && panel.scrollTop === 0,
             panelH: Math.round(p.height), scrollable: panel.scrollHeight > panel.clientHeight };
  });

  const state = await page.evaluate(() => {
    const el = document.querySelector('[data-project-modal]');
    const dot = getComputedStyle(document.querySelector('.cursor-dotc'));
    return {
      open: el.open,
      htmlClasses: [...document.documentElement.classList],
      dotOpacity: dot.opacity,
      dotZ: getComputedStyle(document.querySelector('.cursor-dotc')).zIndex,
      modalZ: getComputedStyle(el).zIndex,
      focusInModal: el.contains(document.activeElement),
    };
  });
  console.log('== ESTADO AL ABRIR ==', JSON.stringify({ ...state, fit }, null, 2));
  await page.screenshot({ path: 'C:\\Users\\L\\Desktop\\shots\\modal-abierto.png' });

  // Rueda del ratón sobre el modal: NO debe scrollear la página
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.move(640, 500);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(800);
  const y = await page.evaluate(() => window.scrollY);
  console.log('== SCROLL TRAS RUEDA ==', JSON.stringify({ before, after: y, moved: Math.abs(y - before) > 2 }));

  // Trampa de foco: Tab x4 → el foco sigue dentro del dialog
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  const focusOK = await page.evaluate(() =>
    document.querySelector('[data-project-modal]').contains(document.activeElement));
  console.log('== FOCO TRAS TABx4 ==', JSON.stringify({ stillInside: focusOK }));

  // Esc cierra y reanuda todo
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  const end = await page.evaluate(() => {
    const dot = getComputedStyle(document.querySelector('.cursor-dotc'));
    return {
      open: document.querySelector('[data-project-modal]').open,
      htmlClasses: [...document.documentElement.classList],
      dotOpacity: dot.opacity,
    };
  });
  console.log('== TRAS ESC ==', JSON.stringify(end, null, 2));

  await browser.close();
})();
