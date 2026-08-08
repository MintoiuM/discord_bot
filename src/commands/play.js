const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ensureUserInVoice, ensureSameVoice } = require('../utils/voice');
const { formatDuration, truncate } = require('../utils/format');

module.exports = {
  name: 'play',
  aliases: ['p'],
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube or SoundCloud')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Song name, URL, or sc:query for SoundCloud search')
        .setRequired(true),
    ),
  async execute(ctx) {
    const query = ctx.isSlash
      ? ctx.interaction.options.getString('query', true)
      : ctx.args.join(' ').trim();

    if (!query) {
      await ctx.reply('Provide a song name or URL.');
      return;
    }

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

    await ctx.defer();

    let resolved;
    try {
      resolved = await ctx.client.queues.resolve(query);
    } catch (error) {
      await ctx.reply(`Failed to resolve that query: ${error.message}`);
      return;
    }

    if (!resolved.tracks.length) {
      await ctx.reply('No results found.');
      return;
    }

    const queue = ctx.client.queues.getOrCreate(ctx.guildId, ctx.channelId);
    const wrapped = ctx.client.queues.wrapTracks(resolved.tracks, ctx.user);
    const wasIdle = !queue.current && !queue.playing;

    queue.enqueue(wrapped);

    try {
      await queue.start(voiceCheck.channel);
    } catch (error) {
      await ctx.reply(`Could not start playback: ${error.message}`);
      return;
    }

    const first = wrapped[0];
    const embed = new EmbedBuilder().setColor(0x57f287);

    if (resolved.playlistName) {
      embed
        .setTitle('Playlist queued')
        .setDescription(`**${truncate(resolved.playlistName, 80)}** — added **${wrapped.length}** tracks.`)
        .addFields({
          name: 'First track',
          value: `[${truncate(first.info.title)}](${first.info.uri || 'https://discord.com'})`,
        });
    } else if (wasIdle) {
      embed
        .setTitle('Playing')
        .setDescription(`[${truncate(first.info.title)}](${first.info.uri || 'https://discord.com'})`)
        .addFields(
          { name: 'Author', value: first.info.author || 'Unknown', inline: true },
          { name: 'Duration', value: formatDuration(first.info.length), inline: true },
        );
    } else {
      embed
        .setTitle('Added to queue')
        .setDescription(`[${truncate(first.info.title)}](${first.info.uri || 'https://discord.com'})`)
        .addFields(
          { name: 'Position', value: String(queue.size), inline: true },
          { name: 'Duration', value: formatDuration(first.info.length), inline: true },
        );
    }

    if (first.info.artworkUrl) {
      embed.setThumbnail(first.info.artworkUrl);
    }

    await ctx.reply({ embeds: [embed] });
  },
};
