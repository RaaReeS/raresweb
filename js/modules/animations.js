/* =========================================================
   js/modules/animations.js
   - Scroll suave (Lenis) integrado con GSAP ScrollTrigger.
   - Preloader "compilando…" (<1,5 s, se omite si ya se vio).
   - Partículas conectadas del hero (canvas propio, se
     pausan fuera de pantalla; color según el tema activo).
   - Reveals: hero intro, cabeceras, tarjetas, timeline,
     barras de idioma, parallax sutil.
   ========================================================= */

import { t } from './i18n.js';

const reducedMotion =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(pointer: coarse)').matches;

const gsap = window.gsap || null;
const ScrollTrigger = window.ScrollTrigger || null;

/* =========================================================
   1 · SCROLL SUAVE
   ========================================================= */

export function initSmoothScroll() {
  if (reducedMotion || !window.Lenis) return null;

  const lenis = new window.Lenis({
    duration: 1.15,
    easing: (x) => Math.min(1, 1.001 - Math.pow(2, -10 * x)),
    smoothWheel: true,
  });

  if (gsap && ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  return lenis;
}

/* =========================================================
   2 · PRELOADER (máx. ~1,4 s; 0 s si ya se vio la sesión)
   ========================================================= */

const STEPS_ES = ['resolving modules…', 'linking gsap…', 'stitching particles…', 'hydrating…', 'ready ✔'];
const STEPS_EN = ['resolving modules…', 'linking gsap…', 'stitching particles…', 'hydrating…', 'done ✔'];

export function initPreloader() {
  return new Promise((resolve) => {
    const overlay = document.querySelector('.preloader');
    if (!overlay) return resolve('skipped');

    // ¿Visto ya esta sesión? (el inline marcó data-preloader="seen")
    if (document.documentElement.dataset.preloader === 'seen') {
      overlay.remove();
      return resolve('skipped');
    }

    const fill = overlay.querySelector('[data-fill]');
    const pct = overlay.querySelector('[data-pct]');
    const stepEl = overlay.querySelector('[data-step]');
    const lang = document.documentElement.lang;
    const list = lang === 'en' ? STEPS_EN : STEPS_ES;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try {
        sessionStorage.setItem('portfolio_preloader', '1');
      } catch { /* sin storage */ }
      overlay.classList.add('is-done');
      try {
        document.documentElement.dataset.preloader = 'seen';
      } catch { /* noop */ }
      window.setTimeout(() => overlay.remove(), 500);
      resolve('played');
    };

    const started = performance.now();
    let windowLoaded = false;
    window.addEventListener('load', () => (windowLoaded = true), { once: true });

    const tick = () => {
      if (done) return;
      try {
        const elapsed = performance.now() - started;
        windowLoaded = windowLoaded || document.readyState === 'complete';

        // enciende al 88% a los ~1000 ms; se completa solo con load o por corte de tiempo
        const projected = Math.min(88, elapsed / 10);
        const extra = windowLoaded ? (elapsed > 620 ? ((elapsed - 620) / 300) * 12 : 0) : 0;
        let value = Math.min(100, projected + extra);
        if (elapsed > 1400) value = 100;

        if (fill) fill.style.width = value + '%';
        if (pct) pct.textContent = Math.floor(value) + '%';
        if (stepEl) {
          const index = Math.min(list.length - 1, Math.floor((elapsed / 1400) * list.length));
          stepEl.textContent = list[index];
        }

        if (value >= 100) return finish();
        requestAnimationFrame(tick);
      } catch (error) {
        console.error('[portfolio:preloader]', error);
        finish(); // el bucle no puede quedarse colgado nunca
      }
    };

    requestAnimationFrame(tick);
  });
}

/* =========================================================
   3 · CANVAS DE PARTÍCULAS DEL HERO
   ========================================================= */

let konami = false;

