import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAIL } from '../config';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          isAdmin: session.user.email === ADMIN_EMAIL
        });
      }
      setLoading(false);
    });

    // Escuta mudanças de auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            isAdmin: session.user.email === ADMIN_EMAIL
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const register = useCallback(async (email, password) => {
    email = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return { ok: false, error: 'E-mail inválido.' };
    if (String(password).length < 6)
      return { ok: false, error: 'A senha precisa ter ao menos 6 caracteres.' };

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { ok: false, error: traduzErro(error.message) };
    if (!data.session) {
      // pode exigir confirmação de email — avisa o usuário
      return {
        ok: false,
        error: 'Conta criada! Se necessário, confirme pelo e-mail enviado.'
      };
    }
    return { ok: true };
  }, []);

  const login = useCallback(async (email, password) => {
    email = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: traduzErro(error.message) };
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: !!user?.isAdmin,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Traduz mensagens comuns do Supabase Auth
function traduzErro(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('invalid login credentials'))
    return 'E-mail ou senha incorretos.';
  if (m.includes('user already registered'))
    return 'Este e-mail já está cadastrado.';
  if (m.includes('password should be at least'))
    return 'A senha precisa ter ao menos 6 caracteres.';
  if (m.includes('email not confirmed'))
    return 'Confirme seu e-mail antes de entrar (verifique a caixa de entrada).';
  return msg || 'Ocorreu um erro. Tente novamente.';
}
