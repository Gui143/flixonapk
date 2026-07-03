-- ═══════════════════════════════════════════════════════════
--  FLIXON — Sistema de MULTIPERFIL (estilo Netflix)
--
--  COMO USAR:
--  1. Supabase → SQL Editor → cole TODO este arquivo → Run
--  2. Pronto! Perfis e storage de avatares criados.
-- ═══════════════════════════════════════════════════════════

-- ── Tabela de perfis (vários por conta de usuário) ──
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  avatar_url     TEXT DEFAULT NULL,
  cor_avatar     TEXT DEFAULT 'Roxo',
  modo_infantil  BOOLEAN DEFAULT false,
  pin            TEXT DEFAULT NULL,           -- hash SHA-256 do PIN de 4 dígitos
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ── RLS: cada usuário só acessa os seus perfis ──
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read"  ON profiles;
DROP POLICY IF EXISTS "profiles_write" ON profiles;
CREATE POLICY "profiles_read"  ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_write" ON profiles FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Storage: bucket público para avatares ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ── Storage policies ──
DROP POLICY IF EXISTS "avatars_read"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;

CREATE POLICY "avatars_read"   ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
