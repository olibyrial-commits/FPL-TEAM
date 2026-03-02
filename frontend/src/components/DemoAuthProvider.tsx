'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface DemoUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  tier: 'free' | 'pro' | 'elite';
  optimizationsUsed: number;
  optimizationsLimit: number | null;
  isDemo: boolean;
}

interface DemoAuthContextType {
  demoUser: DemoUser | null;
  isDemo: boolean;
  isDemoMode: boolean;
  logoutDemo: () => void;
  setDemoTier: (tier: 'free' | 'pro' | 'elite') => void;
  authLoading: boolean;
}

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined);

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    try {
      const demoSession = localStorage.getItem('demo-session');
      if (demoSession) {
        const parsed = JSON.parse(demoSession);
        setDemoUser(parsed);
      }
    } catch (e) {
      console.error('[DemoAuth] Failed to parse demo session:', e);
      localStorage.removeItem('demo-session');
    }
  }, []);

  const isDemoMode = !session && !!demoUser;
  const isDemo = isDemoMode;

  const logoutDemo = () => {
    localStorage.removeItem('demo-session');
    document.cookie = 'demo-session=; path=/; max-age=0';
    setDemoUser(null);
    window.location.href = '/login';
  };

  const setDemoTier = (tier: 'free' | 'pro' | 'elite') => {
    if (demoUser) {
      const updated = { ...demoUser, tier };
      setDemoUser(updated);
      localStorage.setItem('demo-session', JSON.stringify(updated));
    }
  };

  return (
    <DemoAuthContext.Provider value={{ demoUser, isDemo, isDemoMode, logoutDemo, setDemoTier, authLoading }}>
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext);
  if (context === undefined) {
    throw new Error('useDemoAuth must be used within a DemoAuthProvider');
  }
  return context;
}
