/* =========================================================
   js/modules/contact.js
   Formulario estilo terminal:
   - CONFIG single point: CONTACT_ENDPOINT (ruta del backend
     serverless que envía con Resend). Si queda vacío, el
     sitio actúa en "modo local" y abre el cliente de correo
     (mailto) con los campos rellenados.
   - Validación en vivo, estados enviando/éxito/error,
     honeypot anti-spam, toast de feedback (también importado
     por la paleta de comandos para "copiar email").
   ========================================================= */

import { t } from './i18n.js';
import { SITE } from '../../data/projects.js';

/* ┌─────────────────────────────────────────────────────┐
   │  ⚙️  CONFIGURACIÓN ÚNICA                             │
   │  Ruta del endpoint que envía el email con Resend.    │
   │  - Vercel:  '/api/contact'      (api/contact.js)     │
   │  - Netlify: '/.netlify/functions/contact'            │
   │  - Vacío ''  → modo local (mailto, sin backend)      │
   └─────────────────────────────────────────────────────┘ */
export const CONTACT_ENDPOINT = '/api/contact'; // ← CAMBIAR/VACIAR AQUÍ

const form = document.querySelector('[data-contact-form]');
const submitBtn = document.querySelector('[data-form-submit]');
const btnTextEl = document.querySelector('[data-form-btn-text]');
const spinner = document.querySelector('[data-form-spinner]');
const sendIcon = document.querySelector('[data-form-icon]');
const noteOk = document.querySelector('[data-form-note]');
const noteErr = document.querySelector('[data-form-note-err]');
const noteInfo = document.querySelector('[data-form-note-info]');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* =========================================================
   TOAST · feedback global (lo usa también commandPalette)
   ========================================================= */

export function notify(message, ms = 3200) {
  const wrap = document.querySelector('[data-toast-wrap]');
  if (!wrap) return;

  const toast = document.createElement('output');
  toast.classList.add('toast');
  toast.innerHTML =
    '<svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>';
  toast.append(document.createTextNode(message));
  wrap.appendChild(toast);

  window.setTimeout(() => toast.classList.add('is-leaving'), ms);
  window.setTimeout(
    () => {
      toast.remove();
      if (!wrap.children.length) wrap.innerHTML = '';
    },
    ms + 400
  );
}

/* =========================================================
   Copiar al portapapeles (con fallback legacy)
   ========================================================= */

export async function copyEmail() {
  try {
    await navigator.clipboard.writeText(SITE.EMAIL);
    notify(t('contact.copyToast'));
  } catch {
    // Fallback para contextos sin Clipboard API
    const input = document.createElement('textarea');
    input.value = SITE.EMAIL;
    input.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      notify(t('contact.copyToast'));
    } catch {
      notify(t('contact.copyErr'));
    }
    input.remove();
  }
}

/* =========================================================
   Validación
   ========================================================= */

function setError(fieldEl, msgEl, message) {
  msgEl.textContent = message || '';
  if (message) {
    fieldEl.setAttribute('aria-invalid', 'true');
  } else {
    fieldEl.removeAttribute('aria-invalid');
  }
}

function validateField(kind) {
  const input = form.querySelector(`#field-${kind}`);
  const msg = form.querySelector(`#msg-${kind}`);
  if (!input || !msg) return true;

  const value = input.value.trim();

  if (kind === 'name') {
    if (!value) return setError(input, msg, t('contact.nameV1')), false;
    if (value.length < 2) return setError(input, msg, t('contact.nameV2')), false;
    return setError(input, msg, ''), true;
  }

  if (kind === 'email') {
    if (!value) return setError(input, msg, t('contact.emailV1')), false;
    if (!EMAIL_RE.test(value)) return setError(input, msg, t('contact.emailV2')), false;
    return setError(input, msg, ''), true;
  }

  // message
  if (!value) return setError(input, msg, t('contact.msgV1')), false;
  if (value.length < 10) return setError(input, msg, t('contact.msgV2')), false;
  return setError(input, msg, ''), true;
}

