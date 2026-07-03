import { useAppData } from '../context/AppDataContext';
import ContentCard from '../components/ContentCard';

export default function MyList() {
  const { mylist, library } = useAppData();

  const items = library.filter((c) => mylist.includes(c.id));

  return (
    <div className="h-full overflow-y-auto p-8 animate-fade-in">
      <h1 className="text-3xl font-extrabold mb-6">Minha Lista</h1>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-flixon-card border border-flixon-border flex items-center justify-center mb-4 text-3xl">📌</div>
          <p className="text-flixon-muted">Sua lista está vazia.</p>
          <p className="text-flixon-muted text-sm">Adicione conteúdos usando o botão "+".</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((it) => (
            <div key={it.id} className="w-full">
              <ContentCard item={it} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
