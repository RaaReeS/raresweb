/* =========================================================
   api/contact.js · adapter para Vercel Serverless Functions
   Cuerpo JSON → api/_lib/sendContact.js → Resend API.

   Requiere variable de entorno: RESEND_API_KEY (re_xxxxxxxx)
   Opcionales: RESEND_FROM, RESEND_TO
   ========================================================= */

import { handleContactRequest } from './_lib/sendContact.js';

export default async function handler(req, res) {
  const cors = { 'Content-Type': 'application/json' };

  if (req.method !== 'POST') {
    res.status(405).setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'solo POST' }));
    return;
  }

  // Vercel entrega req.body ya parseado (JSON). Si llega como
  // string (content-type no estándar), se intenta parsear aquí.
  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      res.status(400).setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'JSON inválido' }));
      return;
    }
  }

  const result = await handleContactRequest(payload);
  res.status(result.status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result.body));
}
