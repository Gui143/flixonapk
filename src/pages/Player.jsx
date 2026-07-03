import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppData, categoryLabel } from '../context/AppDataContext';
import { normalizeEmbedUrl, isDirectVideo, describeSource } from '../lib/embed';
import { isLikelyPhishingUrl, isSafeEmbedUrl } from '../lib/security';
import VideoPlayer from '../components/VideoPlayer';
import Logo from '../components/Logo';

export default function Player() {
  const { id, episodeId } = useParams();
  const nav = useNavigate();
  const { getContentById } = useAppData();
  const item = getContentById(id);

  const [showEpisodes, setShowEpisodes] = useState(true);

  const episode = useMemo(() => {
    if (!item?.seasons || !episodeId) return null;
    for (const s of item.seasons) {
      const e = (s.episodes || []).find((x) => x.id === episodeId);
      if (e) return { ...e, seasonTitle: s.title, seasonId: s.id };
    }
    return null;
  }, [item, episodeId]);

  const source = useMemo(() => {
    if (episode) {
      if (episode.embedUrl || episode.videoUrl) {
        const url = episode.embedUrl || episode.videoUrl;
        return { mode: isDirectVideo(url) ? 'link' : 'embed', url };
      }
      if (episode.dubLegUrl) {
        return { mode: isDirectVideo(episode.dubLegUrl) ? 'link' : 'embed', url: episode.dubLegUrl };
      }
    }
    if (item?.embedUrl || item?.videoUrl) {
      const url = item.embedUrl || item.videoUrl;
      return { mode: isDirectVideo(url) ? 'link' : 'embed', url };
    }
    return null;
  }, [item, episode]);

  useEffect(() => {
    if (item && source) {
      // simples log de uso (sem coleta externa)
    }
  }, [id, episode, source, item]);

  if (!item) return <InvalidState message="Conteúdo não encontrado." nav={nav} />;

  const raw = source?.url;
  if (raw && isLikelyPhishingUrl(raw))
    return <InvalidState message="Fonte bloqueada (possível phishing)." nav={nav} />;

  // Se marcou embed mas colou link de vídeo direto, toca no player nativo
  const effectiveMode =
    source?.mode === 'embed' && raw && isDirectVideo(raw) ? 'link' : source?.mode;

  const titleNow = episode
    ? `${item.title} • ${episode.seasonTitle} • Ep. ${episode.number}${episode.title ? ' — ' + episode.title : ''}`
    : item.title;

  const isSeries = item.type === 'tv' || item.type === 'anime';
  const hasEpisodes =
    isSeries && (item.seasons || []).some((s) => (s.episodes || []).length > 0);

  return (
    <div className="h-full flex bg-black">
      <div className="flex-1 relative">
        {!source ? (
          <InvalidState
            message="Este conteúdo não possui fonte de vídeo configurada."
            inline
            nav={nav}
          />
        ) : effectiveMode === 'link' ? (
          <VideoPlayer
            src={normalizeEmbedUrl(raw) || raw}
            title={titleNow}
            poster={item.backdrop || item.poster}
            type={item.type}
            id={id}
            episodeId={episode?.id}
          />
        ) : (
          <EmbedPlayer
            rawUrl={raw}
            title={titleNow}
            nav={nav}
            onToggleList={() => setShowEpisodes((v) => !v)}
            showListBtn={hasEpisodes}
          />
        )}
      </div>

      {hasEpisodes && showEpisodes && (
        <EpisodeList
          item={item}
          currentEpisodeId={episodeId}
          onPick={(eid) => nav(`/player/${id}/${eid}`)}
          onClose={() => setShowEpisodes(false)}
        />
      )}
    </div>
  );
}

