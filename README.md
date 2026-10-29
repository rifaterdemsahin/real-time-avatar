# 🎭 real-time-avatar

An emotion-driven talking avatar you can type to or talk to. 🗣️ It listens, works out how you feel, answers with empathy, and shows the emotion on its face.

🌐 **Live app:** https://avatar-xiaomimimo.fly.dev/

## ✨ What it does
- ⌨️ **Command box:** type `happy Hello there!` (emotions: happy, sad, angry, surprised, fear, neutral). The face changes instantly, then the voice follows.
- 🎤 **Mic loop:** Chrome transcribes your speech → MiMo reads your emotion and writes an empathetic reply → MiMo TTS speaks it → the avatar mirrors then answers with an expression.
- 👄 **Lip movement:** the mouth follows the loudness of the audio.
- 🖼️ **Realistic faces:** drop `neutral.jpg`, `happy.jpg`, `sad.jpg`, `angry.jpg`, `surprised.jpg`, `fear.jpg` and `speaking.jpg` into `public/faces/` and the page uses them instead of the drawn face.
- 🧪 **HeyGen LiveAvatar PoC:** a real-time streamed avatar in sandbox mode (one avatar, Wayne) at `/liveavatar.html`.

## 🗺️ Pages
| Page | What is on it |
|---|---|
| 🎭 `/` | Avatar, command box and mic |
| ⚡ `/realtime.html` | Can H3 Max lip-sync run live? (no) and the realistic options |
| 💬 `/heygen.html` | HeyGen LiveAvatar overview |
| 💰 `/heygen-api.html` | API video, break-even table, calculator and XY chart |
| 🧪 `/liveavatar.html` | Sandbox proof of concept |
| 📚 `/references.html` | Every tool and doc used |

## 🧱 Stack
- 🟢 Node server with no dependencies (`server.js`) and static pages in `public/`
- 🐼 Xiaomi MiMo: `mimo-v2.5-tts` for voice, `mimo-v2.6-flash` for understanding and replies
- 🧑‍🎤 HeyGen LiveAvatar API, called through server-side proxy routes (`/api/liveavatar/*`)
- 🛫 Fly.io app `avatar-xiaomimimo`

## 🔌 API routes
- `POST /api/speak` `{emotion,text}` → WAV audio
- `POST /api/converse` `{text}` → `{user_emotion, reply_emotion, reply, audio}` (add `textOnly:true` to skip audio)
- `GET /api/liveavatar/avatars`, `POST /api/liveavatar/start`, `POST /api/liveavatar/stop`

## 🔐 Secrets
Never committed. Set them on Fly with `fly secrets set`:
| Secret | Purpose |
|---|---|
| `MIMO_API_KEY` | Xiaomi MiMo TTS and LLM |
| `LIVEAVATAR_API_KEY` | HeyGen LiveAvatar (a LiveAvatar key, not a main HeyGen key) |

Keys are also kept in Azure Key Vault `dp-kv-deliverypilot` (for example `live-avatar-key-actual-site`). Optional: `XIAOMI_BASE_URL` overrides the MiMo API URL.

## 🚀 Deploy
```bash
fly deploy -a avatar-xiaomimimo --remote-only
```

## 🏃 Run locally
```bash
MIMO_API_KEY=... LIVEAVATAR_API_KEY=... node server.js   # http://localhost:8080
```

## ⚠️ Known limits
- 🖼️ No realistic portraits yet: the fal.ai account needs credit (`TOP_UP`), Gemini image quota is exhausted, and the OpenRouter key is rejected.
- 🧪 LiveAvatar is sandbox only, with the one Wayne avatar. The browser video and speak flow is not yet confirmed end to end.
- 🌍 Speech recognition needs Chrome.
