/**
 * Tela do Sorteador de Times — placeholder.
 * Implementação completa na feature/sorteador (Issue #5).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

export default function Sorter() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <Text style={[styles.emoji]}>🎲</Text>
        <Text style={[styles.title, { color: theme.text }]}>
          Sorteador de Times
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Em breve — Issue #5
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emoji: { fontSize: 64 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 14 },
  backBtn: { marginTop: 24 },
  backLabel: { fontSize: 15, fontWeight: '600' },
});
