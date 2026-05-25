/**
 * Tela de Compra Premium — placeholder.
 * Implementação completa na feature/premium (Issue #17).
 *
 * Fluxo completo:
 *   - Exibir benefícios do plano Premium
 *   - Chamar Purchases.purchasePackage() via RevenueCat
 *   - Botão "Restaurar compra" (obrigatório para Play Store)
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

export default function Premium() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <Text style={styles.emoji}>⭐</Text>
        <Text style={[styles.title, { color: theme.text }]}>Plano Premium</Text>
        <Text style={[styles.benefit, { color: theme.textMuted }]}>
          Remova todos os anúncios com uma compra única.
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Em breve — Issue #17
        </Text>

        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[styles.backLabel, { color: theme.accent }]}>← Voltar ao Menu</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emoji: { fontSize: 64 },
  title: { fontSize: 22, fontWeight: '700' },
  benefit: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  subtitle: { fontSize: 13 },
  backBtn: { marginTop: 24 },
  backLabel: { fontSize: 15, fontWeight: '600' },
});
