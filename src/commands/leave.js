const { SlashCommandBuilder } = require('discord.js');
const { ensureSameVoice } = require('../utils/voice');

module.exports = {
  name: 'leave',
  aliases: ['lv'],
  data: new SlashCommandBuilder().setName('leave').setDescription('Leave the voice channel'),
  async execute(ctx) {
    const check = ensureSameVoice(ctx);
    if (!check.ok) {
      await ctx.reply(check.error);
      return;
    }

    const queue = ctx.client.queues.get(ctx.guildId);
    if (queue) {
      await queue.stop();
    }

    await ctx.reply('Left the voice channel.');
  },
};
