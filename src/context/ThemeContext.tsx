import React, { createContext, useCallback, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

import { Theme, ThemeKey, themes } from '@/constants/theme';
import { storage } from '@/lib/storage';

const STORAGE_KEY = 'theme_override';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface ThemeContextValue {
  /** Tokens de cor do tema ativo. */
  theme: Theme;
  /** Chave do tema ativo: 'dark' | 'light'. */
  activeKey: ThemeKey;
  /** Alterna entre dark ↔ light. */
  toggleTheme: () => void;
  /**
   * Define o tema explicitamente ou retorna ao automático.
   * @param key 'dark' | 'light' | 'auto' (segue o sistema)
   */
  setTheme: (key: ThemeKey | 'auto') => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ThemeContext = createContext<ThemeContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'dark' | 'light' | null

  /**
   * Estado do override.
   * Leitura inicial via storage (MMKV em native build, memória no Expo Go).
   */
  const [overrideKey, setOverrideKey] = useState<ThemeKey | null>(() => {
    const saved = storage.getString(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved as ThemeKey;
    return null;
  });

  /**
   * Resolve o tema ativo:
   *   override do MMKV  >  tema do sistema  >  'dark' (fallback seguro)
   */
  const activeKey: ThemeKey =
    overrideKey ?? (systemScheme === 'light' ? 'light' : 'dark');
  const theme = themes[activeKey];

  const setTheme = useCallback((key: ThemeKey | 'auto') => {
    if (key === 'auto') {
      storage.delete(STORAGE_KEY);
      setOverrideKey(null);
    } else {
      storage.set(STORAGE_KEY, key);
      setOverrideKey(key);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(activeKey === 'dark' ? 'light' : 'dark');
  }, [activeKey, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, activeKey, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook interno (re-exportado via src/hooks/useTheme.ts)
// ---------------------------------------------------------------------------
export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error(
      'useThemeContext deve ser chamado dentro de <ThemeProvider>.\n' +
        'Verifique se o app/_layout.tsx envolve a árvore com <ThemeProvider>.',
    );
  }
  return ctx;
}
