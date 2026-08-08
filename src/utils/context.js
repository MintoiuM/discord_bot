/**
 * Normalize slash interactions and prefix messages into one command context.
 */
function createSlashContext(interaction) {
  return {
    client: interaction.client,
    guild: interaction.guild,
    guildId: interaction.guildId,
    channel: interaction.channel,
    channelId: interaction.channelId,
    member: interaction.member,
    user: interaction.user,
    interaction,
    message: null,
    isSlash: true,
    args: [],
    async reply(options) {
      const payload = typeof options === 'string' ? { content: options } : options;
      if (interaction.deferred) {
        return interaction.editReply(payload);
      }
      if (interaction.replied) {
        return interaction.followUp(payload);
      }
      return interaction.reply(payload);
    },
    async defer() {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
      }
    },
  };
}

function createMessageContext(message, args = []) {
  return {
    client: message.client,
    guild: message.guild,
    guildId: message.guildId,
    channel: message.channel,
    channelId: message.channel.id,
    member: message.member,
    user: message.author,
    interaction: null,
    message,
    isSlash: false,
    args,
    async reply(options) {
      const payload = typeof options === 'string' ? { content: options } : options;
      return message.reply(payload);
    },
    async defer() {
      // no-op for prefix commands
    },
  };
}

module.exports = {
  createSlashContext,
  createMessageContext,
};
