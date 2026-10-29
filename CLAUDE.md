# real-time-avatar

Emotion-driven talking avatar. Node (no deps) server in `server.js`, static front end in `public/`, deployed to Fly.io as `avatar-xiaomimimo` (https://avatar-xiaomimimo.fly.dev/).

## Workflow
- **Always push**: after every commit, run `git push origin main`.
- Deploy with `fly deploy -a avatar-xiaomimimo --remote-only`.
- Open local previews in Google Chrome (`open -a "Google Chrome" <url>`).

## Architecture
- `POST /api/speak {emotion,text}` -> Xiaomi MiMo `mimo-v2.5-tts` (chat/completions, `audio.format=wav`) -> returns audio/wav. The emotion becomes a speaking-style instruction.
- Front end changes the face instantly on command, then lip-syncs the mouth to the audio via a WebAudio analyser.
- Planned: mic -> ASR (`mimo-v2.5-asr`) -> `mimo-v2.6-flash` for an empathetic reply + emotion -> TTS, with realistic per-emotion portraits in `public/faces/`.

## Secrets
- Never commit keys. `MIMO_API_KEY` is a Fly secret (`fly secrets set`).
- Other keys live in Azure Key Vault `dp-kv-deliverypilot` (`az keyvault secret show`), e.g. `GEMINI-API-KEY-PRIMARY`, `FAL-AI-KEY` (fal account locked: TOP_UP).
- MiMo base URL: `https://api.xiaomimimo.com/v1`.
