const { SlashCommandBuilder } = require('discord.js');
const { ensureSameVoice } = require('../utils/voice');
const { truncate } = require('../utils/format');

module.exports = {
  name: 'remove',
  aliases: ['rm'],
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a track from the queue by position')
    .addIntegerOption((option) =>
      option
        .setName('position')
        .setDescription('Queue position starting at 1')
        .setRequired(true)
        .setMinValue(1),
    ),
  async execute(ctx) {
    const check = ensureSameVoice(ctx);
    if (!check.ok) {
      await ctx.reply(check.error);
      return;
    }

    const queue = ctx.client.queues.get(ctx.guildId);
    if (!queue || queue.size === 0) {
      await ctx.reply('The queue is empty.');
      return;
    }

    const position = ctx.isSlash
      ? ctx.interaction.options.getInteger('position', true)
      : Number(ctx.args[0]);

    if (!Number.isInteger(position) || position < 1) {
      await ctx.reply('Provide a valid queue position (starting at 1).');
      return;
    }

    const removed = queue.remove(position);
    if (!removed) {
      await ctx.reply('No track at that position.');
      return;
    }

    await ctx.reply(`Removed **${truncate(removed.info.title, 80)}** from the queue.`);
  },
};
