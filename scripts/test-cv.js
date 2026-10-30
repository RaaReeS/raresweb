/**
 * QA de la vista previa del CV:
 * - Desktop: botón nav → modal (PDF cargado, Esc, clic fuera, paleta Ctrl+K)
 * - Desktop: visor de la sección #cv con carga diferida
 * - Móvil 390x844: menú hamburguesa → "Ver CV" → modal compacto
 * - iOS (UA + touch): tarjeta de respaldo en lugar del visor
 * - Regresión: el modal de proyectos sigue funcionando
 * Uso: node scripts/test-cv.js  (requiere server en :8777)
 */
const { chromium } = require('playwright-core');

const BASE = 'http://localhost:8777/index.html';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = [];
  const check = (name, ok, extra = '') =>
    results.push(`[${ok ? 'OK ' : 'FALLO'}] ${name}${extra ? ' → ' + extra : ''}`);

  /* ---------- Desktop ---------- */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3600);

    // 1 · Botón del nav abre el modal
    await page.click('.nav__cv');
    await page.waitForTimeout(900);
    let r = await page.evaluate(() => {
      const dlg = document.querySelector('[data-cv-modal]');
      const embed = dlg.querySelector('object[data-pdf-embed]');
      return {
        open: dlg.open,
        data: embed.getAttribute('data'),
        noScroll: document.documentElement.classList.contains('no-scroll'),
        focusInside: dlg.contains(document.activeElement),
      };
    });
    check('nav → modal abre', r.open === true && r.noScroll && r.focusInside);
    check('PDF cargado en el modal con #toolbar=0', (r.data || '').includes('cv.pdf#toolbar=0'), r.data || '(sin data)');

    // 2 · Esc cierra y devuelve el foco al botón
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
    r = await page.evaluate(() => ({
      open: document.querySelector('[data-cv-modal]').open,
      focusBack: document.activeElement.classList.contains('nav__cv'),
      clean: !document.documentElement.classList.contains('no-scroll'),
    }));
    check('Esc cierra + foco restaurado al nav', r.open === false && r.focusBack && r.clean);

    // 3 · Clic en el fondo también cierra
    await page.click('.nav__cv');
    await page.waitForTimeout(700);
    await page.mouse.click(30, 400); // zona de fondo del overlay
    await page.waitForTimeout(600);
    r = await page.evaluate(() => document.querySelector('[data-cv-modal]').open);
    check('clic en el fondo cierra', r === false);

    // 4 · Paleta de comandos: "Ver el CV (vista previa)"
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);
    await page.fill('[data-palette-input]', 'cv');
    await page.waitForTimeout(400);
    const hasItem = await page.evaluate(() =>
      [...document.querySelectorAll('.palette__item span')].some((s) => /CV/i.test(s.textContent))
    );
    check('paleta muestra el comando CV', hasItem);
    // Ejecuta concretamente "Ver el CV (vista previa)"
    await page.locator('.palette__item', { hasText: 'vista previa' }).first().click();
    await page.waitForTimeout(900);
    r = await page.evaluate(() => ({
      modal: document.querySelector('[data-cv-modal]').open,
      palette: document.querySelector('[data-palette]').classList.contains('is-open'),
    }));
    check('paleta → Enter abre el modal', r.modal === true && r.palette === false);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // 5 · Visor de la sección #cv (carga diferida)
    await page.evaluate(() => document.querySelector('#cv').scrollIntoView());
    await page.waitForTimeout(1200);
    r = await page.evaluate(() => {
      const viewer = document.querySelector('[data-cv-viewer]');
      const embed = viewer.querySelector('object[data-pdf-embed]');
      return {
        data: embed.getAttribute('data'),
        fallback: viewer.querySelector('[data-cv-fallback]').hidden,
        height: Math.round(viewer.getBoundingClientRect().height),
      };
    });
    check('visor de sección carga el PDF diferido', (r.data || '').includes('cv.pdf#toolbar=0'), r.data || '(sin data)');
    check('sin tarjeta de respaldo en desktop', r.fallback === true);
    check('visor con alto tipo hoja (>520px)', r.height > 520, String(r.height));

    // 6 · Regresión: modal de proyectos sigue funcionando
    await page.evaluate(() => document.querySelector('#proyectos').scrollIntoView());
    await page.waitForTimeout(1000);
    await page.locator('.p-card').first().click({ position: { x: 200, y: 120 } });
    await page.waitForTimeout(900);
    r = await page.evaluate(() => {
      const p = document.querySelector('[data-project-modal]');
      const c = document.querySelector('[data-cv-modal]');
      return { projects: p.open, cvClosed: !c.open };
    });
    check('modal de proyectos OK tras los cambios', r.projects === true && r.cvClosed);
    await page.keyboard.press('Escape');
    await page.close();
  }

  /* ---------- Móvil 390x844 ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3600);

    // 7 · Menú móvil → Ver CV → modal compacto
    await page.click('[data-menu-toggle]');
    await page.waitForTimeout(700);
    const menuHasCv = await page.evaluate(() => {
      const btn = document.querySelector('.nav__cv-link');
      const r = btn.getBoundingClientRect();
      return btn.offsetParent !== null && r.top > 0 && r.bottom < innerHeight;
    });
    check('menú móvil muestra "Ver CV"', menuHasCv);
    await page.click('.nav__cv-link');
    await page.waitForTimeout(900);
    const r = await page.evaluate(() => {
      const dlg = document.querySelector('[data-cv-modal]');
      const p = dlg.querySelector('[data-cv-panel]').getBoundingClientRect();
      const menu = document.querySelector('[data-nav]').classList.contains('menu-open');
      const bar = dlg.querySelector('.cv-modal__bar').getBoundingClientRect();
      return {
        open: dlg.open,
        menuClosed: !menu,
        panelH: Math.round(p.height),
        fits: p.height <= innerHeight && p.top >= 0 && p.bottom <= innerHeight,
        barVisible: bar.width > 100 && bar.height > 30,
        data: dlg.querySelector('object[data-pdf-embed]').getAttribute('data'),
      };
    });
    check('CV modal abre desde el menú y lo cierra', r.open && r.menuClosed);
    check('panel lleno pero dentro del viewport', r.fits, `panelH=${r.panelH}`);
    check('barra con acciones visible', r.barVisible);
    check('PDF cargado en móvil', (r.data || '').includes('cv.pdf#toolbar=0'));

    await page.screenshot({ path: 'C:\\Users\\L\\Desktop\\shots\\cv-modal-movil.png' });
    await ctx.close();
  }

  /* ---------- iOS: tarjeta de respaldo ---------- */
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3200);

    await page.evaluate(() => document.querySelector('#cv').scrollIntoView());
    await page.waitForTimeout(1000);
    let r = await page.evaluate(() => {
      const viewer = document.querySelector('[data-cv-viewer]');
      return {
        fallbackShown: !viewer.querySelector('[data-cv-fallback]').hidden,
        embedHidden: viewer.querySelector('object[data-pdf-embed]').style.display === 'none',
        openBtn: !!viewer.querySelector('.cv-fallback a[target=_blank]'),
      };
    });
    check('iOS: sección usa tarjeta de respaldo', r.fallbackShown && r.embedHidden && r.openBtn);

    // el modal también (desde el menú móvil; el nav se auto-oculta al
    // hacer scroll, así que disparamos el clic programáticamente)
    await page.evaluate(() => document.querySelector('[data-menu-toggle]').click());
    await page.waitForTimeout(700);
    await page.evaluate(() => document.querySelector('.nav__cv-link').click());
    await page.waitForTimeout(800);
    r = await page.evaluate(() => {
      const dlg = document.querySelector('[data-cv-modal]');
      const v = dlg.querySelector('[data-cv-modal-viewer]');
      return {
        open: dlg.open,
        fallbackShown: !v.querySelector('[data-cv-fallback]').hidden,
        embedHidden: v.querySelector('object[data-pdf-embed]').style.display === 'none',
      };
    });
    check('iOS: modal usa tarjeta de respaldo', r.open && r.fallbackShown && r.embedHidden);
    await page.screenshot({ path: 'C:\\Users\\L\\Desktop\\shots\\cv-modal-ios.png' });
    await ctx.close();
  }

  await browser.close();

  console.log('\n===== RESULTADOS CV =====');
  results.forEach((line) => console.log(line));
  const fails = results.filter((l) => l.includes('FALLO')).length;
  console.log(`\n${results.length - fails}/${results.length} checks correctos`);
  process.exitCode = fails ? 1 : 0;
})();
