'use strict';
// One-time migration: JSON files → Neon PostgreSQL
// Run: node scripts/migrate-to-postgres.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function readJson(file) {
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) { console.log(`[skip] ${file} not found`); return null; }
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); }
  catch(e) { console.error(`[error] reading ${file}:`, e.message); return null; }
}

async function run() {
  // Create tables
  await pool.query(`CREATE TABLE IF NOT EXISTS businesses (id TEXT PRIMARY KEY, data JSONB NOT NULL DEFAULT '{}', created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT, updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS conversations (session_id TEXT PRIMARY KEY, business_id TEXT NOT NULL DEFAULT '', messages JSONB NOT NULL DEFAULT '[]', last_ts BIGINT NOT NULL DEFAULT 0, msg_count INT NOT NULL DEFAULT 0, created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS leads (id BIGSERIAL PRIMARY KEY, business_id TEXT NOT NULL DEFAULT '', session_id TEXT NOT NULL DEFAULT '', message TEXT NOT NULL DEFAULT '', timestamp BIGINT NOT NULL DEFAULT 0)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS analytics (business_id TEXT PRIMARY KEY, message_count INT NOT NULL DEFAULT 0, session_count INT NOT NULL DEFAULT 0)`);

  // Businesses
  const biz = readJson('businesses.json');
  if (biz) {
    let cnt = 0;
    for (const [id, obj] of Object.entries(biz)) {
      const { id: _omit, created_at, updated_at, ...data } = obj;
      const now = Date.now();
      await pool.query(
        `INSERT INTO businesses (id, data, created_at, updated_at) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
        [id, JSON.stringify(data), created_at || now, updated_at || now]
      );
      cnt++;
    }
    console.log(`✅ businesses: ${cnt} records migrated`);
  }

  // Conversations
  const convs = readJson('conversations.json');
  if (convs) {
    let cnt = 0;
    for (const [sessionId, obj] of Object.entries(convs)) {
      await pool.query(
        `INSERT INTO conversations (session_id, business_id, messages, last_ts, msg_count, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (session_id) DO NOTHING`,
        [sessionId, obj.businessId || '', JSON.stringify(obj.messages || []), obj.lastTs || 0, (obj.messages || []).length, obj.createdAt || Date.now()]
      );
      cnt++;
    }
    console.log(`✅ conversations: ${cnt} records migrated`);
  }

  // Leads
  const leads = readJson('leads.json');
  if (leads && Array.isArray(leads)) {
    let cnt = 0;
    for (const lead of leads) {
      await pool.query(
        `INSERT INTO leads (business_id, session_id, message, timestamp) VALUES ($1,$2,$3,$4)`,
        [lead.businessId || '', lead.sessionId || '', lead.message || '', lead.timestamp || 0]
      );
      cnt++;
    }
    console.log(`✅ leads: ${cnt} records migrated`);
  }

  // Analytics
  const analytics = readJson('analytics.json');
  if (analytics) {
    let cnt = 0;
    for (const [bizId, obj] of Object.entries(analytics)) {
      await pool.query(
        `INSERT INTO analytics (business_id, message_count, session_count) VALUES ($1,$2,$3) ON CONFLICT (business_id) DO NOTHING`,
        [bizId, obj.messageCount || 0, obj.sessionCount || 0]
      );
      cnt++;
    }
    console.log(`✅ analytics: ${cnt} records migrated`);
  }

  await pool.end();
  console.log('\n🎉 Migration complete!');
}

run().catch(err => { console.error('Migration failed:', err); process.exit(1); });
