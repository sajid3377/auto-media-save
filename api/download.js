const axios = require('axios');

// Vercel serverless handler: accepts GET /api/download?url=<mediaUrl>&quality=<quality>
module.exports = async (req, res) => {
  try {
    const mediaUrl = (req.query && req.query.url) || (req.body && req.body.url);
    const quality = (req.query && req.query.quality) || (req.body && req.body.quality) || 'auto';

    if (!mediaUrl) {
      return res.status(400).json({ error: 'URL required' });
    }

    const { RAPIDAPI_KEY, RAPIDAPI_HOST, RAPIDAPI_PATH } = process.env;
    if (!RAPIDAPI_KEY || !RAPIDAPI_HOST || !RAPIDAPI_PATH) {
      console.error('Missing RAPIDAPI env vars');
      return res.status(500).json({ error: 'Server misconfigured. Admin must set RAPIDAPI env vars.' });
    }

    const options = {
      method: 'GET',
      url: `https://${RAPIDAPI_HOST}${RAPIDAPI_PATH}`,
      params: { url: mediaUrl, quality },
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      },
      timeout: 20000,
      // follow redirects by default in axios
    };

    const response = await axios.request(options);
    const data = response && response.data ? response.data : {};

    // Normalize common shapes returned by downloader APIs
    let mediaUrlResult = null;

    // Common direct keys
    if (typeof data === 'string') {
      mediaUrlResult = data;
    } else if (data.url) {
      mediaUrlResult = data.url;
    } else if (data.result) {
      mediaUrlResult = data.result;
    } else if (data.media) {
      mediaUrlResult = data.media;
    }

    // If API returns an array of files with quality labels
    if (!mediaUrlResult && Array.isArray(data.files) && data.files.length) {
      // prefer requested quality if matching, else pick the first
      const match = data.files.find(f => String(f.quality) === String(quality) || (f.quality && String(quality).includes(String(f.quality))));
      mediaUrlResult = (match && (match.url || match.src || match.file)) || (data.files[0].url || data.files[0].src || data.files[0].file);
    }

    // Nested shapes
    if (!mediaUrlResult && data.data) {
      if (typeof data.data === 'string') mediaUrlResult = data.data;
      else if (data.data.url) mediaUrlResult = data.data.url;
      else if (Array.isArray(data.data.files) && data.data.files.length) {
        mediaUrlResult = data.data.files[0].url;
      }
    }

    // Fallback: if upstream returned multiple candidates try to find a direct link
    if (!mediaUrlResult) {
      // search object recursively for first string that looks like a media url
      const findUrl = (obj) => {
        if (!obj) return null;
        if (typeof obj === 'string') {
          if (/https?:\/\/.+\.(mp4|webm|mkv|mov|jpg|jpeg|png)(\?|$)/i.test(obj)) return obj;
          if (/^https?:\/\//i.test(obj)) return obj;
          return null;
        }
        if (Array.isArray(obj)) {
          for (const item of obj) {
            const r = findUrl(item); if (r) return r;
          }
        } else if (typeof obj === 'object') {
          for (const k of Object.keys(obj)) {
            const r = findUrl(obj[k]); if (r) return r;
          }
        }
        return null;
      };

      mediaUrlResult = findUrl(data);
    }

    if (!mediaUrlResult) {
      console.warn('Downloader returned unexpected shape:', data);
      return res.status(502).json({ error: 'Failed to parse downloader response', raw: data });
    }

    // Optional: set caching headers (short) for performance
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    return res.json({ url: mediaUrlResult, raw: data });
  } catch (err) {
    console.error('Download handler error:', err && (err.stack || err.message || err));
    // surface upstream response when available
    if (err && err.response && err.response.data) {
      return res.status(502).json({ error: 'Upstream error', details: err.response.data });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};
