'use strict';
/* NexaBot Email - Resend API wrapper (simple) */

const RESEND_API = 'https://api.resend.com/emails';

async function sendEmail({ to, subject, html, from }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.warn('[email] RESEND_API_KEY not set, skipping'); return null; }
  const sender = from || process.env.EMAIL_FROM || 'NexaBot <onboarding@resend.dev>';
  try {
    const r = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: sender, to, subject, html }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error('[email] send failed', r.status, t.slice(0, 200));
      return null;
    }
    return r.json();
  } catch (e) {
    console.error('[email] error', e.message);
    return null;
  }
}

function leadNotificationHtml(biz, message, sessionId) {
  return `
<!doctype html>
<html><body style="font-family:system-ui,sans-serif;background:#f5f5f5;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e5e5">
  <div style="border-bottom:3px solid #C9A84C;padding-bottom:12px;margin-bottom:20px">
    <h1 style="color:#0d0d0d;font-size:20px;margin:0">💼 Yeni Lead — ${escapeHtml(biz.name || 'NexaBot')}</h1>
  </div>
  <p style="color:#333;font-size:15px;line-height:1.6;margin-bottom:18px">Botuna gelen yeni potansiyel müşteri:</p>
  <div style="background:#f9f9f9;border-left:3px solid #C9A84C;padding:14px 18px;border-radius:8px;margin-bottom:18px">
    <p style="color:#555;font-size:14px;margin:0">"${escapeHtml(message)}"</p>
  </div>
  <p style="color:#666;font-size:13px;margin:6px 0">Session: <code>${escapeHtml(sessionId)}</code></p>
  <p style="color:#666;font-size:13px;margin:6px 0">İşletme: <b>${escapeHtml(biz.name || '-')}</b></p>
  <p style="color:#666;font-size:13px;margin:6px 0">Tarih: ${new Date().toLocaleString('tr-TR')}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="color:#888;font-size:12px;text-align:center">NexaBot · Admin paneli: <a href="https://nexabot-mkbjs.ondigitalocean.app/admin">Aç</a></p>
</div>
</body></html>`;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}

module.exports = { sendEmail, leadNotificationHtml };
