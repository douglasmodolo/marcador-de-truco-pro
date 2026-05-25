import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// ─── Cara ou Coroa ─────────────────────────────────────────────────────────
//
// Técnica: backfaceVisibility + dois Animated.View sobrepostos.
//   Frente: rotateY(sharedValue)
//   Verso:  rotateY(sharedValue + 180)  → sempre no lado oposto da frente
//
// CARA  para em 1440° (= 4 × 360°)   → sharedValue mod 360 = 0  → frente visível
// COROA para em 1620° (= 4.5 × 360°) → sharedValue mod 360 = 180 → verso visível
// ───────────────────────────────────────────────────────────────────────────

type Resultado = 'cara' | 'coroa';

export default function Coin() {
  const router = useRouter();

  const [girando, setGirando] = useState(false);

  // Shared value: rotação Y em graus (acumula entre jogadas)
  const rotateY = useSharedValue(0);

  // ── Estilos animados das duas faces ──────────────────────────────────────
  // Perspective aplicada em cada face individualmente — mais confiável no Android.
  const frontAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 400 },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 400 },
      { rotateY: `${rotateY.value + 180}deg` },
    ],
  }));

  // ── Callback estável para runOnJS ─────────────────────────────────────────
  // useCallback garante referência estável; runOnJS bridga UI thread → JS thread.
  const revelarResultado = useCallback(() => {
    setGirando(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // ── Jogar ─────────────────────────────────────────────────────────────────
  function jogar() {
    if (girando) return;
    setGirando(true);

    // Reset para 0: após CARA (1440 mod 360 = 0) → sem snap visual.
    // Após COROA (1620 mod 360 = 180) → 1 frame de CARA antes da animação;
    // imperceptível pois a animação começa no mesmo batch de JS.
    rotateY.value = 0;

    const novoResultado: Resultado = Math.random() < 0.5 ? 'cara' : 'coroa';
    const valorFinal = novoResultado === 'cara' ? 1440 : 1620;

    rotateY.value = withTiming(valorFinal, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    }, (finished) => {
      if (finished) runOnJS(revelarResultado)();
    });
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#2D6A4F', '#1B4332']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <StatusBar style="light" />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              onPress={() => router.back()}
              style={styles.headerBtn}
            >
              <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.titulo}>CARA OU COROA</Text>

            {/* Espaçador simétrico mantém o título centralizado */}
            <View style={styles.headerBtn} />
          </View>

          {/* ── Moeda + Resultado ─────────────────────────────────────────── */}
          <View style={styles.areaCentral}>

            {/* Container 180×180 — base para o position: absolute do verso */}
            <View style={styles.moedaContainer}>

              {/* Frente — CARA */}
              <Animated.View style={[styles.face, styles.faceCara, frontAnimStyle]}>
                <Text style={styles.faceTexto}>CARA</Text>
              </Animated.View>

              {/* Verso — COROA (sobreposto, position: absolute) */}
              <Animated.View style={[styles.face, styles.faceCoroa, styles.faceVerso, backAnimStyle]}>
                <Text style={styles.faceTexto}>COROA</Text>
              </Animated.View>

            </View>

          </View>

          {/* ── Botão JOGAR ───────────────────────────────────────────────── */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Jogar cara ou coroa"
              onPress={jogar}
              disabled={girando}
              style={[styles.btnJogar, girando && styles.btnJogarDisabled]}
            >
              <Text style={styles.btnJogarTexto}>
                {girando ? '...' : 'JOGAR'}
              </Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: '#1B4332',
  },
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    flex: 1,
    fontFamily: 'BebasNeue',
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },

  // ── Área central ──────────────────────────────────────────────────────────
  areaCentral: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },

  // Container fixo: define o espaço para o posicionamento absoluto do verso
  moedaContainer: {
    width: 180,
    height: 180,
  },

  // ── Faces da moeda ────────────────────────────────────────────────────────
  // backfaceVisibility: 'hidden' aplicado aqui → ambas as faces o herdam.
  // Sem overflow: 'hidden' para permitir que a sombra renderize corretamente no iOS.
  face: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    backfaceVisibility: 'hidden',
    // Sombra sutil (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Sombra Android
    elevation: 8,
  },
  faceCara: {
    backgroundColor: '#FFD700',
    borderColor: '#B8860B',
  },
  faceCoroa: {
    backgroundColor: '#C0C0C0',
    borderColor: '#808080',
  },
  // Verso sobreposto exatamente sobre a frente
  faceVerso: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  faceTexto: {
    fontFamily: 'BebasNeue',
    fontSize: 36,
    color: '#1B4332',
    letterSpacing: 2,
  },

  // ── Botão JOGAR ───────────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  btnJogar: {
    width: '70%',
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnJogarDisabled: {
    opacity: 0.5,
  },
  btnJogarTexto: {
    fontFamily: 'BebasNeue',
    fontSize: 26,
    color: '#1B4332',
    letterSpacing: 1,
  },
});
