# Discord Music Bot

Local Discord music bot using **discord.js**, **Shoukaku**, and **Lavalink**. Supports YouTube + SoundCloud with both slash commands and a `-` prefix.

## Requirements

- Node.js 18+
- Java 17+ (to run Lavalink)
- A Discord bot with **Message Content Intent** enabled
- Bot permissions: Connect, Speak, Send Messages, Embed Links, Use Application Commands

## Setup

1. Copy `.env.example` to `.env` and fill in values.
2. Set `GUILD_ID` to your test server ID so slash commands register instantly (`npm run deploy`).
3. Make sure `LAVALINK_PASSWORD` matches `lavalink/application.yml`.

## Run locally

Open two terminals.

**Terminal 1 — Lavalink**

```powershell
cd lavalink
java -jar Lavalink.jar
```

Wait until Lavalink finishes starting (first run downloads the YouTube plugin into `lavalink/plugins/`).

**Terminal 2 — Bot**

```powershell
npm run deploy
npm start
```

## Commands

Slash and prefix use the same handlers. Prefix defaults to `-` (`PREFIX` in `.env`).

| Slash | Prefix | Description |
|-------|--------|-------------|
| `/play` | `-play` / `-p` | Play YouTube/SoundCloud search or URL |
| `/skip` | `-skip` / `-s` | Skip current track |
| `/stop` | `-stop` | Stop, clear queue, leave voice |
| `/pause` | `-pause` | Pause |
| `/resume` | `-resume` | Resume |
| `/queue` | `-queue` / `-q` | Show queue |
| `/nowplaying` | `-nowplaying` / `-np` | Current track |
| `/volume` | `-volume` / `-vol` | Set/show volume 1–100 |
| `/loop` | `-loop` | `off`, `track`, or `queue` |
| `/shuffle` | `-shuffle` | Shuffle upcoming tracks |
| `/remove` | `-remove` | Remove queue position |
| `/clear` | `-clear` | Clear upcoming queue |
| `/join` | `-join` | Join your voice channel |
| `/leave` | `-leave` | Leave voice |

Plain text searches use YouTube (`ytsearch:`). SoundCloud search: `scsearch:your query`. Direct YouTube/SoundCloud URLs work as-is.

## Smoke test checklist

1. Join a voice channel.
2. `/play never gonna give you up` — should join and play.
3. `-play scsearch:lofi` — should queue/play from SoundCloud search.
4. `/queue`, `/skip`, `/volume 50`, `/loop track`, `/nowplaying`, `/leave`.

Optional Lavalink-only check (no Discord needed):

```powershell
node scripts/smoke-lavalink.js
```

Expected: YouTube and SoundCloud both return `loadType=search` with a track title.

## VPS later

Same code runs on a VPS. Keep Lavalink + the bot running with a process manager such as `pm2`. Do not commit `.env`.

## License

ISC
