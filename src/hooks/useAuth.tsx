import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, Location } from '../types';
import api from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  selectedLocation: Location | null;
  needsLocationSelect: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setSelectedLocation: (loc: Location) => void;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const SEA_USER_KEY = 'sea_ediss_user';
const SEA_TOKEN_KEY = 'sea_ediss_token';
const SEA_LOCATION_KEY = 'sea_ediss_location';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(SEA_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(SEA_TOKEN_KEY)
  );
  // selectedLocation survives a page refresh (sessionStorage) but not a fresh login
  const [selectedLocation, setSelectedLocationState] = useState<Location | null>(() => {
    const stored = sessionStorage.getItem(SEA_LOCATION_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  // needsLocationSelect is true whenever user is logged in but hasn't selected location this session
  const [needsLocationSelect, setNeedsLocationSelect] = useState<boolean>(() => {
    return !!localStorage.getItem(SEA_TOKEN_KEY) && !sessionStorage.getItem(SEA_LOCATION_KEY);
  });

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    setSelectedLocationState(null);
    setNeedsLocationSelect(true); // force location select on every login
    sessionStorage.removeItem(SEA_LOCATION_KEY);
    localStorage.setItem(SEA_TOKEN_KEY, t);
    localStorage.setItem(SEA_USER_KEY, JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setSelectedLocationState(null);
    setNeedsLocationSelect(false);
    localStorage.removeItem(SEA_TOKEN_KEY);
    localStorage.removeItem(SEA_USER_KEY);
    sessionStorage.removeItem(SEA_LOCATION_KEY);
  }, []);

  const setSelectedLocation = useCallback((loc: Location) => {
    setSelectedLocationState(loc);
    setNeedsLocationSelect(false);
    sessionStorage.setItem(SEA_LOCATION_KEY, JSON.stringify(loc));
  }, []);

  const hasRole = useCallback((roles: string[]) => {
    return !!user && roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, token, selectedLocation, needsLocationSelect,
      login, logout, setSelectedLocation,
      isAuthenticated: !!token, hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
