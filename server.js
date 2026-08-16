const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/download', async (req, res) => {
  const mediaUrl = req.query.url;
  if (!mediaUrl) return res.status(400).json({ error: 'URL required' });

  try {
    const options = {
      method: 'GET',
      url: `https://${process.env.RAPIDAPI_HOST}${process.env.RAPIDAPI_PATH}`,
      params: { url: mediaUrl },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': process.env.RAPIDAPI_HOST
      }
    };

    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  
