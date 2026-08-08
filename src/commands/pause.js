const { SlashCommandBuilder } = require('discord.js');
const { ensureSameVoice } = require('../utils/voice');

module.exports = {
  name: 'pause',
  aliases: [],
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause the current track'),
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

    if (queue.paused) {
      await ctx.reply('Playback is already paused.');
      return;
    }

    await queue.pause();
    await ctx.reply('Paused.');
  },
};
