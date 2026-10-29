/* =========================================================
   js/modules/commandPalette.js
   Paleta tipo VS Code con Ctrl/Cmd + K (y botón visible):
   - navegar a secciones
   - cambiar tema, cambiar idioma
   - abrir GitHub/LinkedIn, copiar email, descargar CV
   Accesible: popup, listbox, flechas + Enter + Esc, foco
   devuelto al cerrar, aria-activedescendant dinámico.
   ========================================================= */

import { t, setLang, getLang } from './i18n.js';
import { getTheme, toggleTheme } from './theme.js';
import { notify, copyEmail } from './contact.js';
import { SITE } from '../../data/projects.js';

let palette, panel, input, listEl;
let items = [];        // { id, group, label, icon, kbd, run }
let filtered = [];     // índices visibles
let activeIndex = -1;
let lastFocus = null;
let sharedCtx = null;

/* ---------- definición de comandos (i18n-aware) ---------- */

function buildItems(ctx) {
  const sections = [
    { id: 'inicio', key: 'nav.home' },
    { id: 'sobre-mi', key: 'nav.about' },
    { id: 'stack', key: 'nav.skills' },
    { id: 'proyectos', key: 'nav.projects' },
    { id: 'formacion', key: 'nav.education' },
    { id: 'certificaciones', key: 'timeline.titleCert' },
    { id: 'idiomas', key: 'nav.languages' },
    { id: 'contacto', key: 'nav.contact' },
  ];

  return [
    // Navegación
    ...sections.map((sec) => ({
      id: `go:${sec.id}`,
      group: t('palette.gNav'),
      label: `${t('palette.go')} ${t(sec.key)}`,
      icon: 'i-layers',
      kbd: '↵',
      run: () => ctx.scrollToSection(sec.id),
    })),

    // Acciones
    {
      group: t('palette.gActions'), id: 'theme', label: t('palette.theme', {
        theme: getTheme() === 'light' ? t('palette.themeLight') : t('palette.themeDark'),
      }),
      icon: 'i-moon',
      run: () => toggleTheme(),
    },
    {
      group: t('palette.gActions'), id: 'lang-es', label: t('palette.langEs'),
      icon: 'i-terminal',
      run: () => setLang('es'),
    },
    {
      group: t('palette.gActions'), id: 'lang-en', label: t('palette.langEn'),
      icon: 'i-terminal',
      run: () => setLang('en'),
    },
    {
      group: t('palette.gActions'), id: 'copy', label: t('palette.mail'),
      icon: 'i-copy',
      run: () => copyEmail(),
    },
    {
      group: t('palette.gActions'), id: 'cv', label: t('palette.cv'),
      icon: 'i-download',
      run: () => {
        window.location.href = SITE.CV_PATH;
      },
    },

    // Enlaces externos
    {
      group: t('palette.gLinks'), id: 'gh', label: t('palette.gh'),
      icon: 'i-github',
      run: () => window.open(SITE.GITHUB_URL, '_blank', 'noopener'),
    },
    {
      group: t('palette.gLinks'), id: 'li', label: t('palette.li'),
      icon: 'i-linkedin',
      run: () => window.open(SITE.LINKEDIN_URL, '_blank', 'noopener'),
    },
  ];
}

/* ---------- render ---------- */

function iconSVG(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#${name}"/></svg>`;
}

function renderList() {
  if (!listEl || !input) return;

  filtered = [];
  listEl.innerHTML = '';

  const query = input.value.trim().toLowerCase();

  items.forEach((item, index) => {
    if (query && !item.label.toLowerCase().includes(query)) return;
    filtered.push(index);
  });

  if (!filtered.length) {
    listEl.innerHTML = `<p class="palette__empty">${t('palette.empty')}</p>`;
    setActive(-1);
    return;
  }

  let lastGroup = null;
  filtered.forEach((itemIndex) => {
    const item = items[itemIndex];

    if (item.group !== lastGroup) {
      const group = document.createElement('p');
      group.className = 'palette__group';
      group.textContent = item.group;
      listEl.appendChild(group);
      lastGroup = item.group;
    }

    const buttonEl = document.createElement('button');
    buttonEl.type = 'button';
    buttonEl.className = 'palette__item';
    buttonEl.id = `palette-item-${itemIndex}`;
    buttonEl.setAttribute('role', 'option');
    buttonEl.innerHTML = iconSVG(item.icon) + `<span>${item.label}</span>` +
      (item.kbd ? `<kbd>${item.kbd}</kbd>` : '');
    buttonEl.addEventListener('click', () => runItem(itemIndex));
    listEl.appendChild(buttonEl);
  });

  setActive(0);
}

