const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/download', async (req, res) => {
  const mediaUrl = req.query.url;
  const quality = req.query.quality || 'auto';

  if (!mediaUrl) return res.status(400).json({ error: 'URL required' });

  const { RAPIDAPI_KEY, RAPIDAPI_HOST, RAPIDAPI_PATH } = process.env;
  if (!RAPIDAPI_KEY || !RAPIDAPI_HOST || !RAPIDAPI_PATH) {
    console.error('Missing RAPIDAPI env vars');
    return res.status(500).json({ error: 'Server misconfigured. Admin must set RAPIDAPI env vars.' });
  }

  try {
    const options = {
      method: 'GET',
      url: `https://${RAPIDAPI_HOST}${RAPIDAPI_PATH}`,
      params: { url: mediaUrl, quality },
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      },
      timeout: 15000
    };

    const response = await axios.request(options);

    const data = response.data || {};
    const mediaUrlResult = data.url || data.result || data.media || (data.data && data.data.url);

    if (!mediaUrlResult) {
      console.warn('Unexpected downloader response:', data);
      return res.status(502).json({ error: 'Failed to parse downloader response' });
    }

    return res.json({ url: mediaUrlResult, raw: data });
  } catch (error) {
    console.error('Download error:', error && (error.message || error.toString()));
    return res.status(500).json({ error: 'Failed to fetch media' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname,

