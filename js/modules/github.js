/* =========================================================
   js/modules/github.js
   Repositorios en vivo desde la API pública de GitHub:
   - cache en sessionStorage (TTL 60 min; se ignora si la API
     falla y hay caché aunque caducada, por cortesía de límites)
   - manejo de errores + reintento manual
   - fallback a los dos repos locales (data/projects.js)
   ========================================================= */

import { SITE, projects } from '../../data/projects.js';
import { t, getLang } from './i18n.js';

const CACHE_KEY = 'gh_repos';
const CACHE_TTL = 60 * 60 * 1000; // 1 hora
const API_URL = `https://api.github.com/users/${SITE.GITHUB_USER}/repos?per_page=100&sort=updated`;

const grid = document.querySelector('[data-gh-grid]');
const note = document.querySelector('[data-gh-note]');
const noteText = document.querySelector('[data-gh-note-text]');
const noteRetry = document.querySelector('[data-gh-retry]');
const countEl = document.querySelector('[data-gh-count]');

/* Colores aproximados del lenguaje (palette de GitHub). */
const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  Java: '#b07219',
  PHP: '#4f5d95',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  C: '#555555',
};

/* ---------- cache ---------- */

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    if (!cache || !Array.isArray(cache.items)) return null;
    return cache;
  } catch {
    return null;
  }
}

function writeCache(items) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items }));
  } catch { /* sesión sin storage: se omitirá la caché */ }
}

const cacheIsFresh = (cache) => cache && Date.now() - cache.ts < CACHE_TTL;

/* ---------- fetch ---------- */

async function fetchRepos(signal) {
  const response = await fetch(API_URL, {
    signal,
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status}`);

  const raw = await response.json();
  // Descartamos forks y ordenamos por más recientes
  return raw
    .filter((repo) => !repo.fork && !repo.archived)
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
}

/* ---------- fallback local ---------- */

function localFallback() {
  return projects.map((p, index) => ({
    name: p.title,
    html_url: p.repo,
    description: p.short[getLang() === 'en' ? 'en' : 'es'],
    language: index === 0 ? 'Python' : 'PHP',
    stargazers_count: 0,
    pushed_at: null,
    _local: true,
  }));
}

/* ---------- render ---------- */

function repoCardHTML(repo) {
  const dateFmt = new Intl.DateTimeFormat(getLang() === 'en' ? 'en-GB' : 'es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const updated = repo.pushed_at
    ? dateFmt.format(new Date(repo.pushed_at))
    : '—';

  return `
    <article class="glass repo-card">
      <div class="repo-card__top">
        <a class="repo-card__name mono" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
          ${repo.name}
        </a>
        <svg class="icon" aria-hidden="true"><use href="#i-external"/></svg>
      </div>
      <p class="repo-card__desc">${escapeHTML(repo.description || '—')}</p>
      <div class="repo-card__meta">
        <span class="repo-card__lang" style="--lang-color: ${LANG_COLORS[repo.language] || 'var(--faint)'}">
          ${repo.language || '—'}
        </span>
        <span>★ ${repo.stargazers_count ?? 0}</span>
        <span>${t('gh.updated')}: ${updated}</span>
      </div>
    </article>
  `;
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function skeletonHTML() {
  return `
    <div class="glass repo-card repo-card--skeleton" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
  `;
}

function showNote(text, { retry = false } = {}) {
  if (!note || !noteText) return;
  noteText.textContent = text;
  note.classList.toggle('is-visible', Boolean(text));
  if (noteRetry) {
    noteRetry.hidden = !retry;
  }
}

let currentSet = null; // repos mostrados ahora mismo (para re-render de idioma)

function renderRepos(repos) {
  if (!grid) return;
  currentSet = repos;
  grid.innerHTML = repos.map(repoCardHTML).join('');
  if (countEl) {
    countEl.hidden = false;
    countEl.textContent = t('gh.count', { n: repos.length });
  }
}

/* ---------- orquestación ---------- */

async function load({ signal } = {}) {
  if (!grid) return;

  // 1) ¿Caché fresca de la sesión?
  const cache = readCache();
  if (cacheIsFresh(cache)) {
    renderRepos(cache.items);
    showNote(t('gh.cached'));
    return;
  }

  // 2) API en vivo
  showNote('');
  grid.innerHTML = skeletonHTML().repeat(3);
  if (countEl) countEl.hidden = true;

  try {
    const repos = await fetchRepos(signal);
    writeCache(repos);
    renderRepos(repos);
    showNote('');
    return;
  } catch (error) {
    if (signal?.aborted) return; // cambio de página: silencio
    if (error && error.name === 'AbortError') return;
  }

  // 3) La API falló: ¿caché caducada? → úsala igualmente
  const stale = readCache();
  if (stale) {
    renderRepos(stale.items);
    showNote(t('gh.cached'));
    return;
  }

  // 4) Última red de seguridad: datos locales
  renderRepos(localFallback());
  showNote(t('gh.error'), { retry: true });
}

export function initGitHub() {
  if (!grid) return;

  load();

  if (noteRetry) {
    noteRetry.addEventListener('click', () => load());
  }

  // Reformatear fechas y descripciones al cambiar de idioma (sin refetch)
  document.addEventListener('langchange', () => {
    if (currentSet) renderRepos(currentSet);
    if (note && note.classList.contains('is-visible')) {
      const hasRetry = noteRetry && !noteRetry.hidden;
      showNote(hasRetry ? t('gh.error') : t('gh.cached'), { retry: hasRetry });
    }
  });
}
