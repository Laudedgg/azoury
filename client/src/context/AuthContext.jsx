import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '@/services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('azoury_token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  const saveToken = useCallback((newToken) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('azoury_token', newToken);
    } else {
      localStorage.removeItem('azoury_token');
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password);
    const { accessToken, user: userData } = response.data;
    saveToken(accessToken);
    // Add computed name field for convenience
    const enriched = { ...userData, name: `${userData.firstName} ${userData.lastName}` };
    setUser(enriched);
    return { ...response.data, user: enriched };
  }, [saveToken]);

  const register = useCallback(async (data) => {
    const response = await authService.register(data);
    const { accessToken, user: userData } = response.data;
    saveToken(accessToken);
    setUser(userData);
    return response.data;
  }, [saveToken]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    } finally {
      saveToken(null);
      setUser(null);
    }
  }, [saveToken]);

  const refreshToken = useCallback(async () => {
    try {
      const response = await authService.refreshToken();
      saveToken(response.data.token);
      return response.data.token;
    } catch {
      saveToken(null);
      setUser(null);
      throw new Error('Token refresh failed');
    }
  }, [saveToken]);

  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await authService.getMe();
        // Backend returns user directly or as { user: ... }
        const userData = response.data.user || response.data;
        const enriched = { ...userData, name: `${userData.firstName} ${userData.lastName}` };
        setUser(enriched);
      } catch {
        saveToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
