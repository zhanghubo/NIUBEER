import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'jiangying_auth';

/** @type {{ user: string | null; login: (user: string, password: string) => boolean; logout: () => void; isLoggedIn: boolean }} */
const AuthContext = createContext(null);

/**
 * 从本地存储恢复登录状态
 * @returns {{ user: string } | null}
 */
function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data?.user) return { user: data.user };
    }
  } catch (_) {
    // ignore
  }
  return null;
}

/**
 * 鉴权上下文：登录状态与登录/登出方法（演示用，未对接真实后端）
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadStoredAuth);

  useEffect(() => {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: auth.user }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [auth]);

  const login = useCallback((username, password) => {
    if (!username?.trim()) return false;
    setAuth({ user: username.trim() });
    return true;
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
  }, []);

  const value = {
    user: auth?.user ?? null,
    isLoggedIn: !!auth?.user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * @returns {{ user: string | null; isLoggedIn: boolean; login: (user: string, password: string) => boolean; logout: () => void }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
