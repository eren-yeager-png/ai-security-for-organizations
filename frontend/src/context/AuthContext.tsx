import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, LoginRequest } from '../api/types';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '../api/auth';
import { getStoredTokens, registerUnauthorizedHandler } from '../api/client';
import { MOCK_USERS } from '../mocks/auth.mock';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (req: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'secure_ai_cached_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem(CURRENT_USER_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    // Default initial mock session to Eleanor Vance (Admin) for seamless developer experience
    return MOCK_USERS.admin;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync user state with localStorage
  const persistUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  };

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      persistUser(null);
    }
  }, []);

  useEffect(() => {
    // Register global 401 unhandled handler
    registerUnauthorizedHandler(() => {
      handleLogout();
    });

    const initAuth = async () => {
      const { accessToken } = getStoredTokens();
      if (accessToken) {
        try {
          const fetchedUser = await getCurrentUser();
          if (fetchedUser) {
            persistUser(fetchedUser);
          }
        } catch {
          // Token expired or invalid
          handleLogout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [handleLogout]);

  const handleLogin = async (req: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await apiLogin(req);
      persistUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
