import { useRef } from 'react';
import type { AppState } from '../types';

export const STEP_PROGRESS_MAX = {
  checking_internet: 20,
  starting_backend: 50,
  initializing_db: 80,
  ready: 100,
} as const;

export function useProgress(setState: React.Dispatch<React.SetStateAction<AppState>>) {
  const timerRef = useRef<number | null>(null);

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = (step: keyof typeof STEP_PROGRESS_MAX) => {
    stop();

    timerRef.current = window.setInterval(() => {
      setState((prev) => {
        const max = STEP_PROGRESS_MAX[step];
        if (prev.progress >= max) return prev;

        return {
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 3 + 1, max),
        };
      });
    }, 120);
  };

  return { start, stop };
}
