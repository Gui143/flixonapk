// ─────────────────────────────────────────────────────────────
//  Suporte a embeds de players (processo principal - CommonJS)
//  Apenas funções helper. O registro de handlers fica em main.js.
// ─────────────────────────────────────────────────────────────

// Hosts de players de vídeo que bloqueiam iframe.
const VIDEO_EMBED_HOSTS = [
  // Fembed e variações
  'fembed.sx', 'fembedhd.com', 'fembed.net', 'fembed.com', 'feurl.com',
  'savemax.icu',
  // Streamtape
  'streamtape.com',
  // Doodstream
  'doodstream.com', 'dood.so', 'doodstream.xyz',
  // Mixdrop
  'mixdrop.co', 'mixdrop.to', 'mixdrop.ag',
  // Upstream
  'upstream.to',
  // Voe
  'voe.sx', 'voe-unblock.com',
  // Filemoon
  'filemoon.sx', 'moonmovies.pro',
  // Streamlare
  'streamlare.com',
  // Outros comuns
  'yourupload.com', 'streamsb.net', 'streamsbn.com',
  'vidhide.com', 'vidhidepro.com', 'megaf.cc',
  'superembeds.com', 'hdvix.com', 'moviesapi.club',
  'plyr.in'
];

function isVideoEmbedHost(hostname) {
  if (!hostname) return false;
  const h = hostname.toLowerCase();
  return VIDEO_EMBED_HOSTS.some((d) => h === d || h.endsWith('.' + d));
}

// Constrói headers de Referer/Origin para um host de embed
function buildEmbedHeaders(hostname, originalHeaders) {
  const origin = 'https://' + hostname;
  const headers = Object.assign({}, originalHeaders || {});
  headers['Referer'] = origin + '/';
  if (!headers['Origin']) headers['Origin'] = origin;
  return headers;
}

module.exports = { isVideoEmbedHost, buildEmbedHeaders, VIDEO_EMBED_HOSTS };
