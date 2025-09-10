const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const STORE_PATH = path.join(__dirname, 'published.json');

app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

async function fetchHTML(url) {
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' },
    redirect: 'follow',
    timeout: 10000
  });
  if (!resp.ok) throw new Error('Erro ao buscar a URL');
  return await resp.text();
}

function parseMeta(html, url) {
  const $ = cheerio.load(html);
  const title = $('meta[property="og:title"]').attr('content') || $('title').text() || null;
  const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || null;
  const image = $('meta[property="og:image"]').attr('content') || $('img').first().attr('src') || null;
  return { title, description, image, url };
}

app.post('/api/fetch', async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Falta a URL' });
  try {
    const html = await fetchHTML(url);
    const meta = parseMeta(html, url);
    if (meta.image && meta.image.startsWith('/')) {
      const u = new URL(url);
      meta.image = u.origin + meta.image;
    }
    res.json({ ok: true, meta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/publish', (req, res) => {
  const product = req.body;
  if (!product || !product.url) return res.status(400).json({ error: 'Produto inválido' });
  let items = [];
  try {
    if (fs.existsSync(STORE_PATH)) {
      items = JSON.parse(fs.readFileSync(STORE_PATH));
    }
  } catch (e) { items = []; }
  product.id = Date.now();
  items.unshift(product);
  fs.writeFileSync(STORE_PATH, JSON.stringify(items, null, 2));
  res.json({ ok: true, product });
});

app.get('/api/published', (req, res) => {
  let items = [];
  try { items = JSON.parse(fs.readFileSync(STORE_PATH)); } catch(e) { items = []; }
  res.json({ ok: true, items });
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));