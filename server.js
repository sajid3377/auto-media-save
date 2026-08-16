require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory cache with TTL
// Keyed by request URL + options JSON
const cache = new Map();
const DEFAULT_TTL_MS = 1000 * 60 * 5; // 5 minutes

function setCache(key, value, ttl = DEFAULT_TTL_MS) {
  const expires = Date.now() + ttl;
  cache.set(key, { value, expires });
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

// Periodic cleanup to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of cache.entries()) {
    if (v.expires <= now) cache.delete(k);
  }
}, 1000 * 60); // every 60s

// Helper: normalize provider response to link objects
function extractLinksFromProvider(data) {
  const links = [];
  if (!data) return links;

  if (data.mediaLinks) {
    const ml = data.mediaLinks;
    if (ml.videoNoWatermark) links.push({ label: 'Video (No Watermark)', url: ml.videoNoWatermark });
    if (ml.video) links.push({ label: 'Video', url: ml.video });
    if (ml.audio) links.push({ label: 'Audio (MP3)', url: ml.audio });
  }

  if (data.videoNoWatermark) links.push({ label: 'Video (No Watermark)', url: data.videoNoWatermark });
  if (data.videoUrl) links.push({ label: 'Video', url: data.videoUrl });
  if (data.video) links.push({ label: 'Video', url: data.video });
  if (data.audioUrl) links.push({ label: 'Audio (MP3)', url: data.audioUrl });
  if (data.audio) links.push({ label: 'Audio (MP3)', url: data.audio });

  if (Array.isArray(data.links)) {
    data.links.forEach(l => {
      if (typeof l === 'string') links.push({ label: 'Download', url: l });
      else if (l.url) links.push({ label: l.quality || l.label || 'Download', url: l.url });
    });
  }

  if (Array.isArray(data.result)) {
    data.result.forEach(l => {
      if (l && l.url) links.push({ label: l.quality || l.label || 'Download', url: l.url });
    });
  }

  // fallback: scan object for urls
  const urlRegex = /https?:\/\/[^\s'"<>{}]+/g;
  const jsonString = JSON.stringify(data);
  const found = jsonString.match(urlRegex) || [];
  found.forEach(u => links.push({ label: 'Link', url: u }));

  // unique by url
  const uniq = [];
  const seen = new Set();
  links.forEach(l => {
    if (l && l.url && !seen.has(l.url)) {
      uniq.push(l);
      seen.add(l.url);
    }
  });

  return uniq;
}

app.post('/api/download', async (req, res) => {
  const { url, type = 'video', noWatermark = true, hd = true } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing `url` in request body.' });

  const cacheKey = JSON.stringify({ url, type, noWatermark, hd });
  const cached = getCache(cacheKey);
  if (cached) return res.json({ links: cached.links, meta: cached.meta, cached: true });

  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'allmedia-downloader.p.rapidapi.com';
  const RAPIDAPI_PATH = process.env.RAPIDAPI_PATH || '/universal';

  if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
    return res.status(500).json({ error: 'RAPIDAPI_KEY or RAPIDAPI_HOST not configured on server.' });
  }

  try {
    const apiUrl = `https://${RAPIDAPI_HOST}${RAPIDAPI_PATH}`;
    const params = { url, type, noWatermark: noWatermark ? 'true' : 'false', hd: hd ? 'true' : 'false' };

    const response = await axios.get(apiUrl, {
      params,
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        Accept: 'application/json'
      },
      timeout: 30000
    });

    const data = response.data;
    const links = extractLinksFromProvider(data);

    if (!links.length) {
      // cache raw response for short time so we don't hammer provider on repeated requests
      setCache(cacheKey, { links: [], meta: data }, 1000 * 20); // 20s
      return res.json({ raw: data });
    }

    const meta = data.meta || data.metadata || null;
    setCache(cacheKey, { links, meta });
    return res.json({ links, meta });
  } catch (err) {
    console.error('Download API error', err?.response?.data || err.message);
    const status = err?.response?.status || 502;
    const message = err?.response?.data || { error: 'Failed to fetch from RapidAPI provider' };
    res.status(status).json(message);
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app;

