import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppData, categoryLabel } from '../context/AppDataContext';
import { describeSource } from '../lib/embed';
import { sanitizeText } from '../lib/security';
import { useAuth } from '../context/AuthContext';
import AgeRating from '../components/AgeRating';

export default function Details() {
  const { id } = useParams();
  const nav = useNavigate();
  const { getContentById, isInList, toggleList, removeContent, episodeCount, castVote, getVote } = useAppData();
  const { isAdmin } = useAuth();
  const item = getContentById(id);

  const [openSeason, setOpenSeason] = useState(null);
  const vote = getVote(id);

  useEffect(() => {
    if (item?.seasons?.length) setOpenSeason(item.seasons[0].id);
  }, [id, item]);

  // Guarda o voto no servidor (via contexto)
  const handleVote = (val) => {
    castVote(id, val);
  };

  if (!item) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="text-5xl mb-4">🎬</div>
        <p className="text-flixon-muted mb-4">Conteúdo não encontrado.</p>
        <Link to="/catalog" className="text-flixon-violet-light hover:underline font-semibold">
          ← Voltar ao catálogo
        </Link>
      </div>
    );
  }

  const added = isInList(item.id);
  const isSeries = item.type === 'tv' || item.type === 'anime';
  const seasons = item.seasons || [];
  const totalEps = episodeCount(item.id);
  const hasEpisodes = totalEps > 0;
  const hasSingleSource = !!(item.embedUrl || item.videoUrl);
  const canPlay = hasEpisodes || hasSingleSource;
  const firstEp = hasEpisodes ? seasons.find((s) => s.episodes?.length)?.episodes?.[0] : null;

  return (
    <div className="h-full overflow-y-auto animate-fade-in">
      <div className="relative h-[46vh] min-h-[320px]">
        <img
          src={item.backdrop || item.poster}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-flixon-bg via-flixon-bg/60 to-transparent" />
      </div>

      <div className="px-8 -mt-32 relative pb-10">
        <div className="flex flex-col md:flex-row gap-6">
          <img
            src={item.poster}
            alt={item.title}
            className="w-40 md:w-48 rounded-xl shadow-card border border-flixon-border shrink-0 hidden md:block"
            onError={(e) => (e.target.style.opacity = 0)}
          />
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold text-shadow-hero mb-3">
              {sanitizeText(item.title)}
            </h1>

            {/* ── Linha de metadados ── */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-flixon-muted mb-4">
              {item.ageRating && <AgeRating rating={item.ageRating} size={28} />}
              {item.rating && (
                <span className="text-flixon-violet-light font-bold">★ {item.rating}</span>
              )}
              {item.year && <span>{item.year}</span>}
              <span className="px-1.5 py-0.5 border border-flixon-border rounded text-xs">
                {categoryLabel(item.type)}
              </span>
              {isSeries && hasEpisodes && (
                <span className="text-flixon-muted">
                  {seasons.length} temporada{seasons.length === 1 ? '' : 's'} • {totalEps} ep.
                </span>
              )}
              {(item.genres || []).map((g, i) => (
                <span key={i} className="text-flixon-muted">{g}</span>
              ))}
            </div>

            {/* ── Botões de interação ── */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {canPlay ? (
                <button
                  onClick={() =>
                    nav(firstEp ? `/player/${item.id}/${firstEp.id}` : `/player/${item.id}`)
                  }
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-flixon-violet hover:bg-flixon-violet-light font-semibold transition-colors shadow-glow"
                >
                  ▶ Assistir
                </button>
              ) : (
                <span className="px-5 py-3 rounded-lg bg-flixon-card border border-flixon-border text-flixon-muted text-sm">
                  Sem fonte de vídeo configurada
                </span>
              )}

              {/* Botão circular + (Minha Lista) */}
              <button
                onClick={() => toggleList(item)}
                title={added ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
                className={
                  'w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all ' +
                  (added
                    ? 'bg-flixon-violet border-flixon-violet text-white shadow-glow'
                    : 'border-flixon-border text-flixon-muted hover:text-white hover:border-white/40')
                }
              >
                {added ? (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
              </button>

              {/* Polegar para cima (Like) */}
              <button
                onClick={() => castVote('like')}
                title="Gostei"
                className={
                  'w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all ' +
                  (vote === 'like'
                    ? 'bg-flixon-violet border-flixon-violet text-white shadow-glow'
                    : 'border-flixon-border text-flixon-muted hover:text-white hover:border-white/40')
                }
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill={vote === 'like' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" />
                </svg>
              </button>

              {/* Polegar para baixo (Dislike) */}
              <button
                onClick={() => handleVote('dislike')}
                title="Não gostei"
                className={
                  'w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all ' +
                  (vote === 'dislike'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'border-flixon-border text-flixon-muted hover:text-white hover:border-white/40')
                }
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill={vote === 'dislike' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88z" />
                </svg>
              </button>

              {isAdmin && (
                <>
                  <Link
                    to={`/admin?edit=${item.id}`}
                    className="ml-auto px-5 py-2.5 rounded-lg border border-flixon-border text-flixon-muted hover:text-white hover:border-white/40 font-semibold text-sm"
                  >
                    ✏️ Editar
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`Remover "${item.title}" do catálogo?`)) {
                        removeContent(item.id);
                        nav('/catalog');
                      }
                    }}
                    className="px-5 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-semibold text-sm"
                  >
                    🗑 Remover
                  </button>
                </>
              )}
            </div>

            <h3 className="text-sm font-bold text-flixon-muted uppercase tracking-wide mb-2">
              Sinopse
            </h3>
            <p className="text-flixon-muted leading-relaxed max-w-3xl whitespace-pre-line">
              {sanitizeText(item.overview) || 'Sem sinopse.'}
            </p>

            <div className="mt-6 text-xs text-flixon-muted">
              Fonte: {describeSource(item)}
            </div>
          </div>
        </div>

        {/* Temporadas / Episódios */}
        {isSeries && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Episódios</h3>
              {isAdmin && (
                <Link
                  to={`/admin?edit=${item.id}`}
                  className="text-sm text-flixon-violet-light hover:underline font-semibold"
                >
                  Gerenciar episódios →
                </Link>
              )}
            </div>

            {!hasEpisodes ? (
              <p className="text-flixon-muted text-sm">
                Nenhum episódio cadastrado. {isAdmin && 'Adicione pelo Painel Admin.'}
              </p>
            ) : (
              <div className="space-y-2 max-w-3xl">
                {seasons.map((s) => (
                  <div key={s.id} className="bg-flixon-card border border-flixon-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenSeason(openSeason === s.id ? null : s.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <span className="font-semibold">{s.title || `Temporada ${s.number}`}</span>
                      <span className="text-sm text-flixon-muted">
                        {s.episodes?.length || 0} ep. {openSeason === s.id ? '▲' : '▼'}
                      </span>
                    </button>
                    {openSeason === s.id && (
                      <div className="divide-y divide-flixon-border">
                        {(s.episodes || []).map((e) => {
                          const hasSrc = !!(e.embedUrl || e.videoUrl || e.dubLegUrl);
                          return (
                            <button
                              key={e.id}
                              onClick={() => hasSrc && nav(`/player/${item.id}/${e.id}`)}
                              disabled={!hasSrc}
                              className={
                                'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ' +
                                (hasSrc ? 'hover:bg-white/5' : 'opacity-40 cursor-not-allowed')
                              }
                            >
                              <span className="w-7 h-7 shrink-0 rounded bg-flixon-bg flex items-center justify-center text-xs font-bold">
                                {e.number}
                              </span>
                              <span className="flex-1 truncate">
                                {e.title || `Episódio ${e.number}`}
                              </span>
                              {e.duration && (
                                <span className="text-xs text-flixon-muted">{e.duration}</span>
                              )}
                              {hasSrc && <span className="text-flixon-violet-light text-xs">▶</span>}
                            </button>
                          );
                        })}
                        {(s.episodes || []).length === 0 && (
                          <p className="px-4 py-3 text-xs text-flixon-muted">Sem episódios nesta temporada.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
