const { SlashCommandBuilder } = require('discord.js');
const { ensureSameVoice } = require('../utils/voice');

module.exports = {
  name: 'shuffle',
  aliases: ['mix'],
  data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle the upcoming queue'),
  async execute(ctx) {
    const check = ensureSameVoice(ctx);
    if (!check.ok) {
      await ctx.reply(check.error);
      return;
    }

    const queue = ctx.client.queues.get(ctx.guildId);
    if (!queue || queue.size < 2) {
      await ctx.reply('Need at least 2 tracks in the queue to shuffle.');
      return;
    }

    const count = queue.shuffle();
    await ctx.reply(`Shuffled **${count}** upcoming tracks.`);
  },
};
