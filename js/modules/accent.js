/* =========================================================
   js/modules/accent.js
   Color principal electable ([data-accent] en <html>).
   - 4 paletas de marca: índigo (por defecto), violeta,
     esmeralda y ámbar/coral; solo cambian --indigo/--cyan (y
     sus -2): los degradados (--grad) y glows derivan con
     color-mix en styles.css.
   - Persistencia en localStorage + anti-flash inline en <head>.
   - UI: desplegable junto al tema en la barra (≥921px) y fila
     de muestras dentro del panel móvil (≤920px).
   - Emite 'accentchange' (canvas de partículas se recolorea).
   ========================================================= */

const ACCENT_KEY = 'portfolio_accent';

const VALID = new Set(['indigo', 'violeta', 'esmeralda', 'naranja']);

/** Id de la paleta activa (fraude tolerante: si no hay, índigo). */
export function getAccent() {
  const id = document.documentElement.dataset.accent;
  return VALID.has(id) ? id : 'indigo';
}

/** Cierra cualquier desplegable de color que esté abierto. */
function closeMenus() {
  document.querySelectorAll('[data-accent-wrap].is-open').forEach((wrap) => {
    wrap.classList.remove('is-open');
    wrap.querySelector('[data-accent-btn]')?.setAttribute('aria-expanded', 'false');
  });
}

/** Marca la muestra activa en desplegable (aria-checked) y panel (aria-pressed). */
function sync() {
  const current = getAccent();
  document.querySelectorAll('[data-accent-set]').forEach((item) => {
    const on = item.dataset.accentSet === current;
    item.classList.toggle('is-on', on);
    if (item.hasAttribute('aria-checked')) {
      item.setAttribute('aria-checked', String(on));
    } else {
      item.setAttribute('aria-pressed', String(on));
    }
  });
}

/**
 * Aplica un color principal con un morph suave y lo persiste.
 * @param {'indigo'|'violeta'|'esmeralda'|'naranja'} id
 */
export function setAccent(id) {
  if (!VALID.has(id)) return;
  const html = document.documentElement;

  // Deja a la clase theme-anim hacer el morph de colores
  // (puntero a la misma infraestructura que el tema; con reduced
  // motion la regla global la neutraliza → cambio seco).
  html.classList.add('theme-anim');
  window.setTimeout(() => html.classList.remove('theme-anim'), 300);

  html.dataset.accent = id;

  try {
    localStorage.setItem(ACCENT_KEY, id);
  } catch { /* sin almacenamiento */ }

  sync();
  closeMenus();
  document.dispatchEvent(new CustomEvent('accentchange', { detail: { accent: id } }));
}

/** Cablea botón del nav, muestras, cierre por clic fuera y Esc. */
export function initAccent() {
  // Por si el inline del <head> no pudo (navegación privada)
  let stored = null;
  try {
    stored = localStorage.getItem(ACCENT_KEY);
  } catch { /* noop */ }
  if (!document.documentElement.dataset.accent && VALID.has(stored)) {
    document.documentElement.dataset.accent = stored;
  }

  document.querySelectorAll('[data-accent-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('[data-accent-wrap]');
      const open = wrap.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  document.querySelectorAll('[data-accent-set]').forEach((item) => {
    item.addEventListener('click', () => setAccent(item.dataset.accentSet));
  });

  // Cierres: clic fuera del desplegable y tecla Esc
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-accent-wrap]')) closeMenus();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenus();
  });

  sync();
}
