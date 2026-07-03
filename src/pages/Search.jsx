import { useEffect, useRef, useState } from 'react';
import { useAppData, categoryLabel } from '../context/AppDataContext';
import ContentCard from '../components/ContentCard';

export default function Search() {
  const { searchContent, getContent } = useAppData();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const timer = useRef(null);
  const total = getContent().length;

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(() => {
      setResults(searchContent(q));
    }, 300);
    return () => clearTimeout(timer.current);
  }, [q]);

  return (
    <div className="h-full overflow-y-auto p-8 animate-fade-in">
      <h1 className="text-3xl font-extrabold mb-6">Busca</h1>

      <div className="relative mb-8 max-w-xl">
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-flixon-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar no seu catálogo..."
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-flixon-card border border-flixon-border focus:border-flixon-violet focus:outline-none focus:ring-2 focus:ring-flixon-violet/30 transition"
        />
      </div>

      {!q ? (
        <p className="text-flixon-muted">
          Digite para buscar entre {total} título{total === 1 ? '' : 's'} do catálogo.
        </p>
      ) : results.length === 0 ? (
        <p className="text-flixon-muted">Nenhum resultado para “{q}”.</p>
      ) : (
        <>
          <p className="text-sm text-flixon-muted mb-4">
            {results.length} resultado{results.length === 1 ? '' : 's'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map((it) => (
              <div key={it.id} className="w-full">
                <ContentCard item={it} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
