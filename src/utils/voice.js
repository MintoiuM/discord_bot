function getMemberVoiceChannel(member) {
  return member?.voice?.channel ?? null;
}

function getBotVoiceChannel(guild) {
  const me = guild.members.me;
  return me?.voice?.channel ?? null;
}

function ensureUserInVoice(ctx) {
  const channel = getMemberVoiceChannel(ctx.member);
  if (!channel) {
    return { ok: false, error: 'You need to be in a voice channel first.' };
  }
  return { ok: true, channel };
}

function ensureSameVoice(ctx, { allowEmptyBot = false } = {}) {
  const userChannel = getMemberVoiceChannel(ctx.member);
  if (!userChannel) {
    return { ok: false, error: 'You need to be in a voice channel first.' };
  }

  const botChannel = getBotVoiceChannel(ctx.guild);
  if (!botChannel) {
    if (allowEmptyBot) {
      return { ok: true, channel: userChannel };
    }
    return { ok: false, error: 'I am not connected to a voice channel.' };
  }

  if (botChannel.id !== userChannel.id) {
    return { ok: false, error: 'You must be in the same voice channel as me.' };
  }

  return { ok: true, channel: userChannel };
}

module.exports = {
  getMemberVoiceChannel,
  getBotVoiceChannel,
  ensureUserInVoice,
  ensureSameVoice,
};
