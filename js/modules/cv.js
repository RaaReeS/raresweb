/* =========================================================
   js/modules/cv.js
   Currículum con vista previa INTEGRADA en la web:
   - Visor embebido en la sección #cv (<object type="application/pdf">)
     con carga diferida (solo cuando la sección entra en viewport).
   - Modal de vista previa (reutiliza el patrón .p-modal del modal
     de proyectos): NO usa showModal() para que el cursor
     personalizado quede por encima; Esc + Tab atrapados + foco restaurado.
   - Respaldo para dispositivos sin PDF incrustado (iOS Safari):
     se cambia el visor por una tarjeta con "Abrir" / "Descargar".
   ========================================================= */

import { closeMobileMenu } from './navbar.js';
import { SITE } from '../../data/projects.js';

/* PDF en modo "contraluz": oculta la barra de herramientas de Chrome.
   (Firefox/Safari la ignoran y muestran la suya: no pasa nada.) */
const PDF_SRC = `${SITE.CV_PATH}#toolbar=0&navpanes=0`;

/** Contexto compartido: pausa/reanuda Lenis como el resto de overlays. */
let ctx = {
  stopLenis: null,
  startLenis: null,
};

let dlg = null;
let panel = null;
let sectionViewer = null;
let modalViewer = null;
let sectionLoaded = false;
let modalLoaded = false;
let lastFocused = null;

/** Elementos enfocables para la trampa de foco del panel. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([type="hidden"]), textarea, select, [tabindex]:not([tabindex="-1"])';

/** iOS (y iPads presentándose como Mac) no incrusta PDFs en <object>. */
function needsFallback() {
  const ua = navigator.userAgent || '';
  const isIOS = /iP(hone|od|ad)/.test(ua);
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isIOS || isIPadOS;
}

/** Carga diferida: pinta el PDF solo cuando hace falta. */
function loadEmbed(embed, { force = false } = {}) {
  if (!embed) return;
  const viewer = embed.closest('[data-cv-viewer], [data-cv-modal-viewer]');
  const isModal = viewer === modalViewer;

  if (force || (isModal ? modalLoaded : sectionLoaded)) {
    if (!embed.getAttribute('data')) embed.setAttribute('data', PDF_SRC);
    return;
  }
  if (isModal) modalLoaded = true;
  else sectionLoaded = true;
  embed.setAttribute('data', PDF_SRC);
}

/** Activa el visor de un contenedor (embebido o tarjeta de respaldo). */
function armViewer(viewer) {
  if (!viewer) return;
  const embed = viewer.querySelector('object[data-pdf-embed]');
  const fallback = viewer.querySelector('[data-cv-fallback]');
  if (needsFallback() && fallback) {
    if (embed) embed.style.display = 'none';
    fallback.hidden = false;
  } else {
    loadEmbed(embed);
  }
}

/** Abre el modal del CV (lo usan la paleta de comandos y otros módulos). */
export function openCv() {
  // Si venimos del menú móvil, ciérralo antes (evita solapados de bloqueo)
  closeMobileMenu();
  if (!dlg) return;
  if (!dlg.open) {
    lastFocused = document.activeElement;
    armViewer(modalViewer);
    ctx.stopLenis?.();
    document.documentElement.classList.add('no-scroll');
    // show() (NO showModal): sin top layer, el cursor custom queda encima.
    if (typeof dlg.show === 'function') dlg.show();
    else dlg.setAttribute('open', '');
    dlg.querySelector('[data-cv-close]')?.focus();
  }
}

function closeModal() {
  if (!dlg) return;
  document.documentElement.classList.remove('no-scroll');
  ctx.startLenis?.();
  if (dlg.open) dlg.close();
  // Devuelve el foco al control que abrió la vista previa (a11y)
  lastFocused?.focus?.();
  lastFocused = null;
}

export function initCv(sharedCtx = {}) {
  ctx = { ...ctx, ...sharedCtx };
  dlg = document.querySelector('[data-cv-modal]');
  panel = document.querySelector('[data-cv-panel]');
  sectionViewer = document.querySelector('[data-cv-viewer]');
  modalViewer = document.querySelector('[data-cv-modal-viewer]');
  if (!dlg || !panel) return;

  /* Botones que abren la vista previa (nav escritorio, menú móvil,
     botón "Ver CV" del apartado) */
  document.querySelectorAll('[data-cv-open]').forEach((btn) => {
    btn.addEventListener('click', openCv);
  });

  dlg.querySelector('[data-cv-close]')?.addEventListener('click', closeModal);

  // Clic en el fondo (fuera del panel) = cerrar
  dlg.addEventListener('click', (event) => {
    if (event.target === dlg) closeModal();
  });

  // Con show() el <dialog> no es modal: gestionamos Esc y el foco nosotros
  document.addEventListener('keydown', (event) => {
    if (!dlg.open) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    // Atrapar el Tab dentro del panel
    if (event.key === 'Tab') {
      const nodes = dlg.querySelectorAll(FOCUSABLE);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dlg.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dlg.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // Cierre por cualquier vía: reanuda Lenis y limpia el bloqueo
  dlg.addEventListener('close', () => {
    document.documentElement.classList.remove('no-scroll');
    ctx.startLenis?.();
  });

  // Visor de la sección: carga diferida al acercarse el scroll
  if ('IntersectionObserver' in window && sectionViewer) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          armViewer(sectionViewer);
          io.disconnect();
        });
      },
      { rootMargin: '280px 0px' }
    );
    io.observe(sectionViewer);
  } else {
    armViewer(sectionViewer);
  }
}
