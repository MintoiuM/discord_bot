const {
  joinVoiceChannel,
  createAudioPlayer,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
} = require('@discordjs/voice');
const { EmbedBuilder } = require('discord.js');
const { formatDuration, truncate } = require('../utils/format');
const { createTrackResource } = require('./stream');

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
    this.connection = null;
    this.player = null;
    this.playing = false;
    this.paused = false;
    this.startedAt = null;
    this.pausedAt = null;
    this.pausedMs = 0;
    this._skipping = false;
    this._stopping = false;
    this._cleanupStream = null;
    this._bound = false;
    this.destroyed = false;
  }

  get size() {
    return this.tracks.length;
  }

  get isEmpty() {
    return this.tracks.length === 0 && !this.current;
  }

  get position() {
    if (!this.current || !this.startedAt) return 0;
    const now = this.paused && this.pausedAt ? this.pausedAt : Date.now();
    return Math.max(0, now - this.startedAt - this.pausedMs);
  }

  setTextChannel(channelId) {
    this.textChannelId = channelId;
  }

  ensurePlayer(voiceChannel) {
    let connection = getVoiceConnection(this.guildId);
    if (!connection) {
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true,
      });
    } else if (connection.joinConfig.channelId !== voiceChannel.id) {
      connection.rejoin({
        channelId: voiceChannel.id,
        selfDeaf: true,
        selfMute: false,
      });
    }

    this.connection = connection;

    if (!this.player) {
      this.player = createAudioPlayer();
      connection.subscribe(this.player);
      this.bindPlayer(this.player);
    } else if (!this._bound) {
      connection.subscribe(this.player);
      this.bindPlayer(this.player);
    }

    return entersState(connection, VoiceConnectionStatus.Ready, 20_000).then(() => this.player);
  }

  bindPlayer(player) {
    if (this._bound && this.player === player) return;
    this.player = player;
    this._bound = true;

    player.on(AudioPlayerStatus.Playing, () => {
      this.playing = true;
      this.paused = false;
    });

    player.on(AudioPlayerStatus.Idle, () => {
      this.handleTrackEnd().catch((error) => {
        console.error(`[queue:${this.guildId}] end handler error`, error);
      });
    });

    player.on('error', (error) => {
      console.error(`[queue:${this.guildId}] player error`, error);
      this._skipping = true;
      this.handleTrackEnd().catch(() => {});
    });
  }

  enqueue(tracks) {
    this.tracks.push(...tracks);
  }

  async playCurrent() {
    if (!this.current || !this.player) return false;

    if (typeof this._cleanupStream === 'function') {
      this._cleanupStream();
      this._cleanupStream = null;
    }

    const { resource, cleanup } = createTrackResource(this.current.url, this.volume);
    this._cleanupStream = cleanup;
    this.startedAt = Date.now();
    this.pausedAt = null;
    this.pausedMs = 0;
    this.paused = false;
    this.playing = true;

    this.player.play(resource);
    this.sendNowPlaying().catch(() => {});
    return true;
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
    return this.playCurrent();
  }

  async start(voiceChannel) {
    await this.ensurePlayer(voiceChannel);
    if (this.playing || this.current) return true;
    return this.playNext();
  }

  async handleTrackEnd() {
    if (this.destroyed) return;

    if (this._stopping) {
      this._stopping = false;
      this.current = null;
      this.playing = false;
      return;
    }

    if (typeof this._cleanupStream === 'function') {
      this._cleanupStream();
      this._cleanupStream = null;
    }

    if (this._skipping) {
      this._skipping = false;
      this.current = null;
      this.playing = false;
      await this.playNext();
      return;
    }

    if (this.loop === 'track' && this.current) {
      await this.playCurrent();
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
    this.player.stop(true);
    return true;
  }

  async pause() {
    if (!this.player || !this.current || this.paused) return false;
    const ok = this.player.pause(true);
    if (ok) {
      this.paused = true;
      this.pausedAt = Date.now();
    }
    return ok;
  }

  async resume() {
    if (!this.player || !this.current || !this.paused) return false;
    const ok = this.player.unpause();
    if (ok) {
      if (this.pausedAt) {
        this.pausedMs += Date.now() - this.pausedAt;
      }
      this.pausedAt = null;
      this.paused = false;
    }
    return ok;
  }

  async setVolume(volume) {
    this.volume = Math.max(1, Math.min(100, volume));
    const resourceVolume = this.player?.state?.resource?.volume;
    if (resourceVolume) {
      resourceVolume.setVolume(this.volume / 100);
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
    this._stopping = true;
    this.tracks = [];
    this.current = null;
    this.playing = false;
    this.paused = false;
    this.loop = 'off';

    if (typeof this._cleanupStream === 'function') {
      this._cleanupStream();
      this._cleanupStream = null;
    }

    try {
      this.player?.stop(true);
    } catch {
      // ignore
    }

    await this.destroy();
  }

  async destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this._stopping = true;
    this.tracks = [];
    this.current = null;
    this.playing = false;
    this.paused = false;
    this._bound = false;

    if (typeof this._cleanupStream === 'function') {
      this._cleanupStream();
      this._cleanupStream = null;
    }

    try {
      this.player?.stop(true);
    } catch {
      // ignore
    }

    try {
      getVoiceConnection(this.guildId)?.destroy();
    } catch {
      // already disconnected
    }

    this.player = null;
    this.connection = null;
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
