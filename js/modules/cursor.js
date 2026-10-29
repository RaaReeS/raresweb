/* =========================================================
   js/modules/cursor.js
   Cursor personalizado: punto fluido ●

   - Un solo punto; fondo exacto del puntero, pero animado
     con lerp fuerte (0.38) en rAF → deslizamiento suave
     ("fluido") sin quedarse rezagado.
   - Snap al primer movimiento (no cruza la pantalla desde
     una esquina) y al reentrar en la ventana.
   - Hover interactivo → crece como halo translúcido.
   - Clic → presión (escala 0.5).
   Solo escritorio (pointer: fine) y sin prefers-reduced-motion.

   Ajuste fino del "fluido": LERP (0.28 = más flotante,
   0.5 = más pegado al puntero).
   ========================================================= */

const finePointer =
  window.matchMedia && window.matchMedia('(pointer: fine)').matches;
const reducedMotion =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Comprueba si el cursor personalizado procede en este dispositivo. */
export function canUseCustomCursor() {
  return Boolean(finePointer) && !reducedMotion;
}

const HOVER_SELECTOR =
  'a, button, [role="button"], [role="option"], input, textarea, select, label, [data-tilt], iframe';

/* Sensación de deslizamiento */
const LERP = 0.38;

export function initCursor() {
  if (!canUseCustomCursor()) return;

  const dot = document.querySelector('.cursor-dotc');
  if (!dot) return;

  document.documentElement.classList.add('custom-cursor');

  const half = dot.getBoundingClientRect().width / 2;

  /* Posición real del puntero vs. posición animada del punto */
  let targetX = -100;
  let targetY = -100;
  let x = targetX;
  let y = targetY;
  let started = false;

  window.addEventListener(
    'pointermove',
    (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!started) {
        started = true;
        x = targetX; // primer contacto: sin vuelo desde la esquina
        y = targetY;
      }
      dot.style.opacity = '1';
    },
    { passive: true }
  );

  /* El punto persigue al puntero con lerp: fluido y estable */
  (function dotLoop() {
    x += (targetX - x) * LERP;
    y += (targetY - y) * LERP;
    dot.style.translate = `${x - half}px ${y - half}px`;
    requestAnimationFrame(dotLoop);
  })();

  const hoverables = document.documentElement;

  hoverables.addEventListener(
    'pointerover',
    (event) => {
      if (event.target.closest(HOVER_SELECTOR)) dot.classList.add('is-hover');
    },
    { passive: true }
  );
  hoverables.addEventListener(
    'pointerout',
    (event) => {
      if (event.target.closest(HOVER_SELECTOR)) dot.classList.remove('is-hover');
    },
    { passive: true }
  );

  window.addEventListener('pointerdown', () => dot.classList.add('is-down'));
  window.addEventListener('pointerup', () => dot.classList.remove('is-down'));

  // Al abandonar la ventana se desvanece
  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    started = false; // al volver, snap directo, sin cruce de pantalla
  });
}
