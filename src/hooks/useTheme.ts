/**
 * Hook de tema — MMKV override + useColorScheme fallback.
 *
 * Lógica (CLAUDE.md seção 12):
 *   1. Lê override salvo no MMKV: 'dark' | 'light' | null
 *   2. Se null  → segue useColorScheme() do sistema operacional
 *   3. Se definido → usa o override independente do sistema
 *
 * O estado é compartilhado via ThemeContext (React Context), de forma que
 * qualquer chamada a useTheme() — incluindo o _layout.tsx — reage
 * imediatamente quando o usuário troca o tema na tela de menu.
 *
 * Uso:
 *   const { theme, activeKey, toggleTheme, setTheme } = useTheme();
 */
export { useThemeContext as useTheme } from '@/context/ThemeContext';
