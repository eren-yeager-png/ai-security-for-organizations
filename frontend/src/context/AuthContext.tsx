import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, LoginRequest } from '../api/types';
import { getCurrentUser, login as apiLogin, logout as apiLogout, refreshSession } from '../api/auth';
import { clearAccessToken, getAccessToken, registerUnauthorizedHandler } from '../api/client';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (req: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const initializationStarted = useRef(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      clearAccessToken();
      setAccessTokenState(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Register global 401 unhandled handler
    registerUnauthorizedHandler(() => {
      handleLogout();
    });

    if (initializationStarted.current) return;
    initializationStarted.current = true;

    const initAuth = async () => {
      try {
        await refreshSession();
        setUser(await getCurrentUser());
        setAccessTokenState(getAccessToken());
      } catch {
        clearAccessToken();
        setAccessTokenState(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [handleLogout]);

  const handleLogin = async (req: LoginRequest) => {
    setIsLoading(true);
    try {
      await apiLogin(req);
      setUser(await getCurrentUser());
      setAccessTokenState(getAccessToken());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
