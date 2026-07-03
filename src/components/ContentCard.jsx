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
      <div className="relative rounded-lg overflow-hidden bg-flixon-card aspect-[2/3] shadow-card transition-all duration-300 group-hover:scale-105 group-hover:shadow-glow">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-flixon-muted text-xs p-2 text-center">
            {item.title}
          </div>
        )}
        {/* Classificação indicativa no canto inferior esquerdo */}
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
        {/* Overlay: sem backdrop-blur e sem bg-white/10 (TV Box não renderiza).
            Cor sólida escura fixa para legibilidade em qualquer WebView. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <span className="text-white text-xs font-semibold">
            Ver detalhes →
          </span>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <div className="text-sm font-semibold truncate">{item.title}</div>
        <div className="text-xs text-flixon-muted">
          {item.year || '—'}
        </div>
      </div>
    </button>
  );
}
