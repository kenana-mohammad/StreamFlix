import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { apiClient } from './apiClient';

interface ProfileContextType {
  profileToken: string | null;
  setProfileToken: (token: string) => void;
  clearProfileToken: () => void;
  currentProfile: any;
  setCurrentProfile: (profile: any) => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileToken, setProfileTokenState] = useState<string | null>(null);
  const [currentProfile, setCurrentProfileState] = useState<any>(null);

  const setProfileToken = useCallback((token: string) => {
    setProfileTokenState(token);
    apiClient.setProfileToken(token);
  }, []);

  const clearProfileToken = useCallback(() => {
    setProfileTokenState(null);
    setCurrentProfileState(null);
    apiClient.clearProfileToken();
  }, []);

  const setCurrentProfile = useCallback((profile: any) => {
    setCurrentProfileState(profile);
  }, []);

  const value: ProfileContextType = {
    profileToken,
    setProfileToken,
    clearProfileToken,
    currentProfile,
    setCurrentProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}