function heroParticles() {
  const canvas = document.querySelector('[data-hero-canvas]');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  const hero = canvas.closest('[data-hero]') || canvas;
  let width = 0;
  let height = 0;
  let particles = [];
  let visible = true;
  let rafId = null;

  /* Colores leídos del tema activo (índigo/cian) */
  const readColors = () => {
    const light = document.documentElement.dataset.theme === 'light';
    return {
      dot: light ? 'rgba(79, 70, 229, .55)' : 'rgba(165, 180, 252, .6)',
      line: light ? 'rgba(8, 145, 178, .18)' : 'rgba(103, 232, 249, .16)',
    };
  };
  const colors = readColors();

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  /* Densidad según superficie — máx. razonable en móviles */
  function seed() {
    const target = Math.round(
      Math.min(90, (width * height) / 26000) * (isTouch ? 0.55 : 1)
    );
    particles = [];
    for (let i = 0; i < target; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.4 + 0.6,
      });
    }
  }

  /* Konami: colores arcoíris temporales */
  function hueDot(i, time) {
    if (!konami) return colors.dot;
    const hue = (i * 36 + time / 18) % 360;
    return `hsla(${hue}, 90%, 65%, .65)`;
  }

  function draw(time) {
    context.clearRect(0, 0, width, height);

    // líneas de conexión
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 90 * 90) {
          context.strokeStyle = colors.line;
          context.globalAlpha = 1 - Math.sqrt(dist2) / 90;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }
    }
    context.globalAlpha = 1;

    // puntos
    particles.forEach((p, i) => {
      context.fillStyle = hueDot(i, time);
      context.beginPath();
      context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      context.fill();

      if (!konami) {
        p.x += p.vx;
        p.y += p.vy;
      }
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
    });

    if (konami) {
      particles.forEach((p) => {
        p.x += p.vx * 3;
        p.y += Math.sin(time / 240 + p.r) * 1.1;
      });
    }
  }

  function paint(force) {
    if (!visible && !force) return;
    draw(performance.now());
    rafId = requestAnimationFrame(paint);
  }

  /* Pausar cuando el hero no se ve o se cambia de pestaña */
  function setVisibility(next) {
    visible = next;
    if (next && rafId === null) paint();
    if (!next && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }
  new IntersectionObserver((entries) => setVisibility(entries[0]?.isIntersecting ?? true), {
    threshold: 0.02,
  }).observe(hero);

  document.addEventListener('visibilitychange', () => setVisibility(!document.hidden));

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener(
    'pointermove',
    (event) => {
      // atracción sutil del puntero solo escritorio
      if (isTouch || konami) return;
      const rect = canvas.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      particles.forEach((p) => {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 120 * 120) {
          p.x -= dx * 0.002;
          p.y -= dy * 0.002;
        }
      });
    },
    { passive: true }
  );

  // Cambio de tema: recolorear
  document.addEventListener('themechange', () => {
    Object.assign(colors, readColors());
  });

  // easter egg: burst arcoíris 12 s
  document.addEventListener('konami', () => {
    konami = true;
    window.setTimeout(() => (konami = false), 12000);
  });

  resize();
  if (reducedMotion) {
    // universe estático: un solo cuadro, sin bucle
    setVisibility(false);
    draw(performance.now());
    return;
  }
  paint();
}

/* =========================================================
   4 · REVEALS E INTRO CON GSAP
   ========================================================= */

