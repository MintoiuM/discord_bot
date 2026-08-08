const { spawn } = require('node:child_process');
const ffmpegPath = require('ffmpeg-static');
const youtubeDl = require('youtube-dl-exec');
const { createAudioResource, StreamType } = require('@discordjs/voice');

/**
 * Stream best audio via yt-dlp -> ffmpeg PCM for Discord.
 */
function createTrackResource(trackUrl, volumePercent = 100) {
  const ytdlp = youtubeDl.exec(
    trackUrl,
    {
      output: '-',
      quiet: true,
      noWarnings: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
      noPlaylist: true,
      format: 'bestaudio[acodec=opus]/bestaudio/best',
    },
    {
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  const ffmpeg = spawn(
    ffmpegPath,
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      'pipe:0',
      '-analyzeduration',
      '0',
      '-f',
      's16le',
      '-ar',
      '48000',
      '-ac',
      '2',
      'pipe:1',
    ],
    {
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  );

  ytdlp.stdout.pipe(ffmpeg.stdin);

  const onYtdlpError = (chunk) => {
    const text = chunk.toString().trim();
    if (text) console.error('[yt-dlp]', text);
  };
  const onFfmpegError = (chunk) => {
    const text = chunk.toString().trim();
    if (text) console.error('[ffmpeg]', text);
  };

  ytdlp.stderr.on('data', onYtdlpError);
  ffmpeg.stderr.on('data', onFfmpegError);

  ytdlp.on('error', (error) => {
    console.error('[yt-dlp] process error', error);
    ffmpeg.kill('SIGKILL');
  });

  ffmpeg.on('error', (error) => {
    console.error('[ffmpeg] process error', error);
    try {
      ytdlp.kill('SIGKILL');
    } catch {
      // ignore
    }
  });

  const resource = createAudioResource(ffmpeg.stdout, {
    inputType: StreamType.Raw,
    inlineVolume: true,
    metadata: { url: trackUrl },
  });

  if (resource.volume) {
    resource.volume.setVolume(Math.max(0, Math.min(1, volumePercent / 100)));
  }

  const cleanup = () => {
    try {
      ytdlp.kill('SIGKILL');
    } catch {
      // ignore
    }
    try {
      ffmpeg.kill('SIGKILL');
    } catch {
      // ignore
    }
  };

  return { resource, cleanup };
}

module.exports = {
  createTrackResource,
};
