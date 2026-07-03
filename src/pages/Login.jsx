import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { APP_NAME } from '../config';

export default function Login() {
  const nav = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) nav('/', { replace: true });
  }, [isAuthenticated, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fn = mode === 'login' ? login : register;
    const res = await fn(email, password);
    setLoading(false);
    if (res.ok) {
      nav('/profiles', { replace: true });
    } else {
      setError(res.error || 'Algo deu errado.');
    }
  };

  return (
    <div className="h-screen w-full flex bg-flixon-bg overflow-hidden">
      <div className="hidden md:flex flex-1 relative items-center justify-center bg-gradient-to-br from-flixon-violet-dark via-flixon-bg to-flixon-bg p-12">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #7C3AED 0%, transparent 45%)' }} />
        <div className="relative text-center max-w-sm">
          <div className="flex justify-center mb-6">
            <Logo size={88} />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-3">{APP_NAME}</h1>
          <p className="text-flixon-muted text-lg">
            Filmes, séries e animes. Tudo em um só lugar, em alta qualidade.
          </p>
        </div>
      </div>

      <div className="w-full md:w-[460px] flex flex-col justify-center p-8 md:p-12">
        <div className="md:hidden flex items-center gap-2 mb-8">
          <Logo size={36} />
          <span className="text-2xl font-extrabold">{APP_NAME}</span>
        </div>

        <h2 className="text-2xl font-bold mb-1">
          {mode === 'login' ? 'Bem-vindo de volta' : 'Criar sua conta'}
        </h2>
        <p className="text-flixon-muted text-sm mb-6">
          {mode === 'login' ? 'Entre para continuar assistindo.' : 'Cadastre-se e comece agora.'}
        </p>

        <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z" />
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Contas salvas no servidor (Supabase) • autenticação segura
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-flixon-muted mb-1.5">E-mail</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-flixon-card border border-flixon-border focus:border-flixon-violet focus:outline-none focus:ring-2 focus:ring-flixon-violet/30 transition"
              placeholder="voce@email.com"
            />
          </div>
          <div>
            <label className="block text-sm text-flixon-muted mb-1.5">Senha</label>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-flixon-card border border-flixon-border focus:border-flixon-violet focus:outline-none focus:ring-2 focus:ring-flixon-violet/30 transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-flixon-violet hover:bg-flixon-violet-light disabled:opacity-60 font-semibold transition-colors shadow-glow"
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p className="text-sm text-flixon-muted text-center mt-6">
          {mode === 'login' ? 'Ainda não tem conta?' : 'Já possui conta?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-flixon-violet-light hover:underline font-semibold"
          >
            {mode === 'login' ? 'Criar conta' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  );
}
