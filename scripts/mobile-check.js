/**
 * Diagnóstico móvil: detecta overflow horizontal y captura cada sección.
 * Uso: node scripts/mobile-check.js [url]
 */
const { chromium } = require('playwright-core');

const URL = process.argv[2] || 'http://localhost:8777/index.html';
const SECTIONS = ['inicio', 'sobre-mi', 'stack', 'proyectos', 'formacion', 'certificaciones', 'idiomas', 'contacto'];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(URL, { waitUntil: 'networkidle' });
  // Espera a que el preloader/animaciones concluyan
  await page.waitForTimeout(4000);

  // 1) Medir overflow horizontal general
  const metrics = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const sw = document.documentElement.scrollWidth;
    const wide = [];
    if (sw > w + 1) {
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > w + 1 || r.left < -1) {
          wide.push({
            tag: el.tagName.toLowerCase(),
            cls: String(el.className).slice(0, 60),
            left: Math.round(r.left),
            right: Math.round(r.right),
          });
        }
      });
    }
    return { w, sw, overflow: sw > w + 1, wide: wide.slice(0, 25) };
  });
  console.log('== OVERFLOW ==', JSON.stringify({ clientWidth: metrics.w, scrollWidth: metrics.sw, overflow: metrics.overflow }));
  metrics.wide.forEach((x) => console.log('  >', JSON.stringify(x)));

  // 2) Screenshot de cada sección (scrollIntoView + espera animaciones)
  for (const id of SECTIONS) {
    const el = await page.$(`#${id}`);
    if (!el) { console.log('sección no encontrada:', id); continue; }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `../shots/sec-${id}.png` });
    console.log('captura OK:', id);
  }

  // 3) Captura nueva del hero (estado final tras animaciones)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '../shots/sec-inicio.png' });

  await browser.close();
})();
