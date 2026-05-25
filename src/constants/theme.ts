/**
 * Tokens de cor para os temas Dark e Light do Marcador de Truco Pro.
 *
 * Filosofia: bateria primeiro.
 * - Dark (#000000 puro): pixels OLED desligados = máxima economia de bateria.
 * - Light (#FFF8E7 creme): melhor leitura ao sol (branco puro reflete mais luz solar).
 */

export type Theme = 'dark' | 'light';

export const themes = {
  dark: {
    background: '#000000',
    surface: 'rgba(255,255,255,0.08)',  // HUD glassmorphism
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.5)',
    accent: '#FFD700',                  // amarelo para TRUCO!
  },
  light: {
    background: '#FFF8E7',
    surface: 'rgba(0,0,0,0.06)',        // HUD glassmorphism
    text: '#000000',
    textMuted: 'rgba(0,0,0,0.45)',
    accent: '#B8860B',                  // amarelo escuro legível ao sol
  },
} as const;

export type ThemeTokens = typeof themes.dark;
