import { createContext, useContext, useEffect, useState } from 'react';
import type { AppState } from './types';

type AppContextValue = AppState & {
  retry: () => void;
};

const STEP_LABELS = ['checking_internet', 'starting_backend', 'initializing_db', 'ready'] as const;

const STEP_RANGES: readonly [number, number][] = [
  [0, 20],
  [20, 50],
  [50, 80],
  [80, 100],
];

const initialState: AppState = {
  isLoading: true,
  isInitialized: false,
  progress: 0,
  currentStep: 'checking_internet',
  error: null,
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    const STEP_DURATION = 1000;
    const PROGRESS_TICK = 120;

    let stepIndex = 0;

    const stepTimer = setInterval(() => {
      stepIndex += 1;

      if (stepIndex >= STEP_LABELS.length) {
        clearInterval(stepTimer);
        clearInterval(progressTimer);

        setState({
          isLoading: false,
          isInitialized: true,
          progress: 100,
          currentStep: 'ready',
          error: null,
        });

        return;
      }

      setState((prev) => ({
        ...prev,
        currentStep: STEP_LABELS[stepIndex],
      }));
    }, STEP_DURATION);

    const progressTimer = setInterval(() => {
      setState((prev) => {
        const [, max] = STEP_RANGES[stepIndex];

        if (prev.progress >= max) return prev;

        const increment = Math.random() * 3 + 1;
        return {
          ...prev,
          progress: Math.min(prev.progress + increment, max),
        };
      });
    }, PROGRESS_TICK);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    };
  }, []);

  const retry = () => window.location.reload();

  return <AppContext.Provider value={{ ...state, retry }}>{children}</AppContext.Provider>;
}

/* ----------------------------------
   Hook
----------------------------------- */
export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
