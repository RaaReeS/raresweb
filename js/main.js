/* =========================================================
   js/main.js · punto de entrada
   Orquesta los módulos en el orden correcto y comparte
   contexto (Lenis, scroll programático) por parámetros,
   sin variables globales.

   Robustez:
   - Cada init corre dentro de safe(): si uno falla (CDN
     offline, storage bloqueado…), el resto sigue su curso
     y el preloader SIEMPRE se cierra.
   - El script inline del <head> libera el overlay si los
     módulos ES no llegan a cargar (file://, MIME, etc.).
   ========================================================= */

import { initI18n, bindLangButtons } from './modules/i18n.js';
import { initTheme, toggleTheme } from './modules/theme.js';
import { initNavbar } from './modules/navbar.js';
import { initTerminal, initEditorTabs } from './modules/terminal.js';
import { initProjects } from './modules/projects.js';
import { initGitHub } from './modules/github.js';
import { initContact } from './modules/contact.js';
import { initCursor } from './modules/cursor.js';
import { initPalette } from './modules/commandPalette.js';
import { initConsoleEgg, initKonami } from './modules/easterEggs.js';
import {
  initSmoothScroll,
  initPreloader,
  initScrollFX,
  playHeroIntro,
  initMagnetic,
  reducedMotion,
} from './modules/animations.js';

/** Envoltura: un init que lanza excepción no mata el boot. */
function safe(label, fn) {
  try {
    return fn();
  } catch (error) {
    console.error(`[portfolio] init falló → ${label}`, error);
    return undefined;
  }
}

/* ---------- boot ---------- */

async function boot() {
  /* 1 · Textos y tema primero (todo el contenido toma idioma/tema) */
  safe('i18n', initI18n);
  safe('theme', initTheme);
  safe('lang-buttons', bindLangButtons);

  /* 2 · UI operativa (terminales, listados, formularios…) */
  safe('terminal', initTerminal);
  safe('editor-tabs', initEditorTabs);
  safe('github', initGitHub);
  safe('contact', initContact);
  safe('cursor', initCursor);
  safe('magnetic', initMagnetic);
  safe('console-egg', initConsoleEgg);
  safe('konami', initKonami);

  /* 3 · Contexto compartido: Lenis + scroll programático */
  const lenis = safe('smooth-scroll', initSmoothScroll) ?? null;

  const scrollToSection = (id) =>
    (lenis ? lenis.scrollTo(`#${id}`, { offset: -76, duration: 1.1 })
           : document.querySelector(`#${id}`)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }));

  safe('navbar', () => initNavbar({ lenis, scrollToSection }));

  /* 3b · El modal de proyectos necesita PAUSAR Lenis al abrirse
     (si no, el fondo seguía scrolleando detrás del overlay). */
  safe('projects', () =>
    initProjects({
      stopLenis: () => (lenis ? lenis.stop() : null),
      startLenis: () => (lenis ? lenis.start() : null),
    })
  );

  /* 4 · Paleta de comandos necesita el contexto anterior */
  safe('palette', () =>
    initPalette({
      scrollToSection,
      stopLenis: () => (lenis ? lenis.stop() : null),
      startLenis: () => (lenis ? lenis.start() : null),
    })
  );

  /* 5 · Preloader → intro → animaciones de scroll.
     Aún con error interno, el overlay se elimina: nunca se
     puede quedar la web bloqueada debajo. */
  let preloaderResult = 'skipped';
  try {
    preloaderResult = await initPreloader();
  } catch (error) {
    console.error('[portfolio] preloader', error);
    document.querySelector('.preloader')?.remove();
  }

  safe('scroll-fx', initScrollFX);
  /* Con o sin preloader, la intro del hero se lanza igual
     (playHeroIntro ya respeta prefers-reduced-motion). */
  safe('hero-intro', playHeroIntro);

  /* Re-cálculo de ScrollTrigger al volver a la pestaña */
  document.addEventListener('visibilitychange', () => {
    if (window.ScrollTrigger && !document.hidden) window.ScrollTrigger.refresh();
  });
}

/* Atajo interno de QA: Ctrl+Shift+T alterna el tema sin tocar
   el botón del nav (útil para revisar contraste en caliente). */
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 't') {
    event.preventDefault();
    safe('toggle-theme', toggleTheme);
  }
});

boot();
