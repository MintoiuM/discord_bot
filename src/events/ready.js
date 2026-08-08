module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Prefix: ${client.config.prefix}`);
    console.log(`Loaded ${client.commands.size} commands`);
  },
};
