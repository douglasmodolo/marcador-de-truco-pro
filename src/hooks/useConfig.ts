/**
 * useConfig — configurações do usuário persistidas no MMKV.
 *
 * Chaves:
 *   'config_haptics'   → 'true' | 'false'   (default: true)
 *   'config_font_size' → 'P' | 'M' | 'G'   (default: 'M')
 *
 * O hook lê o valor inicial do storage na montagem (lazy useState)
 * e salva imediatamente no storage a cada mudança.
 */

import { useCallback, useState } from 'react';
import { storage } from '@/lib/storage';

export type FontSizeKey = 'P' | 'M' | 'G';

export const FONT_SIZE_MAP: Record<FontSizeKey, number> = {
  P: 120,
  M: 160,
  G: 200,
};

const KEY_HAPTICS   = 'config_haptics';
const KEY_FONT_SIZE = 'config_font_size';

export function useConfig() {
  // ── Vibração ──────────────────────────────────────────────────────────────
  const [hapticsEnabled, _setHapticsEnabled] = useState<boolean>(() => {
    const saved = storage.getString(KEY_HAPTICS);
    // Ausente = primeira abertura → padrão true
    return saved === undefined ? true : saved === 'true';
  });

  const setHapticsEnabled = useCallback((value: boolean) => {
    _setHapticsEnabled(value);
    storage.set(KEY_HAPTICS, String(value));
  }, []);

  // ── Tamanho do placar ─────────────────────────────────────────────────────
  const [placarFontSizeKey, _setPlacarFontSizeKey] = useState<FontSizeKey>(() => {
    const saved = storage.getString(KEY_FONT_SIZE) as FontSizeKey | undefined;
    return saved && saved in FONT_SIZE_MAP ? saved : 'M';
  });

  const setPlacarFontSizeKey = useCallback((key: FontSizeKey) => {
    _setPlacarFontSizeKey(key);
    storage.set(KEY_FONT_SIZE, key);
  }, []);

  return {
    hapticsEnabled,
    setHapticsEnabled,
    placarFontSizeKey,
    setPlacarFontSizeKey,
    /** Valor numérico em px derivado de placarFontSizeKey: P=120 M=160 G=200 */
    placarFontSize: FONT_SIZE_MAP[placarFontSizeKey],
  };
}
