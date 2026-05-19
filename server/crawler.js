'use strict';
/* NexaBot Website Crawler - BFS same-origin with sitemap.xml support */
const cheerio = require('cheerio');

const UA = 'NexaBot Crawler/1.0';
const TIMEOUT_MS = 15000;

async function fetchWithTimeout(url, opts = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { ...opts, signal: ctl.signal, headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
    return r;
  } finally { clearTimeout(t); }
}

function sameOrigin(a, b) {
  try { return new URL(a).origin === new URL(b).origin; } catch { return false; }
}

function normalizeUrl(u) {
  try {
    const x = new URL(u);
    x.hash = '';
    // strip common tracking params
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','fbclid','gclid'].forEach(p => x.searchParams.delete(p));
    return x.toString();
  } catch { return null; }
}

async function tryFetchSitemap(origin) {
  const candidates = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml'];
  for (const path of candidates) {
    try {
      const r = await fetchWithTimeout(origin + path);
      if (!r.ok) continue;
      const xml = await r.text();
      const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
      if (urls.length) return urls;
    } catch {}
  }
  return null;
}

async function getRobotsDisallow(origin) {
  try {
    const r = await fetchWithTimeout(origin + '/robots.txt');
    if (!r.ok) return [];
    const txt = await r.text();
    const disallow = [];
    let universal = false;
    for (const line of txt.split('\n')) {
      const t = line.trim();
      if (/^user-agent:\s*\*/i.test(t)) universal = true;
      else if (/^user-agent:/i.test(t)) universal = false;
      else if (universal && /^disallow:/i.test(t)) {
        const p = t.replace(/^disallow:/i, '').trim();
        if (p) disallow.push(p);
      }
    }
    return disallow;
  } catch { return []; }
}

function isDisallowed(url, disallow) {
  try {
    const path = new URL(url).pathname;
    return disallow.some(d => path.startsWith(d));
  } catch { return false; }
}

function extractText($) {
  $('script,style,noscript,iframe,svg,nav,footer,header,form').remove();
  const title = ($('title').first().text() || '').trim();
  const body = $('body').text().replace(/\s+/g, ' ').trim();
  return { title, text: body };
}

function extractLinks($, baseUrl) {
  const links = new Set();
  $('a[href]').each((_, a) => {
    const href = $(a).attr('href');
    if (!href) return;
    try {
      const abs = new URL(href, baseUrl).toString();
      const n = normalizeUrl(abs);
      if (n) links.add(n);
    } catch {}
  });
  return [...links];
}

/**
 * Crawl a site BFS, return [{ url, title, text }].
 * Stops at maxPages. Same-origin only. Respects robots.txt for common disallow rules.
 */
async function crawlSite(startUrl, opts = {}) {
  const maxPages = Math.min(Math.max(parseInt(opts.maxPages) || 25, 1), 100);
  const start = normalizeUrl(startUrl);
  if (!start) throw new Error('Invalid start URL');
  const origin = new URL(start).origin;

  const disallow = await getRobotsDisallow(origin);
  const sitemapUrls = await tryFetchSitemap(origin);

  const queue = [];
  const visited = new Set();
  const results = [];

  if (sitemapUrls && sitemapUrls.length) {
    for (const u of sitemapUrls) {
      const n = normalizeUrl(u);
      if (n && sameOrigin(n, start) && !isDisallowed(n, disallow)) queue.push(n);
    }
  }
  if (!queue.length) queue.push(start);

  while (queue.length && results.length < maxPages) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const r = await fetchWithTimeout(url);
      if (!r.ok) continue;
      const ct = (r.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('text/html')) continue;
      const html = await r.text();
      if (html.length > 2_000_000) continue;
      const $ = cheerio.load(html);
      const { title, text } = extractText($);
      if (text.length >= 100) results.push({ url, title, text });

      if (!sitemapUrls) {
        const links = extractLinks($, url);
        for (const link of links) {
          if (visited.has(link) || queue.includes(link)) continue;
          if (!sameOrigin(link, start)) continue;
          if (isDisallowed(link, disallow)) continue;
          // skip common asset paths
          if (/\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|mp3|css|js|ico|woff|ttf)(\?|$)/i.test(link)) continue;
          queue.push(link);
        }
      }
    } catch (e) { /* skip individual page failures */ }
  }

  return results;
}

module.exports = { crawlSite };
