/* =========================================================
   api/_lib/sendContact.js
   Lógica compartida del endpoint de contacto (Resend).

   - El cliente (js/modules/contact.js) POSTea JSON:
       { name, email, message, _gotcha }
   - Esta función valida en servidor, aplica el honeypot y
     llama a https://api.resend.com/emails con la API key
     leída de process.env (NUNCA en código del cliente).

   Variables de entorno:
       RESEND_API_KEY  → 're_xxxxxxxx' (obligatoria)
       RESEND_FROM     → p. ej. 'no-reply@raresweb.com'
                         (por defecto: onboarding@resend.dev)
       RESEND_TO       → destino (por defecto: SITE.EMAIL)

   Devuelve { status, body } listo para que cada adapter
   (Vercel / Netlify) lo devuelva tal cual.
   ========================================================= */

import { SITE } from '../../data/projects.js';

const API_URL = 'https://api.resend.com/emails';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Normaliza y valida el payload del formulario. */
function validate(payload = {}) {
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();
  const message = String(payload.message || '').trim();
  const gotcha = String(payload._gotcha || '').trim();

  if (name.length < 2 || name.length > 100) return null;
  if (!EMAIL_RE.test(email) || email.length > 200) return null;
  if (message.length < 10 || message.length > 5000) return null;

  return { name, email, message, gotcha };
}

/* Plantilla del email (texto plano + HTML sencillo con fallback). */
function buildEmail({ name, email, message }) {
  const from = `raresweb.com <${
    process.env.RESEND_FROM || 'onboarding@resend.dev'
  }>`;
  const to = [process.env.RESEND_TO || SITE.EMAIL];
  const subject = `Contacto web raresweb.com — ${name}`;

  const text =
    `Nombre: ${name}\n` +
    `Email: ${email}\n` +
    `URL: raresweb.com (formulario de contacto)\n\n` +
    `--- Mensaje ---\n${message}`;

  const html =
    `<div style="font-family:monospace,monospace;font-size:14px;line-height:1.6">` +
    `<p><b>Nombre:</b> ${escHTML(name)}<br><b>Email:</b> ${escHTML(email)}<br>` +
    `<b>Canal:</b> formulario raresweb.com</p>` +
    `<hr style="border:none;border-top:1px dashed #999">` +
    `<p>${escHTML(message).replace(/\n/g, '<br>')}</p>` +
    `</div>`;

  return { from, to, subject, text, html, reply_to: email };
}

/* Escape mínimo para el HTML del email. */
function escHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Punto de entrada común.
 * @param {unknown} payload cuerpo ya deserializado del request
 * @returns {Promise<{status:number, body:object}>}
 */
export async function handleContactRequest(payload) {
  const raw = payload && typeof payload === 'object' ? payload : {};

  // Honeypot: bot rellenó el campo oculto → éxito silencioso, no envía nada
  if (String(raw._gotcha || '').trim()) {
    return { status: 200, body: { ok: true, id: 'honeypot' } };
  }

  // Validación en servidor (antes de tocar el entorno o la red)
  const fields = validate(raw);
  if (!fields) {
    return { status: 400, body: { ok: false, error: 'campos inválidos' } };
  }

  // Solo ahora importa la API key (path real de envío)
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[contact] falta RESEND_API_KEY en el entorno');
    return { status: 500, body: { ok: false, error: 'sin configuración del servidor' } };
  }

  const email = buildEmail(fields);

  try {
    const upstream = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: email.from,
        to: email.to,
        reply_to: email.reply_to,
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
    });

    const out = await upstream.json().catch(() => ({}));

    if (upstream.ok && out.id) {
      return { status: 200, body: { ok: true, id: String(out.id) } };
    }
    console.error('[contact] Resend', upstream.status, out);
    return {
      status: 502,
      body: { ok: false, error: out.message || upstream.message || 'Resend devolvió error' },
    };
  } catch (networkError) {
    console.error('[contact] red', networkError);
    return { status: 502, body: { ok: false, error: 'no se pudo contactar con Resend' } };
  }
}
