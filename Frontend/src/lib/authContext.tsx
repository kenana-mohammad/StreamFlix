import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from './apiClient';
import { useToast } from './useToast';

export interface AuthContextType {
  // Auth State
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // User Data
  user: any | null;
  userName: string | null;
  
  // Check Auth Status
  checkAuth: () => Promise<boolean>;
  
  // Set user after login
  setUser: (user: any) => void;
  setUserName: (name: string) => void;
  
  // Called after successful login/register to update auth state
  // Pass the response data from login/register API
  onLoginSuccess: (response?: any) => Promise<void>;
  
  // Logout
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // تحقق من حالة المستخدم عند تحميل التطبيق
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      // محاولة جلب البروفايلات - إذا نجحت = المستخدم مسجل دخول
      const response = await apiClient.getProfiles();
      
      if (response && (Array.isArray(response) || response.data)) {
        setIsAuthenticated(true);
        // Try to get current user data
        try {
          const currentUser = await apiClient.getCurrentUser();
          setUser(currentUser);
          setUserName(currentUser?.name || null);
        } catch (err) {
          console.error('Could not fetch current user:', err);
        }
        return true;
      }
      
      setIsAuthenticated(false);
      return false;
    } catch (error: any) {
      // لا توجد auth cookie = ضيف
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Called after successful login/register to update auth state
  const onLoginSuccess = useCallback(async (response?: any) => {
    try {
      // If response contains user data, set it directly
      if (response?.userObj || response?.user) {
        setUser(response?.userObj || response?.user);
        setUserName((response?.userObj?.name || response?.user?.name) || null);
      }
      
      // Set authenticated flag immediately
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Error during onLoginSuccess:', error);
      setIsAuthenticated(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
      setIsAuthenticated(false);
      setUser(null);
      setUserName(null);
      toast.success('Logged out successfully');
      window.location.href = '/';
    } catch (error: any) {
      toast.error('Error logging out');
    }
  }, [toast]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    userName,
    checkAuth,
    setUser,
    setUserName,
    onLoginSuccess,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
