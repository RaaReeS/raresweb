/* =========================================================
   js/modules/i18n.js
   Motor de internacionalización (ES/EN).
   - Traducción estática: [data-i18n], [data-i18n-html] y
     [data-i18n-attr="attr:key;attr2:key2|{var}=valor"].
   - Traducción dinámica: t(key, vars) con claves "ruta.clave".
   - Evento 'langchange' en document para los módulos.
   ========================================================= */

import { translations, LANG_STORAGE_KEY } from '../../data/translations.js';

let current = 'es';

/** Idioma activo. */
export const getLang = () => current;

/**
 * Traduce una clave con fallback al español.
 * @param {string} key  Ruta tipo "contact.title" (o "tab1|tab2" para fallback en cadena)
 * @param {Record<string, string|number>} [vars]  Marcadores {foo}
 * @returns {string}
 */
export function t(key, vars) {
  const lang = translations[current] ? current : 'es';
  const lookup = (id) =>
    id.split('.').reduce((node, part) => (node == null ? node : node[part]), translations[lang]);

  let value = lookup(key);
  if (value == null) {
    // Fallback: acepta claves alternativas separadas por "|"
    for (const alt of key.split('|')) {
      const candidate = lookup(alt.trim());
      if (candidate != null) {
        value = candidate;
        break;
      }
    }
  }
  if (value == null) return key;

  const base = typeof value === 'string' ? value : String(value);
  if (!vars) return base;
  return base.replace(/\{(\w+)\}/g, (_, name) => (vars[name] != null ? String(vars[name]) : ''));
}

/** Parsea "placeholder:contact.phName;aria-label:x|{n}=2" → listado estructurado. */
function parseAttrs(spec) {
  return spec
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [attrAndKey] = [chunk];
      const colon = attrAndKey.indexOf(':');
      if (colon === -1) return null;
      const attr = attrAndKey.slice(0, colon).trim();
      const rest = attrAndKey.slice(colon + 1).trim();
      const [keyPart, ...varParts] = rest.split('|').map((p) => p.trim()).filter(Boolean);

      const vars = {};
      for (const pv of varParts) {
        const eq = pv.indexOf('=');
        if (eq === -1) continue;
        const name = pv.slice(0, eq).trim().replace(/[{}]/g, '');
        vars[name] = pv.slice(eq + 1).trim();
      }
      return { attr, key: keyPart, vars };
    })
    .filter(Boolean);
}

/** Aplica los textos estáticos a todo el documento. */
export function applyTexts() {
  document.documentElement.lang = current;

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const value = t(node.dataset.i18n);
    if (value) node.textContent = value;
  });

  document.querySelectorAll('[data-i18n-html]').forEach((node) => {
    const value = t(node.dataset.i18nHtml);
    if (value) node.innerHTML = value;
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((node) => {
    for (const { attr, key, vars } of parseAttrs(node.dataset.i18nAttr)) {
      const value = t(key, vars);
      if (value) node.setAttribute(attr, value);
    }
  });

  // Metadatos del documento también cambian de idioma
  document.title = t('meta.title');
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', t('meta.description'));
}

/** Marca el estado visual de los botones ES/EN y del atajo global. */
function syncLangUI() {
  document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    const isOn = btn.dataset.langBtn === current;
    btn.classList.toggle('is-on', isOn);
    btn.setAttribute('aria-pressed', String(isOn));
  });
}

/**
 * Cambia de idioma, lo persiste y avisa a los módulos.
 * @param {'es'|'en'} next
 */
export function setLang(next) {
  if (next !== 'es' && next !== 'en') return;
  current = next;

  try {
    localStorage.setItem(LANG_STORAGE_KEY, current);
  } catch { /* sin almacenamiento: no pasa nada */ }

  applyTexts();
  syncLangUI();
  document.dispatchEvent(new CustomEvent('langchange'));
}

/** Arranque: idioma guardado o español por defecto. */
export function initI18n() {
  let stored = null;
  try {
    stored = localStorage.getItem(LANG_STORAGE_KEY);
  } catch { /* noop */ }
  setLang(stored === 'en' || stored === 'es' ? stored : 'es');
}

/** Enlace UI de los conmutadores ES/EN del nav. */
export function bindLangButtons() {
  document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.langBtn));
  });
}
