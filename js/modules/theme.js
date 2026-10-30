/* =========================================================
   js/modules/theme.js
   Tema oscuro / claro con persistencia en localStorage y
   respeto por prefers-color-scheme (el inline anticipado del
   <head> ya fijó el tema para evitar parpadeo; aquí solo
   cableamos la interacción y la transición suave).
   ========================================================= */

const THEME_KEY = 'portfolio_theme';

const prefersLight = () =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

/** Consulta el tema aplicado en el elemento raíz. */
export function getTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Estado (para textos de la paleta: "actual: claro"). */
export const isLight = () => getTheme() === 'light';

/**
 * Aplica un tema con transición y lo persiste.
 * @param {'light'|'dark'} theme
 */
export function setTheme(theme) {
  const html = document.documentElement;
  if (getTheme() === theme) return;

  const applyChange = () => {
    html.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch { /* sin almacenamiento */ }
    // Notifica a módulos dependientes (canvas de partículas, cielo…)
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  };

  // Vía rápida: View Transitions API → un único crossfade compuesto por
  // GPU (Chrome/Edge/Safari). Repintar TODO el DOM con transitions por
  // elemento es lo que se percibe como "lag" al cambiar de tema.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !reduced) {
    document.startViewTransition(applyChange);
    return;
  }

  // Reserva: transición global de colores durante una breve ventana
  // (cubre el morph de 240ms del CSS; más larga solo cuesta)
  html.classList.add('theme-anim');
  window.setTimeout(() => html.classList.remove('theme-anim'), 300);
  applyChange();
}

export function toggleTheme() {
  setTheme(getTheme() === 'light' ? 'dark' : 'light');
}

/**
 * Inicializa el tema por primera vez (por si el inline no pudo,
 * p. ej. navegación privada) y conecta los botones de alternancia.
 */
export function initTheme() {
  if (!document.documentElement.dataset.theme) {
    const stored = (() => {
      try {
        return localStorage.getItem(THEME_KEY);
      } catch {
        return null;
      }
    })();
    document.documentElement.dataset.theme = stored || (prefersLight() ? 'light' : 'dark');
  }

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      toggleTheme();
      btn.blur(); // devolvemos el foco al botón, no al fondo de la página
    });
  });

  // Icono visible según tema (sol en oscuro → "cambia a claro")
  syncThemeUI();
  document.addEventListener('themechange', syncThemeUI);
}

/** Muestra el icono "siguiente estado" y actualiza aria-labels. */
function syncThemeUI() {
  const light = isLight();
  document.querySelectorAll('html .icon-sun').forEach((el) => (el.style.display = light ? 'none' : ''));
  document.querySelectorAll('html .icon-moon').forEach((el) => (el.style.display = light ? '' : 'none'));
}
