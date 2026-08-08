const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatDuration, truncate } = require('../utils/format');

module.exports = {
  name: 'nowplaying',
  aliases: ['np', 'current'],
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the currently playing track'),
  async execute(ctx) {
    const queue = ctx.client.queues.get(ctx.guildId);
    if (!queue?.current) {
      await ctx.reply('Nothing is playing.');
      return;
    }

    const track = queue.current;
    const position = queue.player?.position ?? 0;
    const progress = `${formatDuration(position)} / ${formatDuration(track.info.length)}`;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Now Playing')
      .setDescription(`[${truncate(track.info.title, 100)}](${track.info.uri || 'https://discord.com'})`)
      .addFields(
        { name: 'Author', value: track.info.author || 'Unknown', inline: true },
        { name: 'Progress', value: progress, inline: true },
        { name: 'Requested by', value: `<@${track.requester.id}>`, inline: true },
        { name: 'Loop', value: queue.loop, inline: true },
        { name: 'Volume', value: `${queue.volume}%`, inline: true },
        { name: 'Paused', value: queue.player?.paused ? 'Yes' : 'No', inline: true },
      );

    if (track.info.artworkUrl) {
      embed.setThumbnail(track.info.artworkUrl);
    }

    await ctx.reply({ embeds: [embed] });
  },
};
