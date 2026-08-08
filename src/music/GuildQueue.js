const { EmbedBuilder } = require('discord.js');
const { formatDuration, truncate } = require('../utils/format');

class GuildQueue {
  /**
   * @param {import('./QueueManager')} manager
   * @param {string} guildId
   */
  constructor(manager, guildId) {
    this.manager = manager;
    this.guildId = guildId;
    this.tracks = [];
    this.current = null;
    this.loop = 'off';
    this.volume = 100;
    this.textChannelId = null;
    this.player = null;
    this.playing = false;
    this._bound = false;
    this._skipping = false;
  }

  get size() {
    return this.tracks.length;
  }

  get isEmpty() {
    return this.tracks.length === 0 && !this.current;
  }

  setTextChannel(channelId) {
    this.textChannelId = channelId;
  }

  bindPlayer(player) {
    if (this._bound && this.player === player) return;
    this.player = player;
    this._bound = true;

    player.on('start', () => {
      this.playing = true;
      this.sendNowPlaying().catch(() => {});
    });

    player.on('end', (data) => {
      this.handleTrackEnd(data.reason).catch((err) => {
        console.error(`[queue:${this.guildId}] end handler error`, err);
      });
    });

    player.on('stuck', () => {
      this.skip().catch(() => {});
    });

    player.on('exception', (data) => {
      console.error(`[queue:${this.guildId}] track exception`, data.exception);
      this.skip().catch(() => {});
    });
  }

  async ensurePlayer(voiceChannel) {
    const shoukaku = this.manager.client.shoukaku;
    let player = shoukaku.players.get(this.guildId);

    if (!player) {
      player = await shoukaku.joinVoiceChannel({
        guildId: this.guildId,
        channelId: voiceChannel.id,
        shardId: voiceChannel.guild.shardId ?? 0,
        deaf: true,
      });
    }

    this.bindPlayer(player);
    await player.setGlobalVolume(this.volume * 10);
    return player;
  }

  enqueue(tracks) {
    this.tracks.push(...tracks);
  }

  async playNext() {
    const next = this.tracks.shift();
    if (!next) {
      this.current = null;
      this.playing = false;
      await this.destroy();
      return false;
    }

    this.current = next;
    await this.player.playTrack({ track: { encoded: next.encoded } });
    return true;
  }

  async start(voiceChannel) {
    await this.ensurePlayer(voiceChannel);
    if (this.playing || this.current) return true;
    return this.playNext();
  }

  async handleTrackEnd(reason) {
    if (reason === 'replaced') return;

    if (this._skipping) {
      this._skipping = false;
      this.current = null;
      this.playing = false;
      await this.playNext();
      return;
    }

    if (reason === 'stopped') {
      this.current = null;
      this.playing = false;
      return;
    }

    if (this.loop === 'track' && this.current) {
      await this.player.playTrack({ track: { encoded: this.current.encoded } });
      return;
    }

    if (this.loop === 'queue' && this.current) {
      this.tracks.push(this.current);
    }

    this.current = null;
    this.playing = false;
    await this.playNext();
  }

  async skip() {
    if (!this.player || (!this.current && this.tracks.length === 0)) return false;
    this._skipping = true;
    await this.player.stopTrack();
    return true;
  }

  async pause() {
    if (!this.player || !this.current) return false;
    await this.player.setPaused(true);
    return true;
  }

  async resume() {
    if (!this.player || !this.current) return false;
    await this.player.setPaused(false);
    return true;
  }

  async setVolume(volume) {
    this.volume = Math.max(1, Math.min(100, volume));
    if (this.player) {
      await this.player.setGlobalVolume(this.volume * 10);
    }
    return this.volume;
  }

  setLoop(mode) {
    if (!['off', 'track', 'queue'].includes(mode)) {
      throw new Error('Invalid loop mode');
    }
    this.loop = mode;
    return this.loop;
  }

  shuffle() {
    for (let i = this.tracks.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
    return this.tracks.length;
  }

  remove(position) {
    const index = position - 1;
    if (index < 0 || index >= this.tracks.length) return null;
    const [removed] = this.tracks.splice(index, 1);
    return removed;
  }

  clearUpcoming() {
    const count = this.tracks.length;
    this.tracks = [];
    return count;
  }

  async stop() {
    this.tracks = [];
    this.current = null;
    this.playing = false;
    this.loop = 'off';
    if (this.player) {
      try {
        await this.player.stopTrack();
      } catch {
        // ignore
      }
    }
    await this.destroy();
  }

  async destroy() {
    this.tracks = [];
    this.current = null;
    this.playing = false;
    this._bound = false;
    this.player = null;

    try {
      await this.manager.client.shoukaku.leaveVoiceChannel(this.guildId);
    } catch {
      // already disconnected
    }

    this.manager.queues.delete(this.guildId);
  }

  async sendNowPlaying() {
    if (!this.current || !this.textChannelId) return;
    const channel = await this.manager.client.channels.fetch(this.textChannelId).catch(() => null);
    if (!channel?.isTextBased?.()) return;

    const track = this.current;
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Now Playing')
      .setDescription(`[${truncate(track.info.title, 100)}](${track.info.uri || 'https://discord.com'})`)
      .addFields(
        { name: 'Author', value: track.info.author || 'Unknown', inline: true },
        { name: 'Duration', value: formatDuration(track.info.length), inline: true },
        { name: 'Requested by', value: `<@${track.requester.id}>`, inline: true },
      );

    if (track.info.artworkUrl) {
      embed.setThumbnail(track.info.artworkUrl);
    }

    await channel.send({ embeds: [embed] });
  }
}

module.exports = GuildQueue;
