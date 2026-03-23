'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const FILES = {
  businesses:    path.join(DATA_DIR, 'businesses.json'),
  conversations: path.join(DATA_DIR, 'conversations.json'),
  leads:         path.join(DATA_DIR, 'leads.json'),
  analytics:     path.join(DATA_DIR, 'analytics.json'),
};

/* ─── HELPERS ───────────────────────────────────────────────────────────── */

function readObj(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; }
}

function readArr(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}

function writeFile(file, data) {
  fs.writeFileSync(file, JSON.stringify(data), 'utf8');
}

function now() { return Math.floor(Date.now() / 1000); }

/* ─── INIT ──────────────────────────────────────────────────────────────── */

function init() {
  if (!fs.existsSync(FILES.businesses))    writeFile(FILES.businesses,    {});
  if (!fs.existsSync(FILES.conversations)) writeFile(FILES.conversations, {});
  if (!fs.existsSync(FILES.leads))         writeFile(FILES.leads,         []);
  if (!fs.existsSync(FILES.analytics))     writeFile(FILES.analytics,     {});
}

/* ─── BUSINESSES ────────────────────────────────────────────────────────── */

function getBusiness(id) {
  const store = readObj(FILES.businesses);
  if (!store[id]) return null;
  return { id, ...store[id] };
}

function saveBusiness(id, obj) {
  const store = readObj(FILES.businesses);
  const { id: _omit, ...rest } = obj;
  const existing = store[id] || {};
  store[id] = {
    ...existing,
    ...rest,
    created_at: existing.created_at || now(),
    updated_at: now(),
  };
  writeFile(FILES.businesses, store);
}

function deleteBusiness(id) {
  const store = readObj(FILES.businesses);
  delete store[id];
  writeFile(FILES.businesses, store);
}

function getAllBusinesses() {
  const store = readObj(FILES.businesses);
  return Object.entries(store)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
}

/* ─── CONVERSATIONS ─────────────────────────────────────────────────────── */

function getConversation(sessionId) {
  const store = readObj(FILES.conversations);
  return store[sessionId] || null;
}

function saveConversation(sessionId, businessId, messages) {
  const store = readObj(FILES.conversations);
  const existing = store[sessionId] || {};
  store[sessionId] = {
    session_id:  sessionId,
    business_id: businessId,
    messages,
    last_ts:     now(),
    msg_count:   messages.length,
    created_at:  existing.created_at || now(),
  };
  writeFile(FILES.conversations, store);
}

function getAllConversationSummaries() {
  const store = readObj(FILES.conversations);
  return Object.values(store)
    .map(c => {
      const msgs = c.messages || [];
      const last = msgs[msgs.length - 1];
      return {
        sessionId:   c.session_id,
        businessId:  c.business_id,
        lastMessage: last ? last.content || '' : '',
        lastTs:      c.last_ts,
        msgCount:    c.msg_count,
      };
    })
    .sort((a, b) => b.lastTs - a.lastTs);
}

function pruneOldConversations() {
  const cutoff = now() - 30 * 24 * 60 * 60;
  const store  = readObj(FILES.conversations);
  let deleted  = 0;
  for (const sid of Object.keys(store)) {
    if (store[sid].last_ts < cutoff) { delete store[sid]; deleted++; }
  }
  if (deleted > 0) {
    writeFile(FILES.conversations, store);
    console.log(`[prune] ${deleted} eski konuşma silindi.`);
  }
}

/* ─── LEADS ─────────────────────────────────────────────────────────────── */

function saveLead(businessId, sessionId, message) {
  const leads = readArr(FILES.leads);
  leads.unshift({
    id:         Date.now(),
    businessId,
    sessionId,
    message,
    timestamp:  now(),
  });
  writeFile(FILES.leads, leads.slice(0, 500));
}

function getAllLeads() {
  return readArr(FILES.leads).slice(0, 500);
}

/* ─── ANALYTICS ─────────────────────────────────────────────────────────── */

function trackMessage(businessId, isNewSession) {
  const store = readObj(FILES.analytics);
  if (!store[businessId]) store[businessId] = { messageCount: 0, sessionCount: 0 };
  store[businessId].messageCount++;
  if (isNewSession) store[businessId].sessionCount++;
  writeFile(FILES.analytics, store);
}

function getAnalytics() {
  const store = readObj(FILES.analytics);
  return Object.entries(store)
    .map(([businessId, stats]) => ({ businessId, ...stats }))
    .sort((a, b) => b.messageCount - a.messageCount);
}

/* ─── EXPORTS ────────────────────────────────────────────────────────────── */

module.exports = {
  init,
  getBusiness, saveBusiness, deleteBusiness, getAllBusinesses,
  getConversation, saveConversation, getAllConversationSummaries, pruneOldConversations,
  saveLead, getAllLeads,
  trackMessage, getAnalytics,
};
