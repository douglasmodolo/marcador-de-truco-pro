/**
 * Tokens de cor para os temas Dark e Light.
 *
 * Dark (padrão): fundo preto puro — pixels OLED desligados = máxima economia de bateria.
 * Light (modo sol): fundo creme quente (#FFF8E7) — NÃO branco puro, que reflete
 *   luz solar diretamente para o olho e piora a leitura.
 */
export const themes = {
  dark: {
    background: '#000000',
    /** Superfície do HUD com efeito glassmorphism */
    surface: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.5)',
    /** Amarelo vibrante para botão TRUCO! e destaques */
    accent: '#FFD700',
  },
  light: {
    background: '#FFF8E7',
    /** Superfície do HUD com efeito glassmorphism */
    surface: 'rgba(0,0,0,0.06)',
    text: '#000000',
    textMuted: 'rgba(0,0,0,0.45)',
    /** Amarelo escuro — legível sob luz solar intensa */
    accent: '#B8860B',
  },
} as const;

export type Theme = typeof themes.dark;
export type ThemeKey = keyof typeof themes;
