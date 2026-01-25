import { createContext, useContext, useEffect, useState, useRef } from 'react';

import type { AppState } from './types';
import { initialState } from './helper/initialState';
import { useProgress } from './helper/progress';

import { INIT_STEPS } from './init/steps';
import { runInitSteps } from './init/runInitSteps';

type AppContextValue = AppState & {
  retry: () => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const progress = useProgress(setState);
  const startedRef = useRef(false);

  const initializeApp = async () => {
    try {
      await runInitSteps(INIT_STEPS, setState, progress);

      progress.stop();
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isInitialized: true,
        currentStep: 'ready',
      }));
    } catch (err: any) {
      progress.stop();

      setState((prev) => ({
        ...prev,
        isLoading: false,
        isInitialized: false,
        error: {
          id: err.id ?? 'UNKNOWN_ERROR',
          message: err.message ?? 'Unexpected startup error',
        },
      }));
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    initializeApp();
    return progress.stop;
  }, []);

  const retry = () => {
    progress.stop();
    setState(initialState);
    startedRef.current = false;
    initializeApp();
  };

  return <AppContext.Provider value={{ ...state, retry }}>{children}</AppContext.Provider>;
}

/* ---------------- Hook ---------------- */

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}