export function initScrollFX() {
  heroParticles();

  if (reducedMotion) {
    configureStatics();
    return null;
  }

  if (!gsap || !ScrollTrigger) return null;

  gsap.registerPlugin(ScrollTrigger);

  /* Reveal genérico por lotes (no oculta nada sin GSAP) */
  const batch = (selector, vars) => {
    ScrollTrigger.batch(selector, {
      start: 'top 88%',
      once: true,
      onEnter: (nodes) =>
        gsap.from(nodes, {
          duration: 0.75,
          ease: 'power3.out',
          opacity: 0,
          y: 28,
          stagger: 0.09,
          clearProps: 'transform,opacity',
          ...vars,
        }),
    });
  };

  batch('[data-section] .section__head', { y: 24 });
  batch('[data-skills-grid] .skill-card', { y: 32, scale: 0.98, stagger: 0.08 });
  batch('[data-projects-grid] .p-card', { y: 46, stagger: 0.12 });
  batch('[data-gh-grid] .repo-card', { y: 24, stagger: 0.07 });
  batch('.tl-item', { x: -28, stagger: 0.12 });
  batch('.lang-row', { y: 18, stagger: 0.08 });
  batch('[data-contact-panel], [data-form-window]', { y: 26, stagger: 0.12 });

  /* Líneas de los timelines (formación y certificaciones):
     cada una crece de arriba a abajo con su propio trigger. */
  document.querySelectorAll('[data-timeline]').forEach((tl) => {
    gsap.fromTo(
      tl,
      { '--line-scale': 0 },
      {
        '--line-scale': 1,
        ease: 'none',
        scrollTrigger: { trigger: tl, start: 'top 78%', end: 'bottom 65%', scrub: true },
      }
    );
  });

  /* Barras de idiomas: llenado por fila */
  document.querySelectorAll('[data-bar-fill]').forEach((fill) => {
    gsap.fromTo(
      fill,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: fill, start: 'top 92%', once: true },
      }
    );
  });

  /* Parallax suaves */
  gsap.to('.hero__orb--1', {
    yPercent: 26,
    ease: 'none',
    scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__content', {
    yPercent: -6,
    opacity: 0.92,
    ease: 'none',
    scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: '55% top', scrub: true },
  });

  // Recalcular alturas tras fuentes/preloader
  window.addEventListener('load', () => ScrollTrigger.refresh());

  return ScrollTrigger;
}

/** Con reduced-motion: estados finales sin movimiento. */
function configureStatics() {
  document.querySelectorAll('[data-bar-fill]').forEach((fill) => {
    fill.style.transform = 'none';
  });
}

/**
 * Intro del hero (pallabras → líneas), tras el preloader.
 */
export function playHeroIntro() {
  if (reducedMotion || !gsap) return;

  const timeline = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.7 } });

  timeline
    .from('.hero__eyebrow', { opacity: 0, y: 14 }, 0.05)
    .from('.hero__status', { opacity: 0, y: 16 }, 0.12)
    .from('[data-hero-name] [data-name-part]', { opacity: 0, y: 42, stagger: 0.14, duration: 0.9 }, 0.18)
    .from('.hero__headline', { opacity: 0, y: 20 }, 0.4)
    .from('.hero__lead', { opacity: 0, y: 20 }, 0.48)
    .from('.hero__ctas .btn', { opacity: 0, y: 18, stagger: 0.1 }, 0.56)
    .from('.hero__socials', { opacity: 0, y: 14 }, 0.64)
    .from('.hero__scroll', { opacity: 0 }, 0.8);
}

/** Botones magnéticos (traducción hacia el cursor con spring). */
export function initMagnetic() {
  if (reducedMotion || isTouch || !gsap) return;

  document.querySelectorAll('[data-magnetic]').forEach((btn) => {
    const inner = btn.firstElementChild || btn;

    btn.addEventListener('pointermove', (event) => {
      const rect = btn.getBoundingClientRect();
      const dx = event.clientX - rect.left - rect.width / 2;
      const dy = event.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: dx * 0.3, y: dy * 0.3, duration: 0.4, ease: 'power3.out' });
      gsap.to(inner, { x: dx * 0.18, y: dy * 0.18, duration: 0.4, ease: 'power3.out' });
    });

    btn.addEventListener('pointerleave', () => {
      gsap.to([btn, inner], { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, .45)' });
    });
  });
}

export { reducedMotion, isTouch };
