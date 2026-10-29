/* =========================================================
   js/modules/navbar.js
   Barra de navegación: fondo sólido al hacer scroll, ocultar
   al bajar/mostrar al subir, spy de sección activa, menú
   móvil accesible (Esc + clic), scroll suave con Lenis y
   actualización de la barra de progreso superior.
   ========================================================= */

import { t } from './i18n.js';

let nav, linksWrap, burger;
let lenis = null;
let lastY = 0;
let rafId = null;

/* ---------- scroll suave con anclas ---------- */

function scrollToTarget(target) {
  if (lenis) {
    lenis.scrollTo(target, { offset: -76, duration: 1.1 });
    return;
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Intercepta todos los enlaces ancla [data-scroll] del documento. */
function bindAnchors() {
  document.querySelectorAll('[data-scroll]').forEach((linkEl) => {
    linkEl.addEventListener('click', (event) => {
      const hash = linkEl.getAttribute('href');
      if (!hash || !hash.startsWith('#')) return;
      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      closeMenu(true);
      scrollToTarget(target);

      // anclar la URL sin salto brusco
      history.replaceState(null, '', hash);
    });
  });
}

/* ---------- estado del nav ---------- */

function onScroll() {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    const y = window.scrollY;

    // fondo sólido + sombra si pasamos de 24px
    nav.classList.toggle('is-solid', y > 24);

    // ocultar al bajar (salvo menú abierto)
    if (y > 140 && y > lastY) nav.classList.add('is-hidden');
    else nav.classList.remove('is-hidden');
    lastY = y;
  });
}

/* ---------- spy de sección activa ---------- */

function initSpy() {
  const targets = document.querySelectorAll('main section[id]');
  const links = new Map();
  document.querySelectorAll('[data-nav-links] .nav__link').forEach((linkEl) => {
    const hash = linkEl.getAttribute('href');
    if (hash?.startsWith('#')) links.set(hash.slice(1), linkEl);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((linkEl, id) => {
          const active = id === entry.target.id;
          linkEl.classList.toggle('is-active', active);
        });
      });
    },
    { rootMargin: '-38% 0px -55% 0px', threshold: 0 }
  );

  targets.forEach((section) => observer.observe(section));
}

/* ---------- menú móvil ---------- */

function openMenu() {
  nav.classList.add('menu-open');
  burger.setAttribute('aria-expanded', 'true');
  burger.dataset.i18nAttr = 'aria-label:a11y.menuClose';
  burger.setAttribute('aria-label', t('a11y.menuClose'));
  document.documentElement.classList.add('no-scroll');
  lenis?.stop();
  // primer foco: la primera opción del menú
  linksWrap.querySelector('.nav__link')?.focus();
}

function closeMenu(silent = false) {
  if (!nav.classList.contains('menu-open')) return;
  nav.classList.remove('menu-open');
  burger.setAttribute('aria-expanded', 'false');
  burger.dataset.i18nAttr = 'aria-label:a11y.menuOpen';
  burger.setAttribute('aria-label', t('a11y.menuOpen'));
  document.documentElement.classList.remove('no-scroll');
  lenis?.start();
  if (!silent) burger.focus();
}

function bindMenu() {
  burger.addEventListener('click', () => {
    nav.classList.contains('menu-open') ? closeMenu() : openMenu();
  });

  // Esc y clic en enlace cierran
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('menu-open')) closeMenu();
  });

  // Tab-cicla dentro del header cuando el panel está abierto
  nav.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || !nav.classList.contains('menu-open')) return;
    const focusables = nav.querySelectorAll(
      'a[href], button:not([disabled])'
    );
    const firstEl = focusables[0];
    const lastEl = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === firstEl) {
      event.preventDefault();
      lastEl.focus();
    } else if (!event.shiftKey && document.activeElement === lastEl) {
      event.preventDefault();
      firstEl.focus();
    }
  });
}

/* =========================================================
   init
   ========================================================= */

export function initNavbar(ctx = {}) {
  nav = document.querySelector('[data-nav]');
  linksWrap = document.querySelector('[data-nav-links]');
  burger = document.querySelector('[data-menu-toggle]');
  if (!nav || !burger || !linksWrap) return;

  lenis = ctx.lenis || null;

  bindAnchors();
  bindMenu();
  initSpy();

  // botón "volver arriba" del footer usa [data-scroll]; ✓ cubierto por bindAnchors
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // la pestaña cambia de tamaño → recalcular progreso
  window.addEventListener('resize', () => onScroll(), { passive: true });
}

/** Utilidad exportada: scroll programático reutilizable (index → secciones). */
export const navbarScrollTo = scrollToTarget;
