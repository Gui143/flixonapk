import { useAuth } from '../context/AuthContext';
import { APP_VERSION } from '../config';

function Card({ title, desc, children }) {
  return (
    <section className="bg-flixon-card border border-flixon-border rounded-xl p-5 mb-5">
      <h2 className="text-lg font-bold mb-1">{title}</h2>
      {desc && <p className="text-flixon-muted text-sm mb-4">{desc}</p>}
      {children}
    </section>
  );
}

export default function Settings() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="h-full overflow-y-auto p-8 animate-fade-in max-w-3xl">
      <h1 className="text-3xl font-extrabold mb-6">Configurações</h1>

      <Card title="Conta">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-flixon-muted text-sm">Conectado como</div>
            <div className="font-semibold">{user?.email}</div>
            {isAdmin && <span className="inline-block mt-1 text-xs text-flixon-violet-light font-semibold">★ Conta administradora</span>}
          </div>
          <button onClick={logout} className="px-4 py-2 rounded-lg border border-flixon-border text-flixon-muted hover:text-white hover:border-white/40 font-semibold text-sm transition-colors">Sair</button>
        </div>
      </Card>

      <Card title="Privacidade">
        <div className="text-sm text-flixon-muted leading-relaxed">
          <p className="mb-2"><strong className="text-white">O FlixOn não coleta dados de uso.</strong></p>
          <p>Nenhum dado de navegação, cliques ou reprodução é coletado. Seus dados (Minha Lista, avaliações) ficam no servidor Supabase, atrelados à sua conta.</p>
        </div>
      </Card>

      <Card title="Sobre">
        <div className="text-sm text-flixon-muted space-y-1">
          <div>FlixOn • versão {APP_VERSION}</div>
          <div>Backend: Supabase</div>
          <div>Conteúdo gerenciado pelo painel admin</div>
        </div>
      </Card>
    </div>
  );
}
