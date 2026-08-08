const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { Shoukaku, Connectors } = require('shoukaku');
const config = require('./config');
const QueueManager = require('./music/QueueManager');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.config = config;
client.commands = new Collection();
client.queues = new QueueManager(client);

const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (!command?.name || typeof command.execute !== 'function') {
    console.warn(`Skipping invalid command file: ${file}`);
    continue;
  }
  client.commands.set(command.name, command);
}

const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), config.nodes, {
  moveOnDisconnect: false,
  reconnectTries: 5,
  reconnectInterval: 5,
  restTimeout: 60,
});

client.shoukaku = shoukaku;

shoukaku.on('ready', (name) => {
  console.log(`[lavalink] Node "${name}" is ready`);
});

shoukaku.on('error', (name, error) => {
  console.error(`[lavalink] Node "${name}" error:`, error);
});

shoukaku.on('close', (name, code, reason) => {
  console.warn(`[lavalink] Node "${name}" closed (${code}): ${reason || 'no reason'}`);
});

shoukaku.on('disconnect', (name, _count) => {
  console.warn(`[lavalink] Node "${name}" disconnected`);
});

client.login(config.token);
