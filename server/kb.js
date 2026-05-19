'use strict';
/* NexaBot Knowledge Base - PDF/URL/Text upload + retrieval with metadata */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kb_sources (
      id           BIGSERIAL PRIMARY KEY,
      business_id  TEXT NOT NULL,
      source_type  TEXT NOT NULL,
      source_name  TEXT NOT NULL,
      char_count   INT NOT NULL DEFAULT 0,
      chunk_count  INT NOT NULL DEFAULT 0,
      created_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    );
    CREATE INDEX IF NOT EXISTS idx_kb_sources_biz ON kb_sources(business_id);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kb_chunks (
      id           BIGSERIAL PRIMARY KEY,
      source_id    BIGINT NOT NULL REFERENCES kb_sources(id) ON DELETE CASCADE,
      business_id  TEXT NOT NULL,
      position     INT NOT NULL,
      chunk_text   TEXT NOT NULL,
      tsv          TSVECTOR
    );
    CREATE INDEX IF NOT EXISTS idx_kb_chunks_biz ON kb_chunks(business_id);
    CREATE INDEX IF NOT EXISTS idx_kb_chunks_tsv ON kb_chunks USING GIN(tsv);
  `);
  console.log('KB tables ready');
}

function chunkText(text, maxLen = 600) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  let current = '';
  for (const s of sentences) {
    if ((current + ' ' + s).length > maxLen && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += (current ? ' ' : '') + s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function addSource(businessId, sourceType, sourceName, fullText) {
  const chunks = chunkText(fullText);
  if (!chunks.length) return null;
  const src = await pool.query(
    `INSERT INTO kb_sources (business_id, source_type, source_name, char_count, chunk_count)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [businessId, sourceType, sourceName, fullText.length, chunks.length]
  );
  const sourceId = src.rows[0].id;
  for (let i = 0; i < chunks.length; i++) {
    await pool.query(
      `INSERT INTO kb_chunks (source_id, business_id, position, chunk_text, tsv)
       VALUES ($1, $2, $3, $4, to_tsvector('simple', $4))`,
      [sourceId, businessId, i, chunks[i]]
    );
  }
  return { sourceId, chunkCount: chunks.length };
}

async function listSources(businessId) {
  const r = await pool.query(
    `SELECT id, source_type, source_name, char_count, chunk_count, created_at
     FROM kb_sources WHERE business_id = $1 ORDER BY created_at DESC`,
    [businessId]
  );
  return r.rows;
}

async function deleteSource(sourceId, businessId) {
  await pool.query('DELETE FROM kb_sources WHERE id = $1 AND business_id = $2', [sourceId, businessId]);
}

// Returns [{ chunk_text, source_name, source_type }]
async function search(businessId, query, limit = 5) {
  if (!query || !query.trim()) return [];
  const r = await pool.query(
    `SELECT c.chunk_text, s.source_name, s.source_type,
            ts_rank(c.tsv, plainto_tsquery('simple', $2)) AS rank
     FROM kb_chunks c
     JOIN kb_sources s ON s.id = c.source_id
     WHERE c.business_id = $1 AND c.tsv @@ plainto_tsquery('simple', $2)
     ORDER BY rank DESC LIMIT $3`,
    [businessId, query, limit]
  );
  if (r.rows.length) return r.rows.map(x => ({ chunk_text: x.chunk_text, source_name: x.source_name, source_type: x.source_type }));
  const fb = await pool.query(
    `SELECT c.chunk_text, s.source_name, s.source_type
     FROM kb_chunks c JOIN kb_sources s ON s.id = c.source_id
     WHERE c.business_id = $1 ORDER BY c.position LIMIT $2`,
    [businessId, limit]
  );
  return fb.rows.map(x => ({ chunk_text: x.chunk_text, source_name: x.source_name, source_type: x.source_type }));
}

async function totalCharsForBusiness(businessId) {
  const r = await pool.query(
    `SELECT COALESCE(SUM(char_count), 0) AS total FROM kb_sources WHERE business_id = $1`,
    [businessId]
  );
  return parseInt(r.rows[0].total, 10);
}

// Returns [{ chunk_text, source_name, source_type }]
async function getAllChunks(businessId) {
  const r = await pool.query(
    `SELECT c.chunk_text, s.source_name, s.source_type
     FROM kb_chunks c JOIN kb_sources s ON s.id = c.source_id
     WHERE c.business_id = $1 ORDER BY c.source_id, c.position`,
    [businessId]
  );
  return r.rows.map(x => ({ chunk_text: x.chunk_text, source_name: x.source_name, source_type: x.source_type }));
}

async function countChunks(businessId) {
  const r = await pool.query('SELECT COUNT(*) AS c FROM kb_chunks WHERE business_id = $1', [businessId]);
  return parseInt(r.rows[0].c, 10);
}

module.exports = { init, addSource, listSources, deleteSource, search, totalCharsForBusiness, getAllChunks, countChunks };
