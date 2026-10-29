/* =========================================================
   netlify/functions/contact.mjs · adapter para Netlify
   Functions v2 (WebAPI estándar).
   Determina la función → netlify.toml (ver README).

   Requiere variable de entorno: RESEND_API_KEY (re_xxxxxxxx)
   Opcionales: RESEND_FROM, RESEND_TO
   ========================================================= */

import { handleContactRequest } from '../../api/_lib/sendContact.js';

export default async (req) => {
  const json = (status, body) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  if (req.method !== 'POST') return json(405, { ok: false, error: 'solo POST' });

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { ok: false, error: 'JSON inválido' });
  }

  const result = await handleContactRequest(payload);
  return json(result.status, result.body);
};
