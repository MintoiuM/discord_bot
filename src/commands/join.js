const { SlashCommandBuilder } = require('discord.js');
const { ensureUserInVoice, ensureSameVoice } = require('../utils/voice');

module.exports = {
  name: 'join',
  aliases: ['summon'],
  data: new SlashCommandBuilder().setName('join').setDescription('Join your voice channel'),
  async execute(ctx) {
    const voiceCheck = ensureUserInVoice(ctx);
    if (!voiceCheck.ok) {
      await ctx.reply(voiceCheck.error);
      return;
    }

    const sameCheck = ensureSameVoice(ctx, { allowEmptyBot: true });
    if (!sameCheck.ok) {
      await ctx.reply(sameCheck.error);
      return;
    }

    const queue = ctx.client.queues.getOrCreate(ctx.guildId, ctx.channelId);

    try {
      await queue.ensurePlayer(voiceCheck.channel);
    } catch (error) {
      await ctx.reply(`Could not join: ${error.message}`);
      return;
    }

    await ctx.reply(`Joined **${voiceCheck.channel.name}**.`);
  },
};
