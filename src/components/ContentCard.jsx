import { useNavigate } from 'react-router-dom';
import AgeRating from './AgeRating';

export default function ContentCard({ item }) {
  const nav = useNavigate();
  if (!item) return null;
  return (
    <button
      onClick={() => nav(`/details/${item.id}`)}
      className="group text-left w-40 shrink-0 focus:outline-none"
    >
      {/* SEM transparência/gradient na TV Box - cor sólida */}
      <div className="relative rounded-lg overflow-hidden bg-neutral-900 aspect-[2/3] shadow-card transition-transform duration-300 group-hover:scale-105">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs p-2 text-center bg-neutral-900">
            {item.title}
          </div>
        )}
        {/* Classificação indicativa */}
        {item.ageRating && (
          <div className="absolute bottom-2 left-2">
            <AgeRating rating={item.ageRating} size={22} />
          </div>
        )}
        {item.rating && (
          <div className="absolute top-2 right-2 bg-black px-1.5 py-0.5 rounded text-[11px] font-bold text-flixon-violet-light flex items-center gap-0.5">
            ★ {item.rating}
          </div>
        )}
        {/* Overlay de hover - SEM gradient/transparência.
            TV Box renderiza bg-gradient como branco sólido.
            Usa display none/block no hover (CSS simples). */}
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-90 transition-opacity flex items-end p-3">
          <span className="text-white text-xs font-semibold">
            Ver detalhes →
          </span>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <div className="text-sm font-semibold truncate">{item.title}</div>
        <div className="text-xs text-neutral-400">
          {item.year || '—'}
        </div>
      </div>
    </button>
  );
}
