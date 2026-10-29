const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const KEY = process.env.MIMO_API_KEY;
const BASE = process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1';

const STYLES = {
  happy: 'Speak happily, bright and cheerful.',
  sad: 'Speak sadly, slow and soft.',
  angry: 'Speak angrily, sharp and forceful.',
  surprised: 'Speak with surprise, breathless and high-pitched.',
  fear: 'Speak fearfully, trembling and hushed.',
  neutral: 'Speak in a calm, natural tone.',
};

async function tts(emotion, text) {
  const style = STYLES[emotion] || STYLES.neutral;
  const r = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mimo-v2.5-tts',
      messages: [{ role: 'user', content: style }, { role: 'assistant', content: text }],
      audio: { format: 'wav' },
    }),
  });
  if (!r.ok) throw new Error(`MiMo ${r.status}: ${await r.text()}`);
  const d = await r.json();
  const b64 = d.choices?.[0]?.message?.audio?.data;
  if (!b64) throw new Error('No audio in MiMo response');
  return Buffer.from(b64, 'base64');
}

http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/speak') {
    let body = '';
    for await (const c of req) body += c;
    try {
      const { emotion, text } = JSON.parse(body);
      if (!text || text.length > 600) throw new Error('text required (max 600 chars)');
      const wav = await tts(emotion, text);
      res.writeHead(200, { 'Content-Type': 'audio/wav' });
      res.end(wav);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  const file = req.url === '/' ? 'index.html' : path.basename(req.url.split('?')[0]);
  const p = path.join(__dirname, 'public', file);
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': file.endsWith('.html') ? 'text/html' : 'text/plain' });
    res.end(data);
  });
}).listen(PORT, () => console.log('listening', PORT));
