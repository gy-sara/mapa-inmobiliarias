const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const N8N_ENDPOINT = 'https://app.garantiaya.com.ar/webhook/mapa-inmobiliarias';

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/datos', async (req, res) => {
  try {
    const response = await fetch(N8N_ENDPOINT);
    if (!response.ok) throw new Error(`n8n respondió ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
