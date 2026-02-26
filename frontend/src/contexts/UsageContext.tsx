import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';

const STORAGE_KEY_COUNT = 'dailyUsesCount';
const STORAGE_KEY_DATE = 'dailyUsesDate';
const DAILY_LIMIT = 4;

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function loadFromStorage(): number {
  const storedDate = localStorage.getItem(STORAGE_KEY_DATE);
  const today = getTodayString();
  if (storedDate !== today) {
    localStorage.setItem(STORAGE_KEY_DATE, today);
    localStorage.setItem(STORAGE_KEY_COUNT, '0');
    return 0;
  }
  const count = parseInt(localStorage.getItem(STORAGE_KEY_COUNT) || '0', 10);
  return isNaN(count) ? 0 : count;
}

interface UsageContextType {
  usesCount: number;
  limitReached: boolean;
  incrementUses: () => Promise<void>;
  isPro: boolean;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: ReactNode }) {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const isAuthenticated = !!identity;

  const [usesCount, setUsesCount] = useState<number>(() => loadFromStorage());
  const [isPro, setIsPro] = useState<boolean>(false);
  const initializedRef = useRef<string | null>(null);

  // When authenticated and actor is ready, load usage + pro status from backend
  useEffect(() => {
    if (!isAuthenticated || !actor || actorFetching) return;

    const principalKey = identity?.getPrincipal().toString() ?? '';
    if (initializedRef.current === principalKey) return;
    initializedRef.current = principalKey;

    const loadBackendData = async () => {
      try {
        const [usageResponse, proStatus] = await Promise.all([
          actor.getDailyUsage(),
          actor.getIsPro(),
        ]);

        const today = getTodayString();
        // If the stored date matches today, use backend count; otherwise it's a new day (count = 0)
        const backendDate = usageResponse.date;
        const count = backendDate === today ? Number(usageResponse.count) : 0;
        setUsesCount(count);
        setIsPro(proStatus);
      } catch {
        // Fallback to localStorage on error
        setUsesCount(loadFromStorage());
      }
    };

    loadBackendData();
  }, [isAuthenticated, actor, actorFetching, identity]);

  // When user logs out, reset to localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      initializedRef.current = null;
      setIsPro(false);
      setUsesCount(loadFromStorage());
    }
  }, [isAuthenticated]);

  // Re-check on mount in case the date changed while the tab was open (anonymous only)
  useEffect(() => {
    if (!isAuthenticated) {
      const fresh = loadFromStorage();
      setUsesCount(fresh);
    }
  }, []);

  const incrementUses = useCallback(async () => {
    if (isAuthenticated && actor) {
      try {
        const today = getTodayString();
        const response = await actor.incrementDailyUsage(today);
        setUsesCount(Number(response.count));
      } catch {
        // Fallback to local increment
        setUsesCount(prev => {
          const next = prev + 1;
          localStorage.setItem(STORAGE_KEY_DATE, getTodayString());
          localStorage.setItem(STORAGE_KEY_COUNT, String(next));
          return next;
        });
      }
    } else {
      setUsesCount(prev => {
        const next = prev + 1;
        localStorage.setItem(STORAGE_KEY_DATE, getTodayString());
        localStorage.setItem(STORAGE_KEY_COUNT, String(next));
        return next;
      });
    }
  }, [isAuthenticated, actor]);

  // Pro users have no limit; otherwise check count
  const limitReached = isPro ? false : usesCount >= DAILY_LIMIT;

  return (
    <UsageContext.Provider value={{ usesCount, limitReached, incrementUses, isPro }}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage(): UsageContextType {
  const ctx = useContext(UsageContext);
  if (!ctx) throw new Error('useUsage must be used within UsageProvider');
  return ctx;
}
