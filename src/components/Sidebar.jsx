import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { colorHex } from '../lib/profiles';

const Icon = ({ name }) => {
  const p = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };
  switch (name) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" {...p}>
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    case 'catalog':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" {...p}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'search':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" {...p}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
    case 'list':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" {...p}>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      );
    case 'plans':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" {...p}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      );
    case 'admin':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" {...p}>
          <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 13.6H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4.7V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    default:
      return null;
  }
};

const Item = ({ to, icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ' +
      (isActive
        ? 'bg-flixon-violet/15 text-white border border-flixon-violet/40'
        : 'text-flixon-muted hover:text-white hover:bg-white/5 border border-transparent')
    }
  >
    <Icon name={icon} />
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const { activeProfile, clearActiveProfile } = useProfile();
  const nav = useNavigate();

  const initials = (activeProfile?.nome || '?').charAt(0).toUpperCase();
  const avatarColor = colorHex(activeProfile?.cor_avatar);

  return (
    <aside className="w-60 shrink-0 bg-flixon-surface border-r border-flixon-border flex flex-col h-full">
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <Item to="/" icon="home" label="Início" end />
        <Item to="/catalog" icon="catalog" label="Catálogo" />
        <Item to="/search" icon="search" label="Busca" />
        <Item to="/mylist" icon="list" label="Minha Lista" />
        <Item to="/plans" icon="plans" label="Planos" />
        {isAdmin && <Item to="/admin" icon="admin" label="Painel Admin" />}
        <Item to="/settings" icon="settings" label="Configurações" />
      </nav>

      <div className="p-3 border-t border-flixon-border">
        {/* Perfil ativo + trocar */}
        {activeProfile && (
          <button
            onClick={() => { clearActiveProfile(); nav('/profiles', { replace: true }); }}
            className="flex items-center gap-2 w-full px-2 py-2 mb-2 rounded-lg hover:bg-white/5 transition-colors text-left"
            title="Trocar de perfil"
          >
            {activeProfile.avatar_url ? (
              <img src={activeProfile.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: avatarColor }}>
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{activeProfile.nome}</div>
              {activeProfile.modo_infantil && <div className="text-[10px] text-flixon-violet-light">👶 Infantil</div>}
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-flixon-muted shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 10l5 5 5-5" />
            </svg>
          </button>
        )}
        <div className="px-3 py-1 mb-1">
          <div className="text-xs text-flixon-muted truncate">{user?.email}</div>
          {isAdmin && (
            <div className="text-[10px] text-flixon-violet-light font-semibold">
              ★ Administrador
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className="w-full text-sm text-flixon-muted hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
        >
          Sair da conta
        </button>
      </div>
    </aside>
  );
}
