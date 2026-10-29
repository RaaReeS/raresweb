/* =========================================================
   js/modules/projects.js
   Render de tarjetas desde data/projects.js + modal accesible
   (<dialog>: foco atrapado y cierre con Esc nativos) + tilt 3D
   + spotlight con radial-gradient siguiendo al cursor.
   ========================================================= */

import { projects } from '../../data/projects.js';
import { t } from './i18n.js';

const reducedMotion =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(pointer: coarse)').matches;

const grid = document.querySelector('[data-projects-grid]');
const dialogEl = document.querySelector('[data-project-modal]');

/**
 * Contexto inyectado desde main.js: Lenis intercepta el wheel, así que
 * al abrir el modal hay que PAUSARLO (si no, scrollea la página detrás
 * del overlay aunque se ponga overflow:hidden).
 */
const modalCtx = {
  stopLenis: null,
  startLenis: null,
};

/** Elementos enfocables para el trampa de foco del panel */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([type="hidden"]), textarea, select, [tabindex]:not([tabindex="-1"])';

/** Elemento que abrió el modal: para devolverle el foco al cerrar */
let lastFocused = null;

/* ---------- helpers ---------- */

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

const langField = () => (document.documentElement.lang === 'en' ? 'en' : 'es');

/* ---------- render de tarjetas ---------- */

function cardHTML(p, index) {
  const mediaImg = p.image
    ? `<img src="${escapeHTML(p.image)}" alt="" width="688" height="230" loading="lazy" decoding="async" />`
    : '';
  const mediaGlyph = p.image
    ? ''
    : `<span class="p-card__monogram" aria-hidden="true">${escapeHTML(p.monogram)}</span>`;

  const demoBtn = p.demo
    ? `<a class="btn btn--ghost btn--sm" href="${escapeHTML(p.demo)}" target="_blank"
         rel="noopener noreferrer">
         <svg class="icon" aria-hidden="true"><use href="#i-external"/></svg>
         <span>${escapeHTML(t('projects.viewDemo'))}</span>
       </a>`
    : '';

  return `
    <article class="glass p-card" data-project-id="${escapeHTML(p.id)}" data-tilt data-spotlight
             style="--i: ${index}">
      <button class="p-card__open" type="button" aria-haspopup="dialog"
              aria-label="${escapeHTML(t('projects.openAria', { title: p.title }))}"></button>

      <div class="p-card__media">
        ${mediaImg}
        <div class="p-card__media-inner">
          ${mediaGlyph}
          <span class="p-card__hash p-card__hash--media mono" aria-hidden="true">
            <span class="u-accent">#</span>${escapeHTML(p.hash)} · ${escapeHTML(p.snippet || '')}
          </span>
        </div>
      </div>

      <div class="p-card__body">
        <h3 class="p-card__title">
          ${escapeHTML(p.title)}
          <svg class="icon" aria-hidden="true"><use href="#i-git-branch"/></svg>
        </h3>
        <p class="p-card__desc">${escapeHTML(p.short[langField()])}</p>
        <ul class="tags" aria-label="tecnologías">
          ${p.tech.map((label) => `<li class="tag">${escapeHTML(label)}</li>`).join('')}
        </ul>
      </div>

      <div class="p-card__actions">
        <a class="btn btn--solid btn--sm" href="${escapeHTML(p.repo)}" target="_blank" rel="noopener noreferrer">
          <svg class="icon" aria-hidden="true"><use href="#i-github"/></svg>
          <span>${escapeHTML(t('projects.viewCode'))}</span>
        </a>
        ${demoBtn}
      </div>
    </article>
  `;
}

/** Dibuja (o redibuja) todas las tarjetas. */
export function renderProjects() {
  if (!grid) return;
  grid.innerHTML = projects.map(cardHTML).join('');
  bindTilt();
  bindSpotlight();
}

/* ---------- modal ---------- */

