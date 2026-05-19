'use strict';
/* NexaBot WhatsApp Cloud API integration */
const crypto = require('crypto');

const GRAPH = 'https://graph.facebook.com/v20.0';

async function sendMessage(phoneNumberId, accessToken, toPhone, text) {
  const url = `${GRAPH}/${phoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: String(toPhone),
    type: 'text',
    text: { preview_url: false, body: String(text).slice(0, 4096) },
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const errTxt = await r.text();
    throw new Error(`WhatsApp send failed ${r.status}: ${errTxt.slice(0, 300)}`);
  }
  return r.json();
}

function verifySignature(rawBody, signatureHeader, appSecret) {
  if (!signatureHeader || !appSecret) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader)); }
  catch { return false; }
}

/**
 * Parse incoming WhatsApp webhook payload.
 * Returns { phoneNumberId, from, text, messageId } or null.
 */
function parseIncoming(body) {
  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    if (!value) return null;
    const phoneNumberId = value.metadata?.phone_number_id;
    const msg = value.messages?.[0];
    if (!msg || msg.type !== 'text') return null;
    return {
      phoneNumberId,
      from: msg.from,
      text: msg.text?.body || '',
      messageId: msg.id,
    };
  } catch { return null; }
}

module.exports = { sendMessage, verifySignature, parseIncoming };
