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

  getIdealNode() {
    const node = this.client.shoukaku.getIdealNode();
    if (!node) {
      throw new Error('No Lavalink nodes are connected. Start Lavalink and restart the bot.');
    }
    return node;
  }

  async resolve(query) {
    const node = this.getIdealNode();
    return resolveTracks(node, query);
  }

  wrapTracks(tracks, requester) {
    return tracks.map((track) => wrapTrack(track, requester));
  }
}

module.exports = QueueManager;
