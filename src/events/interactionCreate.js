const { createSlashContext } = require('../utils/context');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const ctx = createSlashContext(interaction);

    try {
      await command.execute(ctx);
    } catch (error) {
      console.error(`Error in /${interaction.commandName}:`, error);
      const payload = { content: 'Something went wrong while running that command.', ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};
