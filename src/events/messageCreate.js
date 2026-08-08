const { createMessageContext } = require('../utils/context');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const prefix = client.config.prefix;
    if (!message.content.startsWith(prefix)) return;

    const body = message.content.slice(prefix.length).trim();
    if (!body) return;

    const [rawName, ...args] = body.split(/\s+/);
    const name = rawName.toLowerCase();

    const command =
      client.commands.get(name) ||
      client.commands.find((cmd) => cmd.aliases?.includes(name));

    if (!command) return;

    const ctx = createMessageContext(message, args);

    try {
      await command.execute(ctx);
    } catch (error) {
      console.error(`Error in ${prefix}${name}:`, error);
      await message.reply('Something went wrong while running that command.').catch(() => {});
    }
  },
};
