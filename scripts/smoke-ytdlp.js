const { resolveTracks } = require('../src/music/trackResolve');

(async () => {
  console.log('Resolving YouTube search...');
  const yt = await resolveTracks('ytsearch1:never gonna give you up');
  console.log(
    'youtube:',
    yt.tracks[0]
      ? `${yt.tracks[0].info.title} | ${yt.tracks[0].url}`
      : 'no results',
  );

  console.log('Resolving SoundCloud search...');
  const sc = await resolveTracks('scsearch1:lofi');
  console.log(
    'soundcloud:',
    sc.tracks[0]
      ? `${sc.tracks[0].info.title} | ${sc.tracks[0].url}`
      : 'no results',
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
