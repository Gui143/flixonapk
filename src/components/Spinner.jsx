export default function Spinner({ label = 'Carregando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-9 h-9 border-2 border-flixon-violet/30 border-t-flixon-violet rounded-full animate-spin" />
      <p className="text-flixon-muted text-sm">{label}</p>
    </div>
  );
}
