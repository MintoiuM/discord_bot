const { LoadType } = require('shoukaku');

const URL_PATTERN = /^https?:\/\//i;

/**
 * Build a Lavalink identifier from user input.
 * Default search: ytsearch. SoundCloud via scsearch: or soundcloud URLs.
 */
function toIdentifier(query) {
  const trimmed = query.trim();
  if (!trimmed) return null;

  if (/^(ytsearch:|ytmsearch:|scsearch:)/i.test(trimmed)) {
    return trimmed;
  }

  if (URL_PATTERN.test(trimmed)) {
    return trimmed;
  }

  return `ytsearch:${trimmed}`;
}

/**
 * Resolve query/URL to tracks via Lavalink.
 * @returns {{ tracks: object[], playlistName: string|null, loadType: string }}
 */
async function resolveTracks(node, query) {
  const identifier = toIdentifier(query);
  if (!identifier) {
    return { tracks: [], playlistName: null, loadType: LoadType.EMPTY };
  }

  const result = await node.rest.resolve(identifier);
  if (!result) {
    return { tracks: [], playlistName: null, loadType: LoadType.EMPTY };
  }

  switch (result.loadType) {
    case LoadType.TRACK:
      return {
        tracks: [result.data],
        playlistName: null,
        loadType: result.loadType,
      };
    case LoadType.PLAYLIST:
      return {
        tracks: result.data.tracks,
        playlistName: result.data.info?.name ?? 'Playlist',
        loadType: result.loadType,
      };
    case LoadType.SEARCH:
      return {
        tracks: result.data.length ? [result.data[0]] : [],
        playlistName: null,
        loadType: result.loadType,
      };
    case LoadType.ERROR:
      throw new Error(result.data?.message || 'Lavalink failed to load that track.');
    default:
      return { tracks: [], playlistName: null, loadType: result.loadType };
  }
}

function wrapTrack(track, requester) {
  return {
    encoded: track.encoded,
    info: track.info,
    requester: {
      id: requester.id,
      tag: requester.tag || requester.username,
    },
  };
}

module.exports = {
  toIdentifier,
  resolveTracks,
  wrapTrack,
};
