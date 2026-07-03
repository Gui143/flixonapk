import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import Hero from '../components/Hero';
import Carousel from '../components/Carousel';
import Spinner from '../components/Spinner';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { loading, library, getByCategory, getUpcoming, getTrending } = useAppData();
  const { isAdmin } = useAuth();

  const trending = useMemo(() => getTrending(), [getTrending]);
  const upcoming = useMemo(() => getUpcoming(), [getUpcoming]);
  const movies = useMemo(() => getByCategory('movie'), [getByCategory]);
  const series = useMemo(() => getByCategory('tv'), [getByCategory]);
  const anime = useMemo(() => getByCategory('anime'), [getByCategory]);
  const channels = useMemo(() => getByCategory('channel'), [getByCategory]);

  const featured = useMemo(
    () => library.find((c) => c.featured && !c.upcoming) || library.find((c) => !c.upcoming) || library[0],
    [library]
  );

  if (loading) {
    return (
      <div className="h-full p-8">
        <Spinner label="Carregando catálogo..." />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 animate-fade-in">
      {library.length === 0 ? (
        <EmptyState isAdmin={isAdmin} />
      ) : (
        <>
          {featured && <Hero item={featured} />}
          {trending.length > 0 && <Carousel title="🔥 Em Alta" items={trending} />}
          {upcoming.length > 0 && <Carousel title="🗓️ Em Breve" items={upcoming} />}
          {movies.length > 0 && <Carousel title="🎬 Filmes" items={movies} />}
          {series.length > 0 && <Carousel title="📺 Séries" items={series} />}
          {anime.length > 0 && <Carousel title="🌸 Animes" items={anime} />}
          {channels.length > 0 && <Carousel title="📡 Canais" items={channels} />}
          <div className="h-8" />
        </>
      )}
    </div>
  );
}

function EmptyState({ isAdmin }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <div className="w-20 h-20 rounded-2xl bg-flixon-card border border-flixon-border flex items-center justify-center mb-6 text-4xl">
        🎬
      </div>
      <h2 className="text-2xl font-bold mb-2">Seu catálogo está vazio</h2>
      <p className="text-flixon-muted max-w-md mb-6">
        Adicione filmes, séries e animes pelo Painel Admin. Eles aparecerão aqui automaticamente.
      </p>
      {isAdmin ? (
        <Link
          to="/admin"
          className="px-6 py-3 rounded-lg bg-flixon-violet hover:bg-flixon-violet-light font-semibold transition-colors shadow-glow"
        >
          ➕ Ir para o Painel Admin
        </Link>
      ) : (
        <p className="text-sm text-flixon-muted">Aguarde — o administrador ainda não adicionou conteúdos.</p>
      )}
    </div>
  );
}
