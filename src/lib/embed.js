// ─────────────────────────────────────────────────────────────
//  Normalização de fontes de vídeo
//  Corrige a "tela preta" do embed convertendo links comuns de
//  YouTube/Vimeo/Dailymotion para o formato embed correto.
// ─────────────────────────────────────────────────────────────

// Detecta arquivos de vídeo diretos (inclusive streams HLS .m3u8)
export function isDirectVideo(url) {
  if (!url) return false;
  return /\.(mp4|webm|m3u8|m4v|ogg|mov)(\?.*)?$/i.test(url);
}

export function isHls(url) {
  return /\.m3u8(\?.*)?$/i.test(url || '');
}

// Converte qualquer link de YouTube/Vimeo/Dailymotion em URL de embed.
// Retorna null se não for reconhecido (significa que a URL deve ser usada como está,
// presumindo que já seja um endereço de embed válido).
export function normalizeEmbedUrl(raw) {
  if (!raw) return null;
  const url = String(raw).trim();

  // YouTube: watch?v=, youtu.be/, /embed/, /shorts/, /live/
  let m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{6,})/
  );
  if (m) {
    return `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  }

  // Vimeo
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) {
    return `https://player.vimeo.com/video/${m[1]}?autoplay=1`;
  }

  // Dailymotion
  m = url.match(/dailymotion\.com\/(?:video\/|embed\/video\/)([a-z0-9]+)/i);
  if (m) {
    return `https://www.dailymotion.com/embed/video/${m[1]}?autoplay=1`;
  }

  // Twitch (clips e canais) — forma simplificada
  m = url.match(/twitch\.tv\/(?:videos\/|clip\/)?([\w-]+)/i);
  if (m && /twitch\.tv\/videos\//.test(url)) {
    return `https://player.twitch.tv/?video=${m[1]}&parent=localhost&autoplay=true`;
  }

  // Caso contrário, retorna a URL original (presume embed válido)
  return url;
}

// Classifica a fonte para exibir um selo amigável na UI
export function describeSource(item) {
  if (item.embedUrl) {
    const u = item.embedUrl;
    if (/youtube|youtu\.be/.test(u)) return 'YouTube';
    if (/vimeo/.test(u)) return 'Vimeo';
    if (/dailymotion/.test(u)) return 'Dailymotion';
    if (/twitch/.test(u)) return 'Twitch';
    return 'Embed';
  }
  if (item.videoUrl) {
    if (isHls(item.videoUrl)) return 'Stream ao vivo (.m3u8)';
    return 'Vídeo direto';
  }
  return 'Sem fonte';
}
