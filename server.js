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

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Helper: normalize provider response to link objects
function extractLinksFromProvider(data) {
  // Try several common shapes returned by downloader providers
  const links = [];

  // common keys
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

  // some providers return an array 'links' or 'result'
  if (Array.isArray(data.links)) {
    data.links.forEach(l => {
      if (typeof l === 'string') links.push({ label: 'Download', url: l });
      else if (l.url) links.push({ label: l.quality || l.label || 'Download', url: l.url });
    });
  }

  if (Array.isArray(data.result)) {
    data.result.forEach(l => {
      if (l.url) links.push({ label: l.quality || l.label || 'Download', url: l.url });
    });
  }

  // fallback: scan object for urls
  const urlRegex = /https?:\\/\\/[^\s'"<>{}]+/g;
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

// API: POST /api/download
// Body: { url: string, type: 'video'|'audio', noWatermark: boolean, hd: boolean }
app.post('/api/download', async (req, res) => {
  const { url, type = 'video', noWatermark = true, hd = true } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing `url` in request body.' });

  // The RapidAPI host and endpoint
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'allmedia-downloader.p.rapidapi.com';
  const RAPIDAPI_PATH = process.env.RAPIDAPI_PATH || '/universal';

  if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
    return res.status(500).json({ error: 'RAPIDAPI_KEY or RAPIDAPI_HOST not configured on server.' });
  }

  try {
    // Many RapidAPI providers support a GET universal endpoint with ?url=...
    const apiUrl = `https://${RAPIDAPI_HOST}${RAPIDAPI_PATH}`;

    const params = {
      url,
      // send preferences, provider may ignore unsupported params
      type: type,
      noWatermark: noWatermark ? 'true' : 'false',
      hd: hd ? 'true' : 'false'
    };

    const response = await axios.get(apiUrl, {
      params,
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    const data = response.data;

    // Normalize to a list of links for the frontend
    const links = extractLinksFromProvider(data);

    // If no links found, return provider raw response for debugging
    if (!links.length) {
      return res.json({ raw: data });
    }

    return res.json({ links, meta: data.meta || data.metadata || null });
  } catch (err) {
    console.error('Download API error', err?.response?.data || err.message);
    const status = err?.response?.status || 502;
    const message = err?.response?.data || { error: 'Failed to fetch from RapidAPI provider' };
    res.status(status).json(message);
  }
});

// Fallback - serve index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
