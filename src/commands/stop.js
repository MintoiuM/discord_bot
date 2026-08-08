const { SlashCommandBuilder } = require('discord.js');
const { ensureSameVoice } = require('../utils/voice');

module.exports = {
  name: 'stop',
  aliases: ['dc', 'disconnect'],
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback, clear the queue, and leave voice'),
  async execute(ctx) {
    const check = ensureSameVoice(ctx);
    if (!check.ok) {
      await ctx.reply(check.error);
      return;
    }

    const queue = ctx.client.queues.get(ctx.guildId);
    if (!queue) {
      await ctx.reply('Nothing is playing.');
      return;
    }

    await queue.stop();
    await ctx.reply('Stopped playback and left the voice channel.');
  },
};
