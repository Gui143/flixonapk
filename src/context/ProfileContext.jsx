import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { listProfiles } from '../lib/profiles';

const ProfileContext = createContext(null);
export const useProfile = () => useContext(ProfileContext);

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfileState] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    try {
      const data = await listProfiles(user.id);
      setProfiles(data);
    } catch (e) {
      setProfiles([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Limpa perfil ativo ao deslogar
  useEffect(() => {
    if (!user) setActiveProfileState(null);
  }, [user]);

  // Define o perfil ativo (chamado ao selecionar na tela "Quem está assistindo?")
  const setActiveProfile = useCallback((profile) => {
    setActiveProfileState(profile);
  }, []);

  // Sair do perfil atual (volta pra seleção)
  const clearActiveProfile = useCallback(() => {
    setActiveProfileState(null);
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        loading,
        activeProfile,
        setActiveProfile,
        clearActiveProfile,
        reload
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
