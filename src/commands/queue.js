const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatDuration, truncate } = require('../utils/format');

module.exports = {
  name: 'queue',
  aliases: ['q'],
  data: new SlashCommandBuilder().setName('queue').setDescription('Show the music queue'),
  async execute(ctx) {
    const queue = ctx.client.queues.get(ctx.guildId);
    if (!queue || (!queue.current && queue.size === 0)) {
      await ctx.reply('The queue is empty.');
      return;
    }

    const lines = [];
    if (queue.current) {
      lines.push(
        `**Now:** [${truncate(queue.current.info.title, 60)}](${queue.current.info.uri || 'https://discord.com'}) \`${formatDuration(queue.current.info.length)}\``,
      );
    }

    const upcoming = queue.tracks.slice(0, 10);
    upcoming.forEach((track, index) => {
      lines.push(
        `**${index + 1}.** [${truncate(track.info.title, 55)}](${track.info.uri || 'https://discord.com'}) \`${formatDuration(track.info.length)}\``,
      );
    });

    if (queue.size > 10) {
      lines.push(`…and **${queue.size - 10}** more`);
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Queue')
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Loop: ${queue.loop} • Volume: ${queue.volume}% • ${queue.size} upcoming` });

    await ctx.reply({ embeds: [embed] });
  },
};
