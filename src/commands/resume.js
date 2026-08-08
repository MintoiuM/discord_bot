const { SlashCommandBuilder } = require('discord.js');
const { ensureSameVoice } = require('../utils/voice');

module.exports = {
  name: 'resume',
  aliases: ['unpause'],
  data: new SlashCommandBuilder().setName('resume').setDescription('Resume the current track'),
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

    if (!queue.player?.paused) {
      await ctx.reply('Playback is not paused.');
      return;
    }

    await queue.resume();
    await ctx.reply('Resumed.');
  },
};