// ── Player de EMBED ──
// O Electron (main.js) remove X-Frame-Options / frame-ancestors de todas as
// respostas, então o iframe do player carrega normalmente dentro do app.
function EmbedPlayer({ rawUrl, title, nav, onToggleList, showListBtn }) {
  const embedUrl = normalizeEmbedUrl(rawUrl);
  const [loading, setLoading] = useState(true);

  // Timeout de segurança: esconde o spinner após 6s mesmo se onLoad
  // não disparar (comum no Android WebView com players que fazem
  // redirects internos como o fembed).
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 6000);
    return () => clearTimeout(t);
  }, [loading]);

  if (!embedUrl || !isSafeEmbedUrl(embedUrl)) {
    return (
      <InvalidState message="Embed inválido. Verifique a URL no painel admin." inline nav={nav} />
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
          <div className="w-10 h-10 border-2 border-flixon-violet/30 border-t-flixon-violet rounded-full animate-spin" />
          <p className="text-flixon-muted text-sm">Carregando...</p>
        </div>
      )}

      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full"
        onLoad={() => setLoading(false)}
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture; gyroscope; accelerometer; display-capture"
        allowFullScreen
      />

      {/* Barra superior (apenas Voltar + Episódios) */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => nav(-1)}
            className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-white/10 backdrop-blur text-sm font-semibold"
          >
            ← Voltar
          </button>
          {showListBtn && (
            <button
              onClick={onToggleList}
              className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-white/10 backdrop-blur text-sm font-semibold"
            >
              ☰ Episódios
            </button>
          )}
        </div>
        <span className="text-sm font-semibold truncate max-w-[60%] text-shadow-hero pr-2">
          {title}
        </span>
        <span className="w-10" />
      </div>
    </div>
  );
}

// ── Lista de episódios ──
function EpisodeList({ item, currentEpisodeId, onPick, onClose }) {
  return (
    <aside className="w-80 shrink-0 bg-flixon-bg border-l border-flixon-border flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-flixon-border">
        <div className="flex items-center gap-2">
          <Logo size={20} />
          <span className="font-bold text-sm truncate">Episódios</span>
        </div>
        <button onClick={onClose} className="text-flixon-muted hover:text-white text-lg leading-none">
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {(item.seasons || []).map((s) => (
          <div key={s.id} className="mb-4">
            <div className="px-2 py-1.5 text-xs font-bold text-flixon-muted uppercase tracking-wide">
              {s.title || `Temporada ${s.number}`}
            </div>
            {(s.episodes || []).map((e) => {
              const active = e.id === currentEpisodeId;
              const hasSrc = !!(e.embedUrl || e.videoUrl);
              return (
                <button
                  key={e.id}
                  onClick={() => hasSrc && onPick(e.id)}
                  disabled={!hasSrc}
                  className={
                    'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left text-sm transition-colors ' +
                    (active
                      ? 'bg-flixon-violet/20 border border-flixon-violet/50'
                      : hasSrc
                      ? 'hover:bg-white/5 border border-transparent'
                      : 'opacity-40 border border-transparent cursor-not-allowed')
                  }
                >
                  <span className="w-6 h-6 shrink-0 rounded bg-flixon-card flex items-center justify-center text-xs font-bold">
                    {e.number}
                  </span>
                  <span className="flex-1 truncate">
                    {e.title || `Episódio ${e.number}`}
                    {!hasSrc && <span className="block text-[10px] text-flixon-muted">sem fonte</span>}
                  </span>
                  {active && <span className="text-flixon-violet-light text-xs">▶</span>}
                </button>
              );
            })}
            {(s.episodes || []).length === 0 && (
              <p className="px-2 py-1 text-xs text-flixon-muted">Sem episódios.</p>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

function InvalidState({ message, inline, nav }) {
  return (
    <div
      className={
        (inline ? 'h-full ' : '') +
        'flex flex-col items-center justify-center text-center gap-4 p-8'
      }
    >
      <div className="text-5xl">🎬</div>
      <p className="text-flixon-muted max-w-sm">{message}</p>
      <button
        onClick={() => (nav ? nav(-1) : history.back())}
        className="px-5 py-2.5 rounded-lg bg-flixon-violet hover:bg-flixon-violet-light font-semibold"
      >
        ← Voltar
      </button>
    </div>
  );
}
