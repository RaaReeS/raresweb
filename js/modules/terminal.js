/* =========================================================
   js/modules/terminal.js
   1) Secuencia de terminal que se escribe sola en el hero.
   2) Pestañas del editor de código "Sobre mí" (click + teclado).
   Ambos respetan prefers-reduced-motion y se re-ejecutan al
   cambiar de idioma.
   ========================================================= */

import { t } from './i18n.js';

/* Definición de secuencia: comandos (estáticos) y salidas (traducidas).
   Además de la que pide el diseño añado $ locale como guiño bilingüe */
function sequence() {
  return [
    { cmd: t('term.cmdWhoami'), out: t('term.outWhoami'), ok: false },
    { cmd: t('term.cmdRole'), out: t('term.outRole'), ok: false },
    { cmd: t('term.cmdStatus'), out: t('term.outStatus'), ok: true },
    { cmd: t('term.cmdLocale'), out: t('term.outLocale'), ok: false },
  ];
}

const reducedMotion =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Estado del run en curso */
let runId = 0;
let isVisible = true;

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Construye (o reinicia) el DOM de líneas del terminal. */
function buildLine(body) {
  const line = document.createElement('div');
  line.className = 'term__line';
  const prompt = document.createElement('span');
  prompt.className = 't-prompt';
  prompt.textContent = '$ ';
  const cmd = document.createElement('span');
  cmd.className = 't-cmd';
  const caret = document.createElement('span');
  caret.className = 't-caret';
  caret.setAttribute('aria-hidden', 'true');
  line.append(prompt, cmd, caret);
  body.appendChild(line);
  return { cmd, caret };
}

function buildOutput(body, text, ok) {
  const outLine = document.createElement('div');
  outLine.className = 'term__out' + (ok ? ' term__out--ok' : '');
  const mark = document.createElement('span');
  mark.className = 'term__out-mark';
  mark.textContent = '→';
  const text_ = document.createElement('span');
  text_.textContent = text;
  outLine.append(mark, text_);
  body.appendChild(outLine);
}

function buildFinalCaret(body) {
  const line = document.createElement('div');
  line.className = 'term__line';
  const prompt = document.createElement('span');
  prompt.className = 't-prompt';
  prompt.textContent = '$ ';
  const caret = document.createElement('span');
  caret.className = 't-caret';
  caret.setAttribute('aria-hidden', 'true');
  line.append(prompt, caret);
  body.appendChild(line);
}

/** Render instantáneo, sin la animación (reduced-motion / salto manual). */
function renderStatic() {
  const body = document.querySelector('[data-term-body]');
  if (!body) return;
  body.textContent = '';

  for (const step of sequence()) {
    const { cmd } = buildLine(body);
    cmd.textContent = step.cmd;
    lineRemoveCaret(body.lastElementChild);
    buildOutput(body, step.out, step.ok);
  }
  buildFinalCaret(body);
}

function lineRemoveCaret(lineEl) {
  const caret = lineEl && lineEl.querySelector('.t-caret');
  if (caret) caret.remove();
}

/** Secuencia animada principal. */
async function typeSequence() {
  const body = document.querySelector('[data-term-body]');
  if (!body) return;

  const id = ++runId;
  body.textContent = '';

  if (reducedMotion) {
    renderStatic();
    return;
  }

  for (const step of sequence()) {
    const { cmd, caret } = buildLine(body);

    // mecanografiado con ligera irregularidad humana
    for (let i = 0; i < step.cmd.length; i++) {
      if (id !== runId) return;
      cmd.textContent = step.cmd.slice(0, i + 1);
      await sleep(step.cmd === t('term.cmdWhoami') ? 52 : 34 + Math.random() * 28);
      while (!isVisible && id === runId) await sleep(180); // pausa si no está a la vista
    }
    if (id !== runId) return;
    caret.remove();

    await sleep(190);
    if (id !== runId) return;
    buildOutput(body, step.out, step.ok);
    await sleep(150);
  }

  buildFinalCaret(body);
}

/**
 * Arranca el terminal; se pausa fuera de pantalla (IntersectionObserver)
 * para no malgastar CPU y reinicia al cambiar el idioma.
 */
export function initTerminal() {
  const term = document.querySelector('[data-terminal]');
  const body = document.querySelector('[data-term-body]');
  if (!term || !body) return;

  typeSequence();

  // Saltar la animación con un clic (calidad de vida)
  term.addEventListener('click', () => {
    runId++; // invalida el bucle actual
    renderStatic();
  });

  new IntersectionObserver(
    (entries) => {
      isVisible = entries[0]?.isIntersecting ?? true;
    },
    { threshold: 0.08 }
  ).observe(term);

  document.addEventListener('langchange', typeSequence);
}

/* =========================================================
   Pestañas del editor (about.js · skills.json · contact.md)
   Roving tabindex + rol/teclado correctos (tablist ARIA).
   ========================================================= */

function selectTab(tabs, next) {
  tabs.forEach((tab) => {
    const selected = tab === next;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    if (panel) panel.hidden = !selected;
  });
  next.focus();
}

export function initEditorTabs() {
  const tablist = document.querySelector('[data-editor] .editor__tabs');
  if (!tablist) return;

  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => selectTab(tabs, tab));
  });

  tablist.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) return;

    let target = null;
    if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
    else if (event.key === 'ArrowLeft') target = tabs[(index - 1 + tabs.length) % tabs.length];
    else if (event.key === 'Home') target = tabs[0];
    else if (event.key === 'End') target = tabs[tabs.length - 1];

    if (target) {
      event.preventDefault();
      selectTab(tabs, target);
    }
  });
}
