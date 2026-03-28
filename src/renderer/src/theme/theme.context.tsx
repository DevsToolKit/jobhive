/* eslint-disable react-refresh/only-export-components */
// src/theme/theme.context.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Theme } from '@/types/theme.types';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'app-theme';

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored ?? 'system';
  });

  // Apply theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    const appliedTheme = resolveTheme(theme);

    root.classList.toggle('dark', appliedTheme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = () => {
      if ((localStorage.getItem(STORAGE_KEY) as Theme | null) === 'system') {
        const root = document.documentElement;
        root.classList.toggle('dark', getSystemTheme() === 'dark');
      }
    };

    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    setThemeState(theme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const resolved = resolveTheme(current);
      return resolved === 'dark' ? 'light' : 'dark';
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [setTheme, theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return ctx;
}
