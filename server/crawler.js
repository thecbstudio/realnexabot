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

function extractLinks(html, baseUrl) {
  const links = new Set();
  try {
    const $ = cheerio.load(html);
    $('a[href]').each((_, a) => {
      const href = $(a).attr('href');
      if (!href) return;
      try {
        const abs = new URL(href, baseUrl).toString();
        const n = normalizeUrl(abs);
        if (n) links.add(n);
      } catch {}
    });
  } catch {}
  return [...links];
}

/* Fetch page text via Jina Reader (handles SPA/JS-rendered pages) */
async function fetchWithJina(url) {
  const r = await fetch('https://r.jina.ai/' + url, {
    headers: { 'User-Agent': UA, 'Accept': 'text/plain' },
    signal: AbortSignal.timeout(25000)
  });
  if (!r.ok) throw new Error('Jina ' + r.status);
  const text = (await r.text()).replace(/\s+/g, ' ').trim();
  return text;
}

/* Fallback: plain cheerio extraction for simple HTML */
function extractTextCheerio(html) {
  const $ = cheerio.load(html);
  $('script,style,noscript,iframe,svg,nav,footer,header,form').remove();
  const title = $('title').first().text().trim();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return { title, text };
}

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
      /* Fetch raw HTML first to extract links (needed for BFS) */
      const r = await fetchWithTimeout(url);
      if (!r.ok) continue;
      const ct = (r.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('text/html')) continue;
      const html = await r.text();
      if (html.length > 2_000_000) continue;

      /* Extract links for BFS before Jina call */
      if (!sitemapUrls) {
        for (const link of extractLinks(html, url)) {
          if (visited.has(link) || queue.includes(link)) continue;
          if (!sameOrigin(link, start)) continue;
          if (isDisallowed(link, disallow)) continue;
          if (/\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|mp3|css|js|ico|woff|ttf)(\?|$)/i.test(link)) continue;
          queue.push(link);
        }
      }

      /* Get page text via Jina (works for both normal and SPA sites) */
      let title = '';
      let text = '';
      try {
        text = await fetchWithJina(url);
        const titleMatch = text.match(/^Title:\s*(.+)/m);
        if (titleMatch) title = titleMatch[1].trim();
      } catch {
        /* Jina failed, fall back to cheerio */
        const extracted = extractTextCheerio(html);
        title = extracted.title;
        text = extracted.text;
      }

      if (text.length >= 30) results.push({ url, title, text });
    } catch { /* skip individual page failures */ }
  }

  return results;
}

module.exports = { crawlSite };
