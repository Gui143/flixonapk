// ─────────────────────────────────────────────────────────────
//  Configuração da aplicação
// ─────────────────────────────────────────────────────────────

// Cole aqui sua chave do TMDB (gratuita): https://www.themoviedb.org/settings/api
// Você também pode definir via .env:  VITE_TMDB_API_KEY=sua_chave
export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
export const TMDB_BASE = 'https://api.themoviedb.org/3';
export const TMDB_IMG = 'https://image.tmdb.org/t/p';
export const JIKAN_BASE = 'https://api.jikan.moe/v4';

// Conta admin (já configurada conforme briefing)
export const ADMIN_EMAIL = 'reivcontato@gmail.com';

export const APP_NAME = 'FlixOn';
export const APP_VERSION = '1.0.0';

// Vídeo de demonstração do player (domínio público / sample)
export const SAMPLE_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export const TMDB_GENRES = {
  movie: [
    { id: 28, name: 'Ação' },
    { id: 12, name: 'Aventura' },
    { id: 16, name: 'Animação' },
    { id: 35, name: 'Comédia' },
    { id: 18, name: 'Drama' },
    { id: 27, name: 'Terror' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Ficção' }
  ],
  tv: [
    { id: 10759, name: 'Ação & Aventura' },
    { id: 35, name: 'Comédia' },
    { id: 18, name: 'Drama' },
    { id: 80, name: 'Crime' },
    { id: 9648, name: 'Mistério' },
    { id: 10765, name: 'Sci-Fi & Fantasia' }
  ]
};
