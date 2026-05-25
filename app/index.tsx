import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

// Link de busca na Mercado Livre — substituir por link de afiliado quando disponível
const LOJA_URL = 'https://www.mercadolivre.com.br/busca?q=baralho+de+truco';

// ---------------------------------------------------------------------------
// Handlers fora do componente para evitar recriação a cada render
// ---------------------------------------------------------------------------
async function openLoja() {
  try {
    const supported = await Linking.canOpenURL(LOJA_URL);
    if (supported) {
      await Linking.openURL(LOJA_URL);
    } else {
      Alert.alert('Ops!', 'Não foi possível abrir a loja. Verifique sua conexão.');
    }
  } catch {
    Alert.alert('Ops!', 'Não foi possível abrir a loja.');
  }
}

// ---------------------------------------------------------------------------
// Menu Principal
// ---------------------------------------------------------------------------
export default function Index() {
  const { theme, activeKey, toggleTheme } = useTheme();

  const isLight = activeKey === 'light';

  /** Cor de borda dos botões secundários — adapta ao tema */
  const borderColor = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)';

  /** Background pressed dos botões secundários */
  const pressedSurface = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.14)';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>

          {/* ── LOGO ──────────────────────────────────────────────────────── */}
          <View style={styles.logoArea}>
            <Text style={styles.logoEmoji}>🃏</Text>

            <Text style={[styles.logoTitle, { color: theme.text }]}>
              TRUCO PRO
            </Text>

            <Text style={[styles.logoSubtitle, { color: theme.textMuted }]}>
              Marcador para Truco Paulista
            </Text>
          </View>

          {/* ── BOTÕES ────────────────────────────────────────────────────── */}
          <View style={styles.buttonsArea}>

            {/* ① JOGAR AGORA — ação primária */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Jogar agora com nomes padrão"
              onPress={() =>
                router.push({
                  pathname: '/marcador',
                  params: { time1: 'Nós', time2: 'Eles' },
                })
              }
              style={({ pressed }) => [
                styles.btnPrimary,
                {
                  backgroundColor: pressed
                    ? isLight ? '#9A7000' : '#C8A800'
                    : theme.accent,
                  shadowColor: theme.accent,
                  elevation: pressed ? 0 : 6,
                  shadowOpacity: pressed ? 0 : 0.4,
                },
              ]}
            >
              <Text style={styles.btnPrimaryLabel}>JOGAR AGORA</Text>
            </Pressable>

            {/* ② Sorteador de Times */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sorteador de times"
              onPress={() => router.push('/sorter')}
              style={({ pressed }) => [
                styles.btnSecondary,
                {
                  backgroundColor: pressed ? pressedSurface : theme.surface,
                  borderColor,
                },
              ]}
            >
              <Text style={[styles.btnSecondaryLabel, { color: theme.text }]}>
                🎲  Sorteador de Times
              </Text>
            </Pressable>

            {/* ③ Loja de Baralhos */}
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Abrir loja de baralhos"
              onPress={openLoja}
              style={({ pressed }) => [
                styles.btnSecondary,
                {
                  backgroundColor: pressed ? pressedSurface : theme.surface,
                  borderColor,
                },
              ]}
            >
              <Text style={[styles.btnSecondaryLabel, { color: theme.text }]}>
                🛍️  Loja de Baralhos
              </Text>
            </Pressable>

            {/* ④ Remover Anúncios — ação terciária */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remover anúncios — plano premium"
              onPress={() => router.push('/premium')}
              style={({ pressed }) => [styles.btnTertiary, { opacity: pressed ? 0.55 : 1 }]}
            >
              <Text style={[styles.btnTertiaryLabel, { color: theme.textMuted }]}>
                ⭐  Remover Anúncios
              </Text>
            </Pressable>
          </View>

          {/* ── ESPAÇADOR FLEXÍVEL ────────────────────────────────────────── */}
          <View style={styles.spacer} />

          {/* ── TOGGLE DE TEMA ───────────────────────────────────────────── */}
          <View style={styles.themeToggleArea}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Mudar para tema ${activeKey === 'dark' ? 'claro' : 'escuro'}`}
              onPress={toggleTheme}
              style={({ pressed }) => [
                styles.themeToggle,
                {
                  backgroundColor: pressed
                    ? isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)'
                    : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                },
              ]}
            >
              <Text style={styles.themeToggleEmoji}>
                {activeKey === 'dark' ? '☀️' : '🌙'}
              </Text>
              <Text style={[styles.themeToggleLabel, { color: theme.textMuted }]}>
                {activeKey === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
              </Text>
            </Pressable>
          </View>

          {/* ── BANNER ADMOB (reserva de espaço) ─────────────────────────
              Implementar em feature/admob (Issue #16).
              Visível apenas para usuários Free (usePremium.isPremium === false).
              Altura padrão de banner AdMob: 50dp.
              ───────────────────────────────────────────────────────────── */}
          <View style={styles.adBannerPlaceholder} />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles — cores fixas ficam aqui; cores de tema ficam inline acima
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },

  // Logo
  logoArea: {
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 44,
  },
  logoEmoji: {
    fontSize: 72,
    lineHeight: 80,
  },
  logoTitle: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 6,
    marginTop: 10,
  },
  logoSubtitle: {
    fontSize: 13,
    letterSpacing: 0.5,
    marginTop: 6,
  },

  // Botões
  buttonsArea: {
    gap: 12,
  },

  /** Botão primário — JOGAR AGORA */
  btnPrimary: {
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
  },
  btnPrimaryLabel: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2.5,
  },

  /** Botões secundários — Sorteador / Loja */
  btnSecondary: {
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnSecondaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },

  /** Botão terciário — Remover Anúncios */
  btnTertiary: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnTertiaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Espaçador
  spacer: {
    flex: 1,
    minHeight: 20,
  },

  // Toggle de tema
  themeToggleArea: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  themeToggle: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleEmoji: {
    fontSize: 16,
  },
  themeToggleLabel: {
    fontSize: 13,
  },

  // Reserva de espaço para banner AdMob
  adBannerPlaceholder: {
    height: 50,
  },
});
