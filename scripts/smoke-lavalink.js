const http = require('node:http');
const password = process.env.LAVALINK_PASSWORD || 'youshallnotpass';

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: process.env.LAVALINK_HOST || 'localhost',
        port: Number(process.env.LAVALINK_PORT || 2333),
        path,
        headers: { Authorization: password },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => resolve({ status: res.statusCode, body }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

function summarize(label, body) {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    console.log(`${label}: non-json status body`);
    return;
  }

  const loadType = parsed.loadType;
  let title = 'n/a';
  if (loadType === 'search' && Array.isArray(parsed.data) && parsed.data[0]?.info?.title) {
    title = parsed.data[0].info.title;
  } else if (loadType === 'track' && parsed.data?.info?.title) {
    title = parsed.data.info.title;
  } else if (loadType === 'error') {
    title = parsed.data?.message || 'error';
  }
  console.log(`${label}: loadType=${loadType} title=${title}`);
}

(async () => {
  const version = await get('/version');
  console.log(`version: ${version.status} ${version.body}`);

  const yt = await get(`/v4/loadtracks?identifier=${encodeURIComponent('ytsearch:never gonna give you up')}`);
  summarize('youtube', yt.body);

  const sc = await get(`/v4/loadtracks?identifier=${encodeURIComponent('scsearch:lofi')}`);
  summarize('soundcloud', sc.body);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
