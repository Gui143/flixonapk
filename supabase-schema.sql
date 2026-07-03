-- ═══════════════════════════════════════════════════════════
--  FLIXON — Schema do Banco de Dados (Supabase / PostgreSQL)
--
--  COMO USAR:
--  1. Abra seu projeto no Supabase
--  2. Vá em "SQL Editor" no menu lateral
--  3. Cole TODO este arquivo e clique em "Run"
--  4. Pronto! As tabelas e regras de segurança estão criadas.
-- ═══════════════════════════════════════════════════════════

-- ── Função auxiliar: verifica se o usuário atual é admin ──
-- Admin = email reivcontato@gmail.com
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(auth.jwt() ->> 'email', '') = 'reivcontato@gmail.com';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════
--  TABELAS
-- ═══════════════════════════════════════════════════════════

-- ── Conteúdo (filmes, séries, animes, canais) ──
CREATE TABLE IF NOT EXISTS content (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'movie'
              CHECK (type IN ('movie', 'tv', 'anime', 'channel')),
  poster      TEXT DEFAULT '',
  backdrop    TEXT DEFAULT '',
  year        TEXT DEFAULT '',
  rating      TEXT DEFAULT '',
  genres      TEXT[] DEFAULT '{}',
  overview    TEXT DEFAULT '',
  embed_url   TEXT DEFAULT '',
  video_url   TEXT DEFAULT '',
  featured    BOOLEAN DEFAULT false,
  upcoming    BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT true,    -- entra em alta automaticamente
  series_mode TEXT DEFAULT 'simple',
  age_rating  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Temporadas ──
CREATE TABLE IF NOT EXISTS seasons (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  number     INT DEFAULT 1,
  title      TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Episódios ──
CREATE TABLE IF NOT EXISTS episodes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id   UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  number      INT DEFAULT 1,
  title       TEXT DEFAULT '',
  duration    TEXT DEFAULT '',
  embed_url   TEXT DEFAULT '',
  video_url   TEXT DEFAULT '',
  dub_leg_url TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Minha Lista (por usuário) ──
CREATE TABLE IF NOT EXISTS mylist (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- ── Avaliações (like / dislike) ──
CREATE TABLE IF NOT EXISTS ratings (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  vote       TEXT NOT NULL CHECK (vote IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- ── Planos de assinatura ──
CREATE TABLE IF NOT EXISTS plans (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  price     NUMERIC DEFAULT 0,
  period    TEXT DEFAULT '/mês',
  quality   TEXT DEFAULT '',
  devices   INT DEFAULT 1,
  features  TEXT[] DEFAULT '{}',
  highlight BOOLEAN DEFAULT false
);

-- ── Plano do usuário ──
CREATE TABLE IF NOT EXISTS user_plans (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  plan_id    TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
--  DADOS PADRÃO (planos)
-- ═══════════════════════════════════════════════════════════
INSERT INTO plans (id, name, price, period, quality, devices, features, highlight) VALUES
  ('basic',    'Básico',    19.90, '/mês', 'HD 720p',      1, ARRAY['Catálogo completo','Qualidade HD 720p','1 tela simultânea','Sem anúncios'], false),
  ('standard', 'Standard',  39.90, '/mês', 'Full HD 1080p', 2, ARRAY['Catálogo completo','Qualidade Full HD','2 telas simultâneas','Download offline'], false),
  ('premium',  'Premium',   59.90, '/mês', '4K + HDR',      4, ARRAY['Catálogo completo','4K Ultra HD + HDR','4 telas simultâneas','Áudio espacial','Downloads ilimitados'], true)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
--  RLS (Row Level Security) — SEGURANÇA
-- ═══════════════════════════════════════════════════════════

-- Habilita RLS em todas as tabelas
ALTER TABLE content    ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons    ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mylist     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- ── CONTENT: todos podem ler, só admin escreve ──
DROP POLICY IF EXISTS "content_read"  ON content;
DROP POLICY IF EXISTS "content_write" ON content;
CREATE POLICY "content_read"  ON content FOR SELECT USING (true);
CREATE POLICY "content_write" ON content FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- ── SEASONS: todos podem ler, só admin escreve ──
DROP POLICY IF EXISTS "seasons_read"  ON seasons;
DROP POLICY IF EXISTS "seasons_write" ON seasons;
CREATE POLICY "seasons_read"  ON seasons FOR SELECT USING (true);
CREATE POLICY "seasons_write" ON seasons FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- ── EPISODES: todos podem ler, só admin escreve ──
DROP POLICY IF EXISTS "episodes_read"  ON episodes;
DROP POLICY IF EXISTS "episodes_write" ON episodes;
CREATE POLICY "episodes_read"  ON episodes FOR SELECT USING (true);
CREATE POLICY "episodes_write" ON episodes FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- ── MYLIST: cada usuário só acessa as suas ──
DROP POLICY IF EXISTS "mylist_read"  ON mylist;
DROP POLICY IF EXISTS "mylist_write" ON mylist;
CREATE POLICY "mylist_read"  ON mylist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mylist_write" ON mylist FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── RATINGS: cada usuário só acessa as suas ──
DROP POLICY IF EXISTS "ratings_read"  ON ratings;
DROP POLICY IF EXISTS "ratings_write" ON ratings;
CREATE POLICY "ratings_read"  ON ratings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ratings_write" ON ratings FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── PLANS: todos podem ler, só admin escreve ──
DROP POLICY IF EXISTS "plans_read"  ON plans;
DROP POLICY IF EXISTS "plans_write" ON plans;
CREATE POLICY "plans_read"  ON plans FOR SELECT USING (true);
CREATE POLICY "plans_write" ON plans FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- ── USER_PLANS: cada usuário só acessa o seu ──
DROP POLICY IF EXISTS "user_plans_read"  ON user_plans;
DROP POLICY IF EXISTS "user_plans_write" ON user_plans;
CREATE POLICY "user_plans_read"  ON user_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_plans_write" ON user_plans FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
--  PRONTO! As tabelas estão criadas e seguras.
--  Agora volte para o chat e o app já vai estar configurado.
-- ═══════════════════════════════════════════════════════════
