import { useState, useMemo } from 'react';
import { useAppData, CATEGORIES, categoryPlural } from '../context/AppDataContext';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ContentCard from '../components/ContentCard';

export default function Catalog() {
  const { catalogContent } = useAppData();
  const { isAdmin } = useAuth();
  const [type, setType] = useState('all');
  const [genre, setGenre] = useState('all');

  // Canais ficam isolados: só aparecem quando o filtro "Canais" está ativo.
  // "Todos" mostra filmes/séries/animes (sem canais) para não bagunçar.
  const visible = useMemo(() => {
    if (type === 'channel') {
      return catalogContent.filter((c) => c.type === 'channel');
    }
    if (type === 'all') {
      return catalogContent.filter((c) => c.type !== 'channel');
    }
    return catalogContent.filter((c) => c.type === type);
  }, [catalogContent, type]);

  const genres = useMemo(
    () =>
      Array.from(
        new Set(visible.flatMap((i) => i.genres || []))
      ).sort(),
    [visible]
  );

  const filtered = useMemo(
    () => (genre === 'all' ? visible : visible.filter((i) => (i.genres || []).includes(genre))),
    [visible, genre]
  );

  return (
    <div className="h-full overflow-y-auto p-8 animate-fade-in">
      <h1 className="text-3xl font-extrabold mb-6">Catálogo</h1>

      {catalogContent.length === 0 ? (
        <EmptyCatalog isAdmin={isAdmin} />
      ) : (
        <>
          {/* Filtro de categoria */}
          <div className="flex flex-wrap gap-2 mb-4">
            <FilterBtn active={type === 'all'} onClick={() => { setType('all'); setGenre('all'); }}>
              Todos
            </FilterBtn>
            {CATEGORIES.map((c) => (
              <FilterBtn
                key={c.id}
                active={type === c.id}
                onClick={() => { setType(c.id); setGenre('all'); }}
              >
                {categoryPlural(c.id)}
              </FilterBtn>
            ))}
          </div>

          {/* Filtro de gênero */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Chip active={genre === 'all'} onClick={() => setGenre('all')}>Todos</Chip>
              {genres.map((g) => (
                <Chip key={g} active={genre === g} onClick={() => setGenre(g)}>
                  {g}
                </Chip>
              ))}
            </div>
          )}

          {type === 'channel' && (
            <p className="text-sm text-flixon-muted mb-4">
              📡 Canais ficam isolados em sua própria seção.
            </p>
          )}

          {filtered.length === 0 ? (
            <p className="text-flixon-muted">Nenhum título neste filtro.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map((it) => (
                <div key={it.id} className="w-full">
                  <ContentCard item={it} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const FilterBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={
      'px-4 py-2 rounded-lg text-sm font-semibold transition-colors ' +
      (active ? 'bg-flixon-violet text-white' : 'bg-flixon-card text-flixon-muted hover:text-white')
    }
  >
    {children}
  </button>
);

const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={
      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ' +
      (active
        ? 'bg-flixon-violet-light/20 text-white border-flixon-violet/50'
        : 'bg-flixon-card text-flixon-muted hover:text-white border border-flixon-border')
    }
  >
    {children}
  </button>
);

function EmptyCatalog({ isAdmin }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <div className="w-16 h-16 rounded-full bg-flixon-card border border-flixon-border flex items-center justify-center mb-4 text-3xl">
        📭
      </div>
      <p className="text-flixon-muted mb-4">Nenhum conteúdo no catálogo ainda.</p>
      {isAdmin && (
        <Link
          to="/admin"
          className="px-5 py-2.5 rounded-lg bg-flixon-violet hover:bg-flixon-violet-light font-semibold transition-colors"
        >
          ➕ Adicionar conteúdo
        </Link>
      )}
    </div>
  );
}