function openModal(project) {
  if (!dialogEl) return;

  dialogEl.dataset.openProject = project.id;

  const { lang } = { lang: langField() };
  dialogEl.querySelector('[data-pmodal-title]').textContent = project.title;
  dialogEl.querySelector('[data-pmodal-long]').textContent = project.long[lang];
  dialogEl.querySelector('[data-pmodal-monogram]').textContent = project.monogram;

  const media = dialogEl.querySelector('[data-pmodal-media]');
  media.classList.toggle('p-modal__media--gradient', !project.image);
  const oldImg = media.querySelector('img');
  if (oldImg) oldImg.remove();
  if (project.image) {
    const img = document.createElement('img');
    img.src = project.image;
    img.alt = '';
    img.width = 688;
    img.height = 200;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.appendChild(img);
  }

  // Bullets del modal (plantilla del HTML se clona por elemento)
  const list = dialogEl.querySelector('.p-modal__list');
  const template = dialogEl.querySelector('[data-pmodal-item-template]');
  list.querySelectorAll('.p-modal__item[data-cloned]').forEach((n) => n.remove());
  for (const bullet of project.highlights[lang]) {
    const node = template.cloneNode(true);
    node.removeAttribute('style'); // la plantilla entra con display:none
    node.dataset.cloned = 'true';
    node.querySelector('[data-pmodal-item-text]').textContent = bullet;
    list.appendChild(node);
  }

  // Tags
  const tags = dialogEl.querySelector('[data-pmodal-tags]');
  tags.innerHTML = project.tech
    .map((label) => `<li class="tag">${escapeHTML(label)}</li>`)
    .join('');

  // Botones
  const repoBtn = dialogEl.querySelector('[data-pmodal-repo]');
  repoBtn.href = project.repo;
  const demoBtn = dialogEl.querySelector('[data-pmodal-demo]');
  if (project.demo) {
    demoBtn.hidden = false;
    demoBtn.href = project.demo;
  } else {
    demoBtn.hidden = true;
  }

  // Si el modal ya está abierto (p. ej. recarga de idioma), solo
  // se rellena de contenido; showModal() lanzaría InvalidStateError.
  if (!dialogEl.open) {
    // Pausa el scroll suave + bloqueo nativo: nada scrollea detrás del modal
    lastFocused = document.activeElement;
    modalCtx.stopLenis?.();
    document.documentElement.classList.add('no-scroll');
    // show() (NO showModal): el dialog NO entra en el top layer del
    // navegador y el cursor personalizado sigue pintándose por encima.
    if (typeof dialogEl.show === 'function') dialogEl.show();
    else dialogEl.setAttribute('open', '');
    dialogEl.querySelector('[data-pmodal-close]')?.focus();
  }
}

function closeModal() {
  if (!dialogEl) return;
  document.documentElement.classList.remove('no-scroll');
  modalCtx.startLenis?.();
  delete dialogEl.dataset.openProject;
  if (dialogEl.open) dialogEl.close();
  // Devuelve el foco al elemento que abrió el modal (a11y)
  lastFocused?.focus?.();
  lastFocused = null;
}

function bindModal() {
  if (!dialogEl || !grid) return;

  grid.addEventListener('click', (event) => {
    const card = event.target.closest('[data-project-id]');
    if (!card) return;

    // Los enlaces "Código"/"Demo" no abren el modal
    if (event.target.closest('a[href^="http"]')) return;

    const project = projects.find((p) => p.id === card.dataset.projectId);
    if (project) openModal(project);
  });

  dialogEl.querySelector('[data-pmodal-close]').addEventListener('click', closeModal);

  // Clic en el fondo (fuera del panel) = cerrar
  dialogEl.addEventListener('click', (event) => {
    if (event.target === dialogEl) closeModal();
  });

  // Con show() el <dialog> no es modal: gestionamos Esc y el foco nosotros
  document.addEventListener('keydown', (event) => {
    if (!dialogEl.open) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    // Atrapar el Tab dentro del panel (equivale al focus trap nativo)
    if (event.key === 'Tab') {
      const nodes = dialogEl.querySelectorAll(FOCUSABLE);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialogEl.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialogEl.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // Cierre por cualquier vía: reanuda Lenis y limpia el bloqueo
  dialogEl.addEventListener('close', () => {
    document.documentElement.classList.remove('no-scroll');
    modalCtx.startLenis?.();
  });
}

/* ---------- tilt 3D propio (sin librería) ---------- */

function bindTilt() {
  if (reducedMotion || isTouch || !grid) return;

  grid.querySelectorAll('[data-tilt]').forEach((card) => {
    if (card.dataset.tiltReady) return;
    card.dataset.tiltReady = 'true';

    const setVars = (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;   // 0…1
      const py = (event.clientY - rect.top) / rect.height;
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
      card.style.setProperty('--ry', `${(px - 0.5) * 7}deg`);  // yaw
      card.style.setProperty('--rx', `${(0.5 - py) * 6}deg`);  // pitch
    };

    card.addEventListener('pointermove', setVars);
    card.addEventListener('pointerenter', () => (card.style.zIndex = '2'));
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.zIndex = '';
    });
  });
}

/* ---------- spotlight del borde según el cursor ---------- */

function bindSpotlight() {
  if (isTouch || !grid) return;

  grid.querySelectorAll('[data-spotlight]').forEach((card) => {
    if (card.dataset.spotReady) return;
    card.dataset.spotReady = 'true';

    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
  });
}

/* ---------- init ---------- */

export function initProjects(ctx = {}) {
  if (ctx.stopLenis) modalCtx.stopLenis = ctx.stopLenis;
  if (ctx.startLenis) modalCtx.startLenis = ctx.startLenis;
  if (!grid) return;

  renderProjects();
  bindModal();

  // Re-render al cambiar de idioma (texto corto/largos y aria-labels)
  document.addEventListener('langchange', () => {
    const openId = dialogEl?.open ? dialogEl.dataset.openProject : null;
    renderProjects();
    if (openId) {
      const project = projects.find((p) => p.id === openId);
      if (project) openModal(project);
    }
  });
}
