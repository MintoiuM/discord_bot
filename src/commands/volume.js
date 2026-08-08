const { SlashCommandBuilder } = require('discord.js');
const { ensureSameVoice } = require('../utils/voice');

module.exports = {
  name: 'volume',
  aliases: ['vol', 'v'],
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set or show the player volume')
    .addIntegerOption((option) =>
      option
        .setName('level')
        .setDescription('Volume from 1 to 100')
        .setMinValue(1)
        .setMaxValue(100),
    ),
  async execute(ctx) {
    const queue = ctx.client.queues.get(ctx.guildId);
    if (!queue) {
      await ctx.reply('Nothing is playing.');
      return;
    }

    const level = ctx.isSlash
      ? ctx.interaction.options.getInteger('level')
      : (ctx.args[0] ? Number(ctx.args[0]) : null);

    if (level === null || Number.isNaN(level)) {
      await ctx.reply(`Current volume is **${queue.volume}%**.`);
      return;
    }

    if (level < 1 || level > 100) {
      await ctx.reply('Volume must be between 1 and 100.');
      return;
    }

    const check = ensureSameVoice(ctx);
    if (!check.ok) {
      await ctx.reply(check.error);
      return;
    }

    const volume = await queue.setVolume(level);
    await ctx.reply(`Volume set to **${volume}%**.`);
  },
};
