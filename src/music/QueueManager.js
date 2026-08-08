const GuildQueue = require('./GuildQueue');
const { resolveTracks, wrapTrack } = require('./trackResolve');

class QueueManager {
  /**
   * @param {import('discord.js').Client} client
   */
  constructor(client) {
    this.client = client;
    /** @type {Map<string, GuildQueue>} */
    this.queues = new Map();
  }

  get(guildId) {
    return this.queues.get(guildId) ?? null;
  }

  getOrCreate(guildId, textChannelId) {
    let queue = this.queues.get(guildId);
    if (!queue) {
      queue = new GuildQueue(this, guildId);
      this.queues.set(guildId, queue);
    }
    if (textChannelId) {
      queue.setTextChannel(textChannelId);
    }
    return queue;
  }

  async resolve(query) {
    return resolveTracks(query, {
      maxPlaylistTracks: this.client.config.maxPlaylistTracks,
    });
  }

  wrapTracks(tracks, requester) {
    return tracks.map((track) => wrapTrack(track, requester));
  }
}

module.exports = QueueManager;
