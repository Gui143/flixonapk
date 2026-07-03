import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import AgeRating from './AgeRating';

export default function Hero({ item }) {
  const nav = useNavigate();
  const { isInList, toggleList } = useAppData();
  if (!item) return null;

  const added = isInList(item.id);
  const typeLabel =
    item.type === 'movie' ? 'Filme' : item.type === 'tv' ? 'Série' : 'Anime';

  const watch = () => {
    nav(`/player/${item.id}`);
  };

  return (
    <div className="relative h-[58vh] min-h-[400px] -mx-8 -mt-8 mb-10">
      <img
        src={item.backdrop || item.poster}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-flixon-bg via-flixon-bg/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-flixon-bg via-flixon-bg/30 to-transparent" />

      <div className="relative h-full flex flex-col justify-end max-w-2xl p-8 pb-10">
        <span className="inline-flex items-center gap-1.5 self-start mb-3 px-2.5 py-1 rounded-full bg-flixon-violet/20 border border-flixon-violet/50 text-flixon-violet-light text-xs font-semibold">
          ★ Destaque do dia
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-shadow-hero mb-3">
          {item.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-flixon-muted mb-3">
          {item.ageRating && <AgeRating rating={item.ageRating} size={26} />}
          <span className="text-flixon-violet-light font-bold">★ {item.rating || '—'}</span>
          <span>{item.year}</span>
          <span className="px-1.5 py-0.5 border border-flixon-border rounded text-xs">
            {typeLabel}
          </span>
        </div>
        <p className="text-flixon-muted line-clamp-3 max-w-xl mb-5">{item.overview}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={watch}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-flixon-violet hover:bg-flixon-violet-light font-semibold transition-colors shadow-glow"
          >
            ▶ Assistir agora
          </button>
          <button
            onClick={() => nav(`/details/${item.type}/${item.id}`)}
            className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur font-semibold transition-colors"
          >
            Mais informações
          </button>
          <button
            onClick={() => toggleList(item)}
            className={
              'px-5 py-2.5 rounded-lg border font-semibold transition-colors ' +
              (added
                ? 'bg-flixon-violet/15 border-flixon-violet text-white'
                : 'bg-transparent border-flixon-border text-flixon-muted hover:text-white hover:border-white/40')
            }
          >
            {added ? '✓ Na Minha Lista' : '+ Minha Lista'}
          </button>
        </div>
      </div>
    </div>
  );
}