function validateAll() {
  let ok = true;
  for (const kind of ['name', 'email', 'message']) {
    if (!validateField(kind)) ok = false;
  }
  return ok;
}

/* =========================================================
   Estados de envío
   ========================================================= */

function setState(state, extra = {}) {
  const isBusy = state === 'sending';
  if (spinner) spinner.hidden = !isBusy;
  if (sendIcon) sendIcon.hidden = isBusy;
  if (submitBtn) submitBtn.disabled = isBusy;
  if (btnTextEl) {
    btnTextEl.textContent =
      state === 'sending' ? t('contact.sending') : t('contact.btn');
  }
}

function showNote(node, html) {
  for (const n of [noteOk, noteErr, noteInfo]) {
    if (n) {
      n.classList.remove('is-visible');
      n.innerHTML = '';
    }
  }
  if (node && html) {
    node.innerHTML = html;
    node.classList.add('is-visible');
  }
}

/* Enlace mailto pre-rellenado (fallback sin backend / error) */
function mailtoHref() {
  const name = form.querySelector('#field-name');
  const email = form.querySelector('#field-email');
  const message = form.querySelector('#field-message');
  const subject = `Contacto web — ${name?.value.trim() || 'usuario'}`;
  const body = `[${t('contact.fLabelName')}] ${name?.value.trim() || ''}\n[${t(
    'contact.fLabelEmail'
  )}] ${email?.value.trim() || ''}\n\n${message?.value.trim() || ''}`;
  return `mailto:${SITE.EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* =========================================================
   Envío
   ========================================================= */

async function handleSubmit(event) {
  event.preventDefault();

  showNote(null);

  // Honeypot: los bots rellenan el campo oculto → éxito silencioso
  if (form.querySelector('#hp')?.value) {
    showNote(noteOk, `<span>${t('contact.okTitle')}</span><span>${t('contact.okBody')}</span>`);
    form.reset();
    return;
  }

  if (!validateAll()) return;

  const configured = Boolean(CONTACT_ENDPOINT);

  // Modo local (sin backend): mailto con los datos ya escritos
  if (!configured) {
    showNote(
      noteInfo,
      `<span>${t('contact.noId')}</span><a href="${mailtoHref()}">${t('contact.mailto')}</a>`
    );
    window.location.href = mailtoHref();
    setState('idle');
    return;
  }

  setState('sending');

  try {
    const response = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.querySelector('#field-name')?.value.trim() ?? '',
        email: form.querySelector('#field-email')?.value.trim() ?? '',
        message: form.querySelector('#field-message')?.value.trim() ?? '',
        _gotcha: form.querySelector('#hp')?.value ?? '', // honeypot
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (response.ok && data.ok) {
      showNote(
        noteOk,
        `<span>${t('contact.okTitle')}</span><span>${t('contact.okBody')}</span>`
      );
      form.reset();
      ['name', 'email', 'message'].forEach((kind) => {
        const input = form.querySelector(`#field-${kind}`);
        input && input.removeAttribute('aria-invalid');
      });
    } else {
      throw new Error(data.error || 'endpoint error');
    }
  } catch {
    showNote(
      noteErr,
      `<span>${t('contact.errTitle')}</span><span>${t('contact.errBody')}</span>
       <a href="${mailtoHref()}">${t('contact.mailto')}</a>`
    );
  } finally {
    setState('idle');
  }
}

/* Boots del módulo */
export function initContact() {
  if (!form) return;

  // Validación en tiempo real
  ['name', 'email', 'message'].forEach((kind) => {
    const input = form.querySelector(`#field-${kind}`);
    if (!input) return;

    input.addEventListener('blur', () => validateField(kind));
    input.addEventListener('input', () => {
      // solo limpiamos mientras escribe si hubo error visible
      if (input.getAttribute('aria-invalid')) validateField(kind);
    });
  });

  form.addEventListener('submit', handleSubmit);

  // Copiar el email (canal directo en el panel)
  document
    .querySelectorAll('[data-copy-email]')
    .forEach((btn) => btn.addEventListener('click', copyEmail));
}
