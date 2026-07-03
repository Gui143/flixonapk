import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { colorHex } from '../lib/profiles';

// Barra de navegação inferior (mobile) — substitui a sidebar no Android.
export default function MobileNav() {
  const { isAdmin } = useAuth();
  const { activeProfile, clearActiveProfile } = useProfile();
  const nav = useNavigate();

  const item = ({ isActive }) =>
    'flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-[10px] font-medium transition-colors ' +
    (isActive ? 'text-flixon-violet-light' : 'text-flixon-muted');

  const initials = (activeProfile?.nome || '?').charAt(0).toUpperCase();

  return (
    <nav className="shrink-0 bg-flixon-surface border-t border-flixon-border flex items-center h-14">
      <NavLink to="/" end className={item}>
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
        Início
      </NavLink>
      <NavLink to="/catalog" className={item}>
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
        Catálogo
      </NavLink>
      <NavLink to="/search" className={item}>
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
        Busca
      </NavLink>
      <NavLink to="/mylist" className={item}>
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" /></svg>
        Lista
      </NavLink>
      {isAdmin ? (
        <NavLink to="/admin" className={item}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z" strokeLinejoin="round" /></svg>
          Admin
        </NavLink>
      ) : (
        <NavLink to="/settings" className={item}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 13.6H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4.7V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
          Config
        </NavLink>
      )}
      {/* Botão de trocar perfil */}
      <button
        onClick={() => { clearActiveProfile(); nav('/profiles', { replace: true }); }}
        className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-[10px] font-medium text-flixon-muted"
        title="Trocar perfil"
      >
        {activeProfile?.avatar_url ? (
          <img src={activeProfile.avatar_url} alt="" className="w-6 h-6 rounded-md object-cover" />
        ) : (
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: colorHex(activeProfile?.cor_avatar) }}>
            {initials}
          </div>
        )}
        Perfil
      </button>
    </nav>
  );
}
