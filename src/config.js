require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const config = {
  token: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  guildId: process.env.GUILD_ID || null,
  prefix: process.env.PREFIX || '-',
  lavalink: {
    name: process.env.LAVALINK_NAME || 'main',
    host: process.env.LAVALINK_HOST || 'localhost',
    port: Number(process.env.LAVALINK_PORT || 2333),
    password: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
    secure: String(process.env.LAVALINK_SECURE || 'false').toLowerCase() === 'true',
  },
};

config.nodes = [
  {
    name: config.lavalink.name,
    url: `${config.lavalink.host}:${config.lavalink.port}`,
    auth: config.lavalink.password,
    secure: config.lavalink.secure,
  },
];

module.exports = config;
