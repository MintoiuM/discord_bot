const { SlashCommandBuilder } = require('discord.js');
const { ensureSameVoice } = require('../utils/voice');

module.exports = {
  name: 'clear',
  aliases: [],
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear the upcoming queue (keeps the current track)'),
  async execute(ctx) {
    const check = ensureSameVoice(ctx);
    if (!check.ok) {
      await ctx.reply(check.error);
      return;
    }

    const queue = ctx.client.queues.get(ctx.guildId);
    if (!queue || queue.size === 0) {
      await ctx.reply('The queue is already empty.');
      return;
    }

    const count = queue.clearUpcoming();
    await ctx.reply(`Cleared **${count}** upcoming track(s).`);
  },
};
