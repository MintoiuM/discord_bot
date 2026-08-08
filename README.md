# Discord Music Bot

Self-hosted Discord music bot with **slash commands** and a **`-` prefix**.

Built with `discord.js`, `@discordjs/voice`, `yt-dlp`, and FFmpeg. Plays **YouTube** and **SoundCloud**. No Lavalink.

## Features

- Slash + prefix commands (same handlers)
- Queue: play, skip, stop, pause/resume, loop, shuffle, remove, clear
- YouTube search by default; SoundCloud via URL or `sc:`
- Playlist support (capped by `MAX_PLAYLIST_TRACKS`)
- Local-first; easy to move to a VPS later

## Requirements

- Node.js 18+
- Discord bot application with **Message Content Intent** enabled
- Bot permissions: Connect, Speak, Send Messages, Embed Links, Use Application Commands

`yt-dlp` and `ffmpeg` binaries come from npm (`youtube-dl-exec`, `ffmpeg-static`).

## Setup

1. Clone the repo and install dependencies:

```powershell
npm install
```

2. Copy the env template and fill it in:

```powershell
copy .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | yes | Bot token from the Discord Developer Portal |
| `CLIENT_ID` | yes | Application ID |
| `GUILD_ID` | recommended | Test server ID for instant slash command updates |
| `PREFIX` | no | Message command prefix (default `-`) |
| `MAX_PLAYLIST_TRACKS` | no | Max tracks loaded from a playlist (default `50`) |

3. In the [Discord Developer Portal](https://discord.com/developers/applications):
   - Enable **Message Content Intent**
   - Invite the bot with scopes `bot` + `applications.commands`

4. Register slash commands:

```powershell
npm run deploy
```

With `GUILD_ID` set, commands appear immediately on that server. Without it, global deploy can take up to ~1 hour.

## Run

```powershell
npm start
```

Join a voice channel, then try:

```text
-play never gonna give you up
-play sc:lofi
-play https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

## Commands

Prefix defaults to `-`. Aliases are listed where available.

| Slash | Prefix | Description |
|-------|--------|-------------|
| `/play` | `-play`, `-p` | Play a search query or URL |
| `/skip` | `-skip`, `-s`, `-next` | Skip the current track |
| `/stop` | `-stop`, `-dc` | Stop, clear queue, leave voice |
| `/pause` | `-pause` | Pause playback |
| `/resume` | `-resume`, `-unpause` | Resume playback |
| `/queue` | `-queue`, `-q` | Show the queue |
| `/nowplaying` | `-nowplaying`, `-np` | Show the current track |
| `/volume` | `-volume`, `-vol`, `-v` | Set or show volume (1–100) |
| `/loop` | `-loop`, `-l` | Loop mode: `off`, `track`, or `queue` |
| `/shuffle` | `-shuffle`, `-mix` | Shuffle upcoming tracks |
| `/remove` | `-remove`, `-rm` | Remove a queue position |
| `/clear` | `-clear` | Clear upcoming tracks (keeps current) |
| `/join` | `-join`, `-summon` | Join your voice channel |
| `/leave` | `-leave`, `-lv` | Leave the voice channel |

### Play query tips

- Plain text → YouTube search
- `sc:query` or `scsearch1:query` → SoundCloud search
- YouTube / SoundCloud URLs → play directly
- Playlists are supported (trimmed to `MAX_PLAYLIST_TRACKS`)

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Start bot | `npm start` | Runs `src/index.js` |
| Deploy slash commands | `npm run deploy` | Registers application commands |
| Smoke test | `npm run smoke` | Checks yt-dlp YouTube + SoundCloud resolve |

## Project layout

```text
src/
  index.js              # Bot entrypoint
  config.js             # Env config
  deploy-commands.js    # Slash command registration
  commands/             # Slash + prefix command modules
  events/               # ready, interactionCreate, messageCreate
  music/                # Queue, yt-dlp resolve, audio streaming
  utils/                # Context helpers, voice checks, formatting
scripts/
  smoke-ytdlp.js        # Resolve smoke test
```

## Audio quality tips

1. Set the Discord voice channel **Bitrate** to **96–128+ kbps**.
2. In Discord **User Settings → Voice & Video**, turn off Noise Suppression, Echo Cancellation, and Automatic Gain Control while listening to music.

## Troubleshooting

- **Bot ignores `-play`** → enable Message Content Intent and restart the bot.
- **Slash commands missing** → run `npm run deploy` (use `GUILD_ID` for fast updates).
- **No sound / can't join** → check Connect + Speak permissions; make sure you are in a voice channel.
- **YouTube suddenly fails** → refresh yt-dlp with `npm update youtube-dl-exec` (or reinstall), then restart.

## VPS later

Run the same project on a VPS with a process manager such as `pm2`. Keep secrets in `.env` (never commit it). You do not need Java or Lavalink.

## License

ISC