function setActive(next) {
  activeIndex = next;
  const options = listEl.querySelectorAll('[role="option"]');
  options.forEach((opt, index) => {
    const itemIndex = filtered[index];
    const isActive = itemIndex === activeIndex;
    opt.classList.toggle('is-active', isActive);
    opt.setAttribute('aria-selected', String(isActive));
  });
  const active = options[filtered.findIndex((value) => value === activeIndex)];
  if (active && input) {
    listEl.setAttribute('aria-activedescendant', active.id);
    input.removeAttribute('aria-activedescendant');
    active.scrollIntoView({ block: 'nearest' });
  } else if (listEl) {
    listEl.removeAttribute('aria-activedescendant');
  }
}

function runItem(itemIndex) {
  const item = items[itemIndex];
  if (!item) return;
  close();
  // Pequeño aplazamiento para que la paleta cierre con soltura
  window.setTimeout(() => item.run(), 60);
}

/* ---------- aperturas y cierre ---------- */

function open(ctx) {
  if (!palette) return;
  lastFocus = document.activeElement;
  items = buildItems(ctx);

  palette.hidden = false;
  requestAnimationFrame(() => palette.classList.add('is-open'));

  input.value = '';
  renderList();
  input.focus();

  document.documentElement.classList.add('no-scroll');
  ctx?.stopLenis?.();
}

function close() {
  if (!palette) return;
  palette.classList.remove('is-open');
  window.setTimeout(() => (palette.hidden = true), 220);

  document.documentElement.classList.remove('no-scroll');
  lastFocus && lastFocus.focus?.();
  lastFocus = null;
  sharedCtx?.startLenis?.();
}

/* ---------- init ---------- */

export function initPalette(ctx) {
  sharedCtx = ctx;
  palette = document.querySelector('[data-palette]');
  input = document.querySelector('[data-palette-input]');
  listEl = document.querySelector('[data-palette-list]');
  if (!palette || !input || !listEl) return;

  panel = palette.querySelector('.palette__panel');

  // Abrir con Ctrl/Cmd + K en cualquier parte de la página
  document.addEventListener('keydown', (event) => {
    const mod = event.metaKey || event.ctrlKey;
    if (mod && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      palette.classList.contains('is-open') ? close() : open(ctx);
    }
    if (event.key === 'Escape' && palette.classList.contains('is-open')) {
      close();
    }
  });

  // Botón visible del nav
  document.querySelectorAll('[data-palette-open]').forEach((btn) => {
    btn.addEventListener('click', () => open(ctx));
  });

  // Intros de atajos de plataforma en el kbd del botón (⌘ en macOS)
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '');
  document.querySelectorAll('[data-palette-kbd]').forEach((kbd) => {
    kbd.textContent = `${isMac ? '⌘' : 'Ctrl'} K`;
  });

  // Filtro en vivo
  input.addEventListener('input', renderList);

  // Navegación por teclado dentro del input
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const pos = filtered.findIndex((value) => value === activeIndex);
      setActive(filtered[Math.min(pos + 1, filtered.length - 1)] ?? -1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const pos = filtered.findIndex((value) => value === activeIndex);
      setActive(filtered[Math.max(pos - 1, 0)] ?? -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0) runItem(activeIndex);
    } else if (event.key === 'Escape') {
      close();
    }
  });

  // Clic en el fondo
  document.querySelector('[data-palette-backdrop]')?.addEventListener('click', close);

  // Re-render con el idioma nuevo
  document.addEventListener('langchange', () => {
    if (palette.classList.contains('is-open')) {
      items = buildItems(ctx);
      renderList();
    }
  });

  document.addEventListener('themechange', () => {
    if (palette.classList.contains('is-open')) renderList();
  });
}
