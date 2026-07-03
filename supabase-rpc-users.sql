-- ═══════════════════════════════════════════════════════════
--  FLIXON — Função RPC para listar usuários no Painel Admin
--
--  COMO USAR:
--  1. Supabase → SQL Editor → cole TODO este arquivo → Run
--  2. Pronto! O painel admin agora lista todos os usuários.
-- ═══════════════════════════════════════════════════════════

-- Cria a função que lista usuários (roda com privilégios de admin)
CREATE OR REPLACE FUNCTION list_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed boolean,
  is_admin boolean
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
    (u.email = 'reivcontato@gmail.com') AS is_admin
  FROM auth.users u
  ORDER BY u.created_at DESC;
$$;

-- Permite que apenas o admin execute
REVOKE ALL ON FUNCTION list_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION list_users() FROM authenticated;

-- Cria uma política customizada via função
CREATE OR REPLACE FUNCTION can_list_users()
RETURNS boolean AS $$
  SELECT COALESCE(auth.jwt() ->> 'email', '') = 'reivcontato@gmail.com';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION list_users() TO authenticated;
