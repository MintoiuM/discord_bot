const { SlashCommandBuilder } = require('discord.js');
const { ensureSameVoice } = require('../utils/voice');

module.exports = {
  name: 'loop',
  aliases: ['l', 'repeat'],
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set loop mode')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Loop mode')
        .setRequired(true)
        .addChoices(
          { name: 'Off', value: 'off' },
          { name: 'Track', value: 'track' },
          { name: 'Queue', value: 'queue' },
        ),
    ),
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

    const mode = ctx.isSlash
      ? ctx.interaction.options.getString('mode', true)
      : (ctx.args[0] || '').toLowerCase();

    if (!['off', 'track', 'queue'].includes(mode)) {
      await ctx.reply('Use `off`, `track`, or `queue`.');
      return;
    }

    queue.setLoop(mode);
    await ctx.reply(`Loop mode set to **${mode}**.`);
  },
};
