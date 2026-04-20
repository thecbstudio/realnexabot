'use strict';

/*
  NexaBot — PostgreSQL Database Layer (Neon)
  Tables:
    businesses   (id TEXT PK, data JSONB, created_at BIGINT, updated_at BIGINT)
    conversations(session_id TEXT PK, business_id TEXT, messages JSONB, last_ts BIGINT, msg_count INT, created_at BIGINT)
    leads        (id BIGSERIAL PK, business_id TEXT, session_id TEXT, message TEXT, timestamp BIGINT)
    analytics    (business_id TEXT PK, message_count INT, session_count INT)
*/

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/* ─── INIT ────────────────────────────────────────────────────────────────── */
async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS businesses (
      id          TEXT PRIMARY KEY,
      data        JSONB NOT NULL DEFAULT '{}',
      created_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
      updated_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      session_id   TEXT PRIMARY KEY,
      business_id  TEXT NOT NULL DEFAULT '',
      messages     JSONB NOT NULL DEFAULT '[]',
      last_ts      BIGINT NOT NULL DEFAULT 0,
      msg_count    INT NOT NULL DEFAULT 0,
      created_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    );
    CREATE INDEX IF NOT EXISTS idx_conv_business ON conversations(business_id);
    CREATE INDEX IF NOT EXISTS idx_conv_last_ts  ON conversations(last_ts DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id           BIGSERIAL PRIMARY KEY,
      business_id  TEXT NOT NULL DEFAULT '',
      session_id   TEXT NOT NULL DEFAULT '',
      message      TEXT NOT NULL DEFAULT '',
      timestamp    BIGINT NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_leads_ts ON leads(timestamp DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS analytics (
      business_id    TEXT PRIMARY KEY,
      message_count  INT NOT NULL DEFAULT 0,
      session_count  INT NOT NULL DEFAULT 0
    );
  `);

  console.log('✅ PostgreSQL connected (Neon)');
}

/* ─── BUSINESSES ──────────────────────────────────────────────────────────── */
function getBusiness(id) {
  return pool.query('SELECT id, data, created_at, updated_at FROM businesses WHERE id = $1', [id])
    .then(r => {
      if (!r.rows.length) return null;
      const row = r.rows[0];
      return { id: row.id, ...row.data, created_at: row.created_at, updated_at: row.updated_at };
    });
}

function saveBusiness(id, obj) {
  const now = Date.now();
  const { id: _omit, created_at, ...data } = obj;
  return pool.query(
    `INSERT INTO businesses (id, data, created_at, updated_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE
       SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
    [id, JSON.stringify(data), created_at || now, now]
  );
}

function deleteBusiness(id) {
  return pool.query('DELETE FROM businesses WHERE id = $1', [id]);
}

function getAllBusinesses() {
  return pool.query('SELECT id, data, created_at, updated_at FROM businesses ORDER BY created_at DESC')
    .then(r => r.rows.map(row => ({ id: row.id, ...row.data, created_at: row.created_at, updated_at: row.updated_at })));
}

/* ─── CONVERSATIONS ───────────────────────────────────────────────────────── */
function getConversation(sessionId) {
  return pool.query('SELECT * FROM conversations WHERE session_id = $1', [sessionId])
    .then(r => r.rows[0] || null);
}

function saveConversation(sessionId, businessId, messages) {
  const now = Date.now();
  const lastTs = now;
  const msgCount = messages.length;
  return pool.query(
    `INSERT INTO conversations (session_id, business_id, messages, last_ts, msg_count, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (session_id) DO UPDATE
       SET messages = EXCLUDED.messages, last_ts = EXCLUDED.last_ts, msg_count = EXCLUDED.msg_count`,
    [sessionId, businessId, JSON.stringify(messages), lastTs, msgCount, now]
  );
}

function getAllConversationSummaries() {
  return pool.query(
    `SELECT session_id, business_id, messages, last_ts, msg_count
     FROM conversations ORDER BY last_ts DESC LIMIT 500`
  ).then(r => r.rows.map(row => {
    const msgs = Array.isArray(row.messages) ? row.messages : [];
    const last = msgs[msgs.length - 1];
    return {
      sessionId:   row.session_id,
      businessId:  row.business_id,
      lastMessage: last ? last.content : '',
      lastTs:      row.last_ts,
      msgCount:    row.msg_count,
    };
  }));
}

function pruneOldConversations() {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return pool.query('DELETE FROM conversations WHERE last_ts < $1', [cutoff])
    .then(r => { if (r.rowCount > 0) console.log(`[db] Pruned ${r.rowCount} old conversations`); });
}

/* ─── LEADS ───────────────────────────────────────────────────────────────── */
function saveLead(businessId, sessionId, message) {
  const ts = Date.now();
  return pool.query(
    `INSERT INTO leads (business_id, session_id, message, timestamp) VALUES ($1, $2, $3, $4)`,
    [businessId, sessionId, message, ts]
  ).then(() => pool.query(
    `DELETE FROM leads WHERE id IN (
       SELECT id FROM leads ORDER BY timestamp DESC OFFSET 500
     )`
  ));
}

function getAllLeads() {
  return pool.query('SELECT * FROM leads ORDER BY timestamp DESC LIMIT 500')
    .then(r => r.rows);
}

/* ─── ANALYTICS ───────────────────────────────────────────────────────────── */
function trackMessage(businessId, isNewSession) {
  return pool.query(
    `INSERT INTO analytics (business_id, message_count, session_count)
     VALUES ($1, 1, $2)
     ON CONFLICT (business_id) DO UPDATE
       SET message_count = analytics.message_count + 1,
           session_count = analytics.session_count + EXCLUDED.session_count`,
    [businessId, isNewSession ? 1 : 0]
  );
}

function getAnalytics() {
  return pool.query('SELECT business_id AS "businessId", message_count AS "messageCount", session_count AS "sessionCount" FROM analytics ORDER BY message_count DESC')
    .then(r => r.rows);
}

module.exports = { init, getBusiness, saveBusiness, deleteBusiness, getAllBusinesses, getConversation, saveConversation, getAllConversationSummaries, pruneOldConversations, saveLead, getAllLeads, trackMessage, getAnalytics };
