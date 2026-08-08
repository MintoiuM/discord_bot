const { SlashCommandBuilder } = require('discord.js');
const { ensureSameVoice } = require('../utils/voice');

module.exports = {
  name: 'skip',
  aliases: ['s', 'next'],
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current track'),
  async execute(ctx) {
    const check = ensureSameVoice(ctx);
    if (!check.ok) {
      await ctx.reply(check.error);
      return;
    }

    const queue = ctx.client.queues.get(ctx.guildId);
    if (!queue?.current) {
      await ctx.reply('Nothing is playing.');
      return;
    }

    const title = queue.current.info.title;
    await queue.skip();
    await ctx.reply(`Skipped **${title}**.`);
  },
};
