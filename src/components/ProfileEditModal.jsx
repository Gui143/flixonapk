import { useState, useRef } from 'react';
import {
  AVATAR_COLORS,
  colorHex,
  uploadAvatar,
  createProfile,
  updateProfile,
  deleteProfile,
  hashPin
} from '../lib/profiles';
import { useAuth } from '../context/AuthContext';

// Modal de criação/edição de perfil (estilo Netflix)
export default function ProfileEditModal({
  profile,        // null = criando novo | objeto = editando
  onClose,
  onSaved
}) {
  const { user } = useAuth();
  const isNew = !profile;

  const [nome, setNome] = useState(profile?.nome || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [corAvatar, setCorAvatar] = useState(profile?.cor_avatar || 'Roxo');
  const [modoInfantil, setModoInfantil] = useState(profile?.modo_infantil || false);
  const [pin, setPin] = useState(''); // sempre começa vazio ao editar
  const [usePin, setUsePin] = useState(!!profile?.pin);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const initials = (nome || '?').trim().charAt(0).toUpperCase();

  // Upload de avatar
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setError('');
    try {
      // se criando novo, salva primeiro sem avatar, depois faz upload
      let profId = profile?.id;
      if (!profId) {
        const created = await createProfile(user.id, {
          nome: nome || 'Novo Perfil',
          cor_avatar: corAvatar,
          modo_infantil: modoInfantil
        });
        profId = created.id;
        profile = created; // permite reusar
      }
      const url = await uploadAvatar(user.id, profId, file);
      await updateProfile(profId, { avatar_url: url });
      setAvatarUrl(url);
    } catch (e) {
      setError('Falha no upload da imagem.');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleRemovePhoto = async () => {
    setAvatarUrl(null);
    if (profile?.id) {
      try { await updateProfile(profile.id, { avatar_url: null }); } catch (e) {}
    }
  };

  const handleSave = async () => {
    setError('');
    if (!nome.trim()) {
      setError('Informe o nome do perfil.');
      return;
    }
    setSaving(true);
    try {
      const pinHash = usePin && pin.length === 4 ? await hashPin(pin) : (usePin ? profile?.pin : null);

      if (profile?.id) {
        await updateProfile(profile.id, {
          nome: nome.trim(),
          avatar_url: avatarUrl,
          cor_avatar: corAvatar,
          modo_infantil: modoInfantil,
          pin: pinHash
        });
      } else {
        await createProfile(user.id, {
          nome: nome.trim(),
          avatar_url: avatarUrl,
          cor_avatar: corAvatar,
          modo_infantil: modoInfantil,
          pin: pinHash
        });
      }
      onSaved();
    } catch (e) {
      setError('Erro ao salvar perfil.');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!profile?.id) { onClose(); return; }
    if (!confirm(`Excluir o perfil "${profile.nome}" permanentemente?`)) return;
    try {
      await deleteProfile(profile.id);
      onSaved();
    } catch (e) {
      setError('Erro ao excluir perfil.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={onClose}>
      <div
        className="bg-flixon-card border border-flixon-border rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-5">{isNew ? 'Adicionar perfil' : 'Editar perfil'}</h2>

        {/* Foto de perfil */}
        <div className="flex flex-col items-center mb-5">
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden mb-3 group">
            {avatarUrl ? (
              <img src={avatarUrl} alt={nome} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-4xl font-extrabold text-white"
                style={{ backgroundColor: colorHex(corAvatar) }}
              >
                {initials}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {uploading ? 'Enviando...' : 'Trocar PNG'}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors"
              >
                Remover foto
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {/* Seletor de cor */}
        <div className="mb-4">
          <label className="block text-xs text-flixon-muted mb-2">Cor do avatar</label>
          <div className="flex gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCorAvatar(c.id)}
                className={
                  'w-9 h-9 rounded-full transition-all ' +
                  (corAvatar === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-flixon-card scale-110' : 'opacity-70 hover:opacity-100')
                }
                style={{ backgroundColor: c.hex }}
                title={c.id}
              />
            ))}
          </div>
        </div>

        {/* Nome */}
        <div className="mb-4">
          <label className="block text-xs text-flixon-muted mb-1.5">Nome</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={20}
            placeholder="Nome do perfil"
            className="w-full px-3 py-2.5 rounded-lg bg-flixon-bg border border-flixon-border focus:border-flixon-violet focus:outline-none text-sm"
            autoFocus
          />
        </div>

        {/* Modo Infantil */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-flixon-bg border border-flixon-border">
          <div>
            <div className="text-sm font-medium">👶 Modo Infantil</div>
            <p className="text-xs text-flixon-muted">Exibe apenas conteúdo livre e 10 anos.</p>
          </div>
          <button
            type="button"
            onClick={() => setModoInfantil(!modoInfantil)}
            className={'relative w-11 h-6 rounded-full transition-colors shrink-0 ' + (modoInfantil ? 'bg-flixon-violet' : 'bg-flixon-border')}
          >
            <span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ' + (modoInfantil ? 'translate-x-[22px]' : 'translate-x-0.5')} />
          </button>
        </div>

        {/* PIN */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-flixon-muted">🔒 PIN de 4 dígitos (opcional)</label>
            <button
              type="button"
              onClick={() => setUsePin(!usePin)}
              className={'relative w-11 h-6 rounded-full transition-colors shrink-0 ' + (usePin ? 'bg-flixon-violet' : 'bg-flixon-border')}
            >
              <span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ' + (usePin ? 'translate-x-[22px]' : 'translate-x-0.5')} />
            </button>
          </div>
          {usePin && (
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder={profile?.pin ? '•••• (digite novo p/ trocar)' : '4 dígitos'}
              className="w-32 px-3 py-2 rounded-lg bg-flixon-bg border border-flixon-border focus:border-flixon-violet focus:outline-none text-sm tracking-[0.5em] text-center"
            />
          )}
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {/* Botões */}
        <div className="flex items-center gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              title="Excluir perfil"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 font-semibold text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg bg-flixon-violet hover:bg-flixon-violet-light disabled:opacity-60 font-semibold text-sm transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
