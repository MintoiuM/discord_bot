require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  token: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  guildId: process.env.GUILD_ID || null,
  prefix: process.env.PREFIX || '-',
  maxPlaylistTracks: Number(process.env.MAX_PLAYLIST_TRACKS || 50),
};
