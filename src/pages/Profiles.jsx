import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { verifyPin, colorHex } from '../lib/profiles';
import ProfileEditModal from '../components/ProfileEditModal';
import PinInput from '../components/PinInput';
import Logo from '../components/Logo';
import Spinner from '../components/Spinner';

export default function Profiles() {
  const nav = useNavigate();
  const { profiles, loading, activeProfile, setActiveProfile, reload } = useProfile();

  const [editMode, setEditMode] = useState(false);
  const [modalProfile, setModalProfile] = useState(null); // null = fechado | {} = novo | obj = editando
  const [pinProfile, setPinProfile] = useState(null); // perfil pedindo PIN

  // Selecionar um perfil
  const selectProfile = async (p) => {
    if (editMode) {
      setModalProfile(p); // abrir editor
      return;
    }
    if (p.pin) {
      setPinProfile(p); // pedir PIN
      return;
    }
    setActiveProfile(p);
    nav('/', { replace: true });
  };

  // PIN correto
  const onPinCorrect = () => {
    setActiveProfile(pinProfile);
    setPinProfile(null);
    nav('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-flixon-bg">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-flixon-bg px-6 animate-fade-in">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <Logo size={36} />
        <span className="text-2xl font-extrabold">FlixOn</span>
      </div>

      {/* Título */}
      <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-center">
        {editMode ? 'Gerenciar perfis' : 'Quem está assistindo?'}
      </h1>

      {/* Lista de perfis */}
      <div className="flex flex-wrap items-start justify-center gap-6 mt-8 mb-8 max-w-3xl">
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => selectProfile(p)}
            className="group flex flex-col items-center gap-2 transition-all hover:scale-105"
          >
            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={p.nome} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-extrabold text-white"
                  style={{ backgroundColor: colorHex(p.cor_avatar) }}
                >
                  {(p.nome || '?').charAt(0).toUpperCase()}
                </div>
              )}
              {/* Ícone de lápis no modo edição */}
              {editMode && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                  </svg>
                </div>
              )}
              {/* Selo modo infantil */}
              {p.modo_infantil && !editMode && (
                <div className="absolute bottom-1 right-1 bg-flixon-violet rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  👶
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-flixon-muted group-hover:text-white transition-colors max-w-[7rem] truncate">
              {p.nome}
            </span>
          </button>
        ))}

        {/* Botão + Adicionar Perfil (se < 5 perfis) */}
        {profiles.length < 5 && !editMode && (
          <button
            onClick={() => setModalProfile({})}
            className="group flex flex-col items-center gap-2 transition-all hover:scale-105"
          >
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-2 border-dashed border-flixon-border group-hover:border-flixon-violet flex items-center justify-center transition-colors">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-flixon-muted group-hover:text-flixon-violet transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <span className="text-sm font-medium text-flixon-muted group-hover:text-white transition-colors">
              Adicionar Perfil
            </span>
          </button>
        )}
      </div>

      {/* Botão Gerenciar / Concluído */}
      {profiles.length > 0 && (
        <button
          onClick={() => setEditMode(!editMode)}
          className={
            'px-6 py-2 rounded-lg border-2 font-semibold text-sm transition-colors ' +
            (editMode
              ? 'border-flixon-violet bg-flixon-violet/15 text-white'
              : 'border-flixon-border text-flixon-muted hover:text-white hover:border-white/40')
          }
        >
          {editMode ? 'CONCLUÍDO' : 'GERENCIAR PERFIS'}
        </button>
      )}

      {/* Estado vazio */}
      {profiles.length === 0 && !loading && (
        <button
          onClick={() => setModalProfile({})}
          className="px-6 py-3 rounded-lg bg-flixon-violet hover:bg-flixon-violet-light font-semibold transition-colors shadow-glow"
        >
          + Criar seu primeiro perfil
        </button>
      )}

      {/* Modal de edição/criação */}
      {modalProfile && (
        <ProfileEditModal
          profile={modalProfile.id ? modalProfile : null}
          onClose={() => setModalProfile(null)}
          onSaved={() => {
            setModalProfile(null);
            reload();
          }}
        />
      )}

      {/* PIN Input */}
      {pinProfile && (
        <PinInput
          profile={pinProfile}
          onCorrect={onPinCorrect}
          onCancel={() => setPinProfile(null)}
        />
      )}
    </div>
  );
}
