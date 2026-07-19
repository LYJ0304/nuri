'use client';

import type { AuthUser } from '@nuri/contracts';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  fetchAuthenticatedUser,
  refreshAccessToken,
  signIn as requestSignIn,
  signOut as requestSignOut,
} from '../lib/auth-api';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    void refreshAccessToken()
      .then(async (refreshedUser) => {
        if (!refreshedUser) return null;
        return (await fetchAuthenticatedUser()) ?? refreshedUser;
      })
      .then((currentUser) => {
        if (!active) return;
        setUser(currentUser);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== '/login') router.replace('/login');
    if (user && pathname === '/login') router.replace('/');
  }, [loading, pathname, router, user]);

  async function login(email: string, password: string): Promise<void> {
    const authenticatedUser = await requestSignIn(email, password);
    setUser(authenticatedUser);
    router.replace('/');
    router.refresh();
  }

  async function logout(): Promise<void> {
    await requestSignOut();
    setUser(null);
    router.replace('/login');
    router.refresh();
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
