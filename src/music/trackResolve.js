const youtubeDl = require('youtube-dl-exec');

const URL_PATTERN = /^https?:\/\//i;

function isUrl(value) {
  return URL_PATTERN.test(value);
}

/**
 * Build a yt-dlp input from user query.
 * Default search: YouTube. Use scsearch: for SoundCloud text search.
 */
function toInput(query) {
  const trimmed = query.trim();
  if (!trimmed) return null;

  if (/^(ytsearch\d*:|ytmsearch\d*:|scsearch\d*:)/i.test(trimmed)) {
    return trimmed;
  }

  if (isUrl(trimmed)) {
    return trimmed;
  }

  if (/^sc:/i.test(trimmed)) {
    return `scsearch1:${trimmed.slice(3).trim()}`;
  }

  return `ytsearch1:${trimmed}`;
}

function entryToTrack(entry) {
  if (!entry) return null;

  const url =
    entry.webpage_url ||
    entry.original_url ||
    entry.url ||
    (entry.id && entry.extractor?.includes('youtube')
      ? `https://www.youtube.com/watch?v=${entry.id}`
      : null);

  if (!url || !isUrl(url) && !entry.id) {
    // flat playlist entries sometimes only have id + ie_key
    if (entry.id && /youtube/i.test(String(entry.ie_key || entry.extractor_key || 'youtube'))) {
      return {
        url: `https://www.youtube.com/watch?v=${entry.id}`,
        info: {
          title: entry.title || 'Unknown title',
          author: entry.uploader || entry.channel || entry.artist || 'Unknown',
          length: Number.isFinite(entry.duration) ? Math.floor(entry.duration * 1000) : 0,
          uri: `https://www.youtube.com/watch?v=${entry.id}`,
          artworkUrl: entry.thumbnail || entry.thumbnails?.[0]?.url || null,
          sourceName: 'youtube',
          isStream: Boolean(entry.is_live),
        },
      };
    }
    return null;
  }

  const resolvedUrl = isUrl(url)
    ? url
    : entry.id
      ? `https://www.youtube.com/watch?v=${entry.id}`
      : null;

  if (!resolvedUrl) return null;

  return {
    url: resolvedUrl,
    info: {
      title: entry.title || 'Unknown title',
      author: entry.uploader || entry.channel || entry.artist || 'Unknown',
      length: Number.isFinite(entry.duration) ? Math.floor(entry.duration * 1000) : 0,
      uri: resolvedUrl,
      artworkUrl: entry.thumbnail || entry.thumbnails?.[entry.thumbnails.length - 1]?.url || null,
      sourceName: entry.extractor || entry.ie_key || 'unknown',
      isStream: Boolean(entry.is_live),
    },
  };
}

async function resolveTracks(query, { maxPlaylistTracks = 50 } = {}) {
  const input = toInput(query);
  if (!input) {
    return { tracks: [], playlistName: null };
  }

  let info;
  try {
    info = await youtubeDl(input, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
      skipDownload: true,
      flatPlaylist: true,
    });
  } catch (error) {
    throw new Error(error.stderr?.toString?.() || error.message || 'yt-dlp failed to resolve that query.');
  }

  if (!info) {
    return { tracks: [], playlistName: null };
  }

  if (Array.isArray(info.entries) && info.entries.length) {
    const tracks = info.entries
      .map((entry) => entryToTrack(entry))
      .filter(Boolean)
      .slice(0, maxPlaylistTracks);

    return {
      tracks,
      playlistName: info.title || 'Playlist',
    };
  }

  const track = entryToTrack(info);
  return {
    tracks: track ? [track] : [],
    playlistName: null,
  };
}

function wrapTrack(track, requester) {
  return {
    url: track.url,
    info: track.info,
    requester: {
      id: requester.id,
      tag: requester.tag || requester.username,
    },
  };
}

module.exports = {
  toInput,
  resolveTracks,
  wrapTrack,
};
