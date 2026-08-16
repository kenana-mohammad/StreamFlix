import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { AppView, Content } from '@/types';
import { apiClient } from '@/lib/apiClient';
import { useProfile } from '@/lib/profileContext';

interface AppState {
  view: AppView;
  selectedContent: Content | null;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  loading: boolean;
  user: any | null;
  activeProfile: any | null;
  currentSubscription: any | null;
  devices: any[];
}

interface AppActions {
  navigate: (view: AppView) => void;
  openContent: (content: Content) => void;
  closeContent: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  setUser: (user: any) => void;
  setActiveProfile: (profile: any) => void;
  setCurrentSubscription: (subscription: any) => void;
  setDevices: (devices: any[]) => void;
  logout: () => Promise<void>;
  exitProfile: () => void;
  removeDevice: (deviceId: string) => Promise<void>;
  subscribe: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { clearProfileToken } = useProfile();
  const [view, setView] = useState<AppView>('welcome');
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUserState] = useState<any | null>(null);
  const [activeProfile, setActiveProfileState] = useState<any | null>(null);
  const [currentSubscription, setCurrentSubscriptionState] = useState<any | null>(null);
  const [devices, setDevicesState] = useState<any[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const navigate = useCallback((v: AppView) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const setUser = useCallback((u: any) => setUserState(u), []);
  const setActiveProfile = useCallback((p: any) => setActiveProfileState(p), []);
  const setCurrentSubscription = useCallback((s: any) => setCurrentSubscriptionState(s), []);
  const setDevices = useCallback((d: any[]) => setDevicesState(d), []);

  const openContent = useCallback((c: Content) => setSelectedContent(c), []);
  const closeContent = useCallback(() => setSelectedContent(null), []);

  const logout = useCallback(async () => {
    try {
      // Clear all state first
      setUserState(null);
      setActiveProfileState(null);
      setCurrentSubscriptionState(null);
      setDevicesState([]);
      setSelectedContent(null);
      clearProfileToken();
      
      // Then call logout API
      await apiClient.logout();
      
      setView('welcome');
    } catch (error) {
      // Even if logout API fails, still clear local state
      setUserState(null);
      setActiveProfileState(null);
      setCurrentSubscriptionState(null);
      setDevicesState([]);
      setSelectedContent(null);
      clearProfileToken();
      setView('welcome');
      showToast('Logged out', 'success');
    }
  }, [clearProfileToken, showToast]);

  const exitProfile = useCallback(() => {
    clearProfileToken();
    setActiveProfileState(null);
    setView('profiles');
  }, [clearProfileToken]);

  const removeDevice = useCallback(async (deviceId: string) => {
    try {
      setLoading(true);
      await apiClient.deleteDevice(deviceId);
      setDevicesState((prev) => prev.filter((d) => d.id !== deviceId));
      showToast('Device removed', 'success');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to remove device';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const subscribe = useCallback(async (planId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.createSubscription(planId);
      setCurrentSubscriptionState(response.data);
      showToast('Subscription successful!', 'success');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Subscription failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const cancelSubscription = useCallback(async () => {
    if (!currentSubscription?.id) return;
    try {
      setLoading(true);
      await apiClient.cancelSubscription(currentSubscription.id);
      setCurrentSubscriptionState(null);
      showToast('Subscription canceled', 'success');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to cancel subscription';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentSubscription, showToast]);

  const value: AppState & AppActions = {
    view,
    selectedContent,
    toast,
    loading,
    user,
    activeProfile,
    currentSubscription,
    devices,
    navigate,
    openContent,
    closeContent,
    showToast,
    setUser,
    setActiveProfile,
    setCurrentSubscription,
    setDevices,
    logout,
    exitProfile,
    removeDevice,
    subscribe,
    cancelSubscription,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { content as allContent } from '@/data';
