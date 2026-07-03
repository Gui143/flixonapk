// ─────────────────────────────────────────────────────────────
//  Sistema de Multiperfil (CRUD + avatar upload + PIN)
// ─────────────────────────────────────────────────────────────
import { supabase } from './supabase';

// Cores disponíveis para o avatar (quando não tem foto)
export const AVATAR_COLORS = [
  { id: 'Vermelho', hex: '#EF4444' },
  { id: 'Azul', hex: '#3B82F6' },
  { id: 'Ciano', hex: '#06B6D4' },
  { id: 'Amarelo', hex: '#EAB308' },
  { id: 'Verde', hex: '#22C55E' },
  { id: 'Roxo', hex: '#7C3AED' }
];

export function colorHex(id) {
  return AVATAR_COLORS.find((c) => c.id === id)?.hex || '#7C3AED';
}

// ── Hash do PIN (SHA-256) ──
export async function hashPin(pin) {
  if (!pin) return null;
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode('flixon-pin-salt::' + pin));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
export async function verifyPin(pin, hash) {
  if (!hash) return true;
  if (!pin) return false;
  return (await hashPin(pin)) === hash;
}

// ── CRUD ──
export async function listProfiles(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createProfile(userId, profileData) {
  const payload = {
    user_id: userId,
    nome: profileData.nome || 'Novo Perfil',
    avatar_url: profileData.avatar_url || null,
    cor_avatar: profileData.cor_avatar || 'Roxo',
    modo_infantil: !!profileData.modo_infantil,
    pin: profileData.pin || null
  };
  const { data, error } = await supabase
    .from('profiles')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(id, patch) {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProfile(id) {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
}

// ── Upload de avatar ──
export async function uploadAvatar(userId, profileId, file) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `${userId}/${profileId}.${ext}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // adiciona cache-buster para forçar recarregamento
  return data.publicUrl + '?t=' + Date.now();
}
