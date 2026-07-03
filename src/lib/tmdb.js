// Helper do TMDB usado APENAS no painel admin para autopreencher o formulário
// de upload (buscar título -> trazer poster, sinopse, ano). O catálogo em si
// NÃO usa o TMDB: ele mostra exclusivamente o conteúdo adicionado pelo admin.
import { TMDB_API_KEY, TMDB_BASE, TMDB_IMG } from '../config';

export const tmdbEnabled = !!TMDB_API_KEY;
const img = (p, size = 'w500') => (p ? `${TMDB_IMG}/${size}${p}` : null);

export async function searchTmdb(q) {
  if (!tmdbEnabled || !q) return [];
  try {
    const url = new URL(TMDB_BASE + '/search/multi');
    url.searchParams.set('api_key', TMDB_API_KEY);
    url.searchParams.set('language', 'pt-BR');
    url.searchParams.set('query', q);
    const r = await fetch(url.toString());
    if (!r.ok) throw new Error('tmdb');
    const j = await r.json();
    return (j.results || [])
      .filter((x) => x.media_type !== 'person' && (x.media_type === 'movie' || x.media_type === 'tv'))
      .slice(0, 12)
      .map((x) => ({
        tmdbId: x.id,
        type: x.media_type === 'tv' ? 'tv' : 'movie',
        title: x.title || x.name || 'Sem título',
        overview: x.overview || '',
        poster: img(x.poster_path),
        backdrop: img(x.backdrop_path, 'w1280'),
        year: ((x.release_date || x.first_air_date || '').slice(0, 4)),
        rating: x.vote_average ? Number(x.vote_average).toFixed(1) : null
      }));
  } catch {
    return [];
  }
}
