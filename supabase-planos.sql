-- ═══════════════════════════════════════════════════════════
--  FLIXON — Sistema de Planos + Trial + Admin
--  Cole no SQL Editor do Supabase e clique Run.
-- ═══════════════════════════════════════════════════════════

-- ── Atualiza tabela user_plans ──
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS assigned_by TEXT DEFAULT 'user';

-- ── "basic" vira Teste de 7 dias ──
UPDATE plans SET
  name = 'Teste',
  price = 0,
  period = '/7 dias',
  quality = 'HD 720p',
  devices = 1,
  features = ARRAY['Catálogo completo','Qualidade HD 720p','1 tela simultânea','Teste de 7 dias','Apenas 1 vez por conta']
WHERE id = 'basic';

-- ── Função: admin define plano de qualquer usuário ──
CREATE OR REPLACE FUNCTION admin_set_user_plan(target_user UUID, plan TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  exp TIMESTAMPTZ;
BEGIN
  IF COALESCE(auth.jwt() ->> 'email', '') != 'reivcontato@gmail.com' THEN
    RETURN FALSE;
  END IF;

  IF plan = 'basic' THEN
    exp := now() + INTERVAL '7 days';
  ELSE
    exp := now() + INTERVAL '30 days';
  END IF;

  INSERT INTO user_plans (user_id, plan_id, expires_at, assigned_by, updated_at)
  VALUES (target_user, plan, exp, 'admin', now())
  ON CONFLICT (user_id) DO UPDATE
  SET plan_id = EXCLUDED.plan_id,
      expires_at = EXCLUDED.expires_at,
      assigned_by = EXCLUDED.assigned_by,
      updated_at = now();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_set_user_plan(UUID, TEXT) TO authenticated;

-- ── Função: usuário assina plano próprio (com regra do trial) ──
CREATE OR REPLACE FUNCTION subscribe_plan(plan TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  exp TIMESTAMPTZ;
  uid UUID := auth.uid();
  already_used BOOLEAN;
BEGIN
  IF uid IS NULL THEN RETURN FALSE; END IF;

  -- Trial só pode ser assinado uma vez
  IF plan = 'basic' THEN
    SELECT EXISTS(SELECT 1 FROM user_plans WHERE user_id = uid AND plan_id = 'basic')
    INTO already_used;
    IF already_used THEN RETURN FALSE; END IF;
    exp := now() + INTERVAL '7 days';
  ELSE
    exp := now() + INTERVAL '30 days';
  END IF;

  INSERT INTO user_plans (user_id, plan_id, expires_at, assigned_by, updated_at)
  VALUES (uid, plan, exp, 'user', now())
  ON CONFLICT (user_id) DO UPDATE
  SET plan_id = EXCLUDED.plan_id,
      expires_at = EXCLUDED.expires_at,
      assigned_by = 'user',
      updated_at = now();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION subscribe_plan(TEXT) TO authenticated;

-- ── Função: verifica plano ativo do usuário atual ──
CREATE OR REPLACE FUNCTION has_active_plan()
RETURNS TABLE (
  has_plan BOOLEAN,
  plan_id TEXT,
  plan_name TEXT,
  expires_at TIMESTAMPTZ,
  days_left INT
) AS $$
  SELECT
    COALESCE(
      CASE WHEN up.expires_at IS NULL OR up.expires_at > now() THEN TRUE ELSE FALSE END,
      FALSE
    ),
    up.plan_id,
    p.name,
    up.expires_at,
    CASE
      WHEN up.expires_at IS NULL THEN NULL
      WHEN up.expires_at > now() THEN EXTRACT(DAY FROM (up.expires_at - now()))::INT
      ELSE 0 END
  FROM auth.users u
  LEFT JOIN user_plans up ON up.user_id = u.id
  LEFT JOIN plans p ON p.id = up.plan_id
  WHERE u.id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION has_active_plan() TO authenticated;

-- ── list_users com info de plano ──
CREATE OR REPLACE FUNCTION list_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed boolean,
  is_admin boolean,
  plan_id text,
  plan_name text,
  plan_expires_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at IS NOT NULL AS email_confirmed,
    (u.email = 'reivcontato@gmail.com') AS is_admin,
    up.plan_id,
    p.name AS plan_name,
    up.expires_at AS plan_expires_at
  FROM auth.users u
  LEFT JOIN user_plans up ON up.user_id = u.id
  LEFT JOIN plans p ON p.id = up.plan_id
  ORDER BY u.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION list_users() TO authenticated;
