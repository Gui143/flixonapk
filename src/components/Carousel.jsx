import { useRef } from 'react';
import ContentCard from './ContentCard';

export default function Carousel({ title, items }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 620, behavior: 'smooth' });

  if (!items?.length) return null;
  return (
    <section className="mb-9">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg md:text-xl font-bold tracking-tight">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll(-1)}
            className="w-8 h-8 rounded-full bg-flixon-card border border-flixon-border hover:bg-flixon-card-hover flex items-center justify-center transition-colors"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-8 h-8 rounded-full bg-flixon-card border border-flixon-border hover:bg-flixon-card-hover flex items-center justify-center transition-colors"
            aria-label="Próximo"
          >
            ›
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 px-1"
      >
        {items.map((it) => (
          <ContentCard key={it.type + '-' + it.id} item={it} />
        ))}
      </div>
    </section>
  );
}
