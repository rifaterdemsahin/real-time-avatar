const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const KEY = process.env.MIMO_API_KEY;
const LA_KEY = process.env.LIVEAVATAR_API_KEY;
const LA = 'https://api.liveavatar.com';
const BASE = process.env.XIAOMI_BASE_URL || 'https://api.xiaomimimo.com/v1';

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

const CHAT_SYS = `You are a warm, emotionally intelligent companion in a live voice conversation. First work out what the user feels from what they said, then reply with empathy in 1-3 short spoken sentences. Reply with JSON only: {"user_emotion":"<happy|sad|angry|surprised|fear|neutral>","reply_emotion":"<same set; the expression you should show>","reply":"<spoken reply>"}`;
const EMOS = Object.keys(STYLES);
const history = [];

async function converse(text) {
  history.push({ role: 'user', content: text });
  const r = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'mimo-v2.6-flash', messages: [{ role: 'system', content: CHAT_SYS }, ...history.slice(-12)] }),
  });
  if (!r.ok) throw new Error(`MiMo chat ${r.status}: ${await r.text()}`);
  const raw = (await r.json()).choices?.[0]?.message?.content || '';
  let j;
  try { j = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]); } catch { j = { user_emotion: 'neutral', reply_emotion: 'neutral', reply: raw.trim() || "I'm here, tell me more." }; }
  if (!EMOS.includes(j.reply_emotion)) j.reply_emotion = 'neutral';
  if (!EMOS.includes(j.user_emotion)) j.user_emotion = 'neutral';
  history.push({ role: 'assistant', content: j.reply });
  return j;
}

async function la(pathname, opts) {
  if (!LA_KEY) throw new Error('LIVEAVATAR_API_KEY is not set on the server');
  const r = await fetch(LA + pathname, opts);
  const t = await r.text();
  if (!r.ok) throw new Error(`LiveAvatar ${r.status}: ${t.slice(0, 300)}`);
  return JSON.parse(t);
}
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };

http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/liveavatar/')) {
    let body = '';
    for await (const c of req) body += c;
    try {
      const route = req.url.split('?')[0];
      if (route === '/api/liveavatar/avatars') {
        const d = await la('/v1/avatars/public?page=1&page_size=50', { headers: { 'X-API-KEY': LA_KEY } });
        const L = d.data.results.map(a => ({ id: a.id, name: a.name }));
        L.sort((a, b) => (b.name === 'Wayne') - (a.name === 'Wayne')); // Wayne is the sandbox-supported avatar
        return json(res, 200, L);
      }
      if (route === '/api/liveavatar/start') {
        const { avatar_id, sandbox } = JSON.parse(body);
        const tok = await la('/v1/sessions/token', { method: 'POST', headers: { 'X-API-KEY': LA_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'FULL', avatar_id, is_sandbox: !!sandbox, avatar_persona: { language: 'en' } }) });
        const st = await la('/v1/sessions/start', { method: 'POST', headers: { Authorization: `Bearer ${tok.data.session_token}` } });
        const { session_id, livekit_url, livekit_client_token } = st.data;
        return json(res, 200, { session_id, livekit_url, livekit_client_token });
      }
      if (route === '/api/liveavatar/stop') {
        const { session_id } = JSON.parse(body);
        await la('/v1/sessions/stop', { method: 'POST', headers: { 'X-API-KEY': LA_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id, reason: 'USER_CLOSED' }) });
        return json(res, 200, { ok: true });
      }
      return json(res, 404, { error: 'unknown route' });
    } catch (e) { return json(res, 500, { error: e.message }); }
  }
  if (req.method === 'POST' && req.url === '/api/converse') {
    let body = '';
    for await (const c of req) body += c;
    try {
      const { text, textOnly } = JSON.parse(body);
      if (!text || text.length > 600) throw new Error('text required (max 600 chars)');
      const j = await converse(text);
      if (textOnly) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(j)); }
      const wav = await tts(j.reply_emotion, j.reply);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ...j, audio: wav.toString('base64') }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
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
  const rel = req.url === '/' ? 'index.html' : req.url.split('?')[0].replace(/^\/+/, '');
  const p = path.join(__dirname, 'public', path.normalize(rel).replace(/^(\.\.[\/\\])+/, ''));
  const file = p;
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': file.endsWith('.html') ? 'text/html' : file.endsWith('.jpg') ? 'image/jpeg' : 'text/plain' });
    res.end(data);
  });
}).listen(PORT, () => console.log('listening', PORT));
