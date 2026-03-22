'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeToDocument(nextTheme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', nextTheme);
  try {
    localStorage.setItem('maloc-theme', nextTheme);
  } catch {
    /* navigation privée / quota */
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    applyThemeToDocument(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      applyThemeToDocument(next);
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('maloc-theme');
      const initialTheme: Theme = stored === 'light' ? 'light' : 'dark';
      setThemeState(initialTheme);
      applyThemeToDocument(initialTheme);
    } catch {
      setThemeState('dark');
      applyThemeToDocument('dark');
    }
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
