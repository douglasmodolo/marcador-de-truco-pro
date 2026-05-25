import { Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// ─── Marcador de Pontos — Layout Visual Base ────────────────────────────────
// Implementação completa das features de gestos, estado e lógica nas issues:
//   #7  JogoContext — estado global e persistência MMKV
//   #8  ScoreHalf — gestos de tap e swipe com pontuação
//   #9  TrucoButton — ciclo de valores e haptic
//   #10 HistoryHUD — painel glassmorphism + log de quedas
//   #11 DuckButton — som quack + haptic
//   #12 WinnerOverlay — fim de jogo + tela do pato
//   #13 Keep Awake na tela do marcador
//   #14 Edição de nome de time (toque longo)
// ─────────────────────────────────────────────────────────────────────────────

export default function Index() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#2D6A4F', '#1B4332']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      {/* Ícones da status bar sempre brancos — fundo verde sempre escuro */}
      <StatusBar style="light" />

      {/* SafeAreaView gerencia o inset do topo.
          paddingBottom reserva espaço para o rodapé absolutamente posicionado
          (60px de conteúdo + insets.bottom da navigation bar do Android). */}
      <SafeAreaView
        style={[styles.safe, { paddingBottom: 60 + insets.bottom }]}
        edges={['top']}
      >

        {/* ── HEADER ───────────────────────────────────────────────────── */}
        {/* Apenas o botão ☰ — nomes dos times ficam dentro de cada metade */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            onPress={() => Alert.alert('Menu', 'Em construção — Issue #5 / SideMenu.tsx')}
            style={({ pressed }) => [styles.menuBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="menu" size={28} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ── ÁREA DO PLACAR ────────────────────────────────────────────── */}
        {/*
          flex: 1 — absorve todo o espaço entre header e HUD.
          Cada metade empilha: [nome do time] acima + [número] flex:1 abaixo.
          A linha divisória central corre do topo ao fim da área.
        */}
        <View style={styles.scoreArea}>

          {/* Metade esquerda — Time 1 */}
          <View style={styles.scoreHalf}>
            <Text style={styles.teamName}>NÓS</Text>
            <View style={styles.scoreNumberWrap}>
              <Text style={styles.scoreText}>0</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {/* Issue #8 — registrar queda */}}
              style={styles.scorePlusBtn}
            >
              <Text style={styles.scorePlusBtnText}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {/* Issue #8 — corrigir ponto */}}
              style={styles.scoreMinusBtn}
            >
              <Text style={styles.scoreMinusBtnText}>-1</Text>
            </TouchableOpacity>
          </View>

          {/* Divisória vertical central — 1px rgba(255,255,255,0.15) */}
          <View style={styles.dividerV} />

          {/* Metade direita — Time 2 */}
          <View style={styles.scoreHalf}>
            <Text style={styles.teamName}>ELES</Text>
            <View style={styles.scoreNumberWrap}>
              <Text style={styles.scoreText}>0</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {/* Issue #8 — registrar queda */}}
              style={styles.scorePlusBtn}
            >
              <Text style={styles.scorePlusBtnText}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {/* Issue #8 — corrigir ponto */}}
              style={styles.scoreMinusBtn}
            >
              <Text style={styles.scoreMinusBtnText}>-1</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* ── ZONA DO HUD ───────────────────────────────────────────────── */}
        {/*
          Coluna centralizada abaixo do placar.
          Lógica completa nas Issues #9 (TRUCO), #10 (Histórico) e #11 (Pato).
        */}
        <View style={styles.hud}>

          {/* Botão TRUCO! — 60% da largura da tela */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Truco — valor atual mais 3"
            activeOpacity={0.7}
            onPress={() => {/* Issue #9 — TrucoButton */}}
            style={styles.trucoBtn}
          >
            <Text style={styles.trucoBtnText}>TRUCO +3</Text>
          </TouchableOpacity>

          {/* Botão Pato 🦆 — zoeira */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Pato — zoeira"
            activeOpacity={0.7}
            onPress={() => {/* Issue #11 — DuckButton */}}
            style={styles.duckBtn}
          >
            <Text style={styles.duckBtnText}>🦆</Text>
          </TouchableOpacity>

          {/* Histórico — texto simples, sem card */}
          <Text style={styles.historyPlaceholder}>Histórico aparece aqui</Text>

        </View>

      </SafeAreaView>

      {/* ── RODAPÉ — reserva para banner AdMob ────────────────────────────
          position: 'absolute' fixa o rodapé na base da tela independente
          do conteúdo acima — elimina o problema de overflow do placar.
          height: 60 (conteúdo do banner) + insets.bottom (navigation bar).
          Implementar em feature/admob (Issue #16).
          Ocultar se usePremium.isPremium === true.
          ────────────────────────────────────────────────────────────────── */}
      {/* height = 60 (banner) + insets.bottom (navigation bar)
          paddingBottom = insets.bottom → justifyContent:'center' centraliza
          o texto nos 60px de conteúdo, acima da área da navigation bar */}
      <View style={[styles.footer, {
        height: 60 + insets.bottom,
        paddingBottom: insets.bottom,
      }]}>
        <Text style={styles.footerText}>[ Banner Ad ]</Text>
      </View>

    </LinearGradient>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // Gradiente cobre 100% da tela (inclui área da status bar)
  gradient: {
    flex: 1,
  },

  // SafeAreaView transparente — flex: 1 + paddingBottom (inline, dinâmico)
  // O paddingBottom = 60 + insets.bottom garante que nada fique atrás do rodapé.
  safe: {
    flex: 1,
  },

  // ── Header ────────────────────────────────────────────
  // Altura fixa 44px, fundo transparente, apenas botão ☰ à esquerda
  header: {
    height: 44,
    justifyContent: 'center',
    paddingLeft: 16,
  },
  menuBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Área do placar ─────────────────────────────────────
  scoreArea: {
    flex: 1,
    flexDirection: 'row',
  },
  scoreHalf: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  teamName: {
    fontFamily: 'BebasNeue',
    fontSize: 20,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    paddingTop: 12,
  },
  scoreNumberWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: 'BebasNeue',
    fontSize: 160,
    color: '#FFFFFF',
    lineHeight: 170,
  },

  // Botão +1 — registrar queda (Issue #8)
  scorePlusBtn: {
    width: '70%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 6,
  },
  scorePlusBtnText: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: '#FFFFFF',
  },

  // Botão -1 — corrigir ponto (Issue #8)
  scoreMinusBtn: {
    width: '70%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreMinusBtnText: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: 'rgba(255,255,255,0.6)',
  },

  // ── Divisória vertical ─────────────────────────────────
  dividerV: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // ── Zona do HUD ────────────────────────────────────────
  // Coluna centralizada — TRUCO + Pato + Histórico empilhados
  hud: {
    alignItems: 'center',
    paddingBottom: 12,
  },

  // Botão TRUCO! — 60% da largura da tela
  trucoBtn: {
    width: '60%',
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trucoBtnText: {
    fontFamily: 'BebasNeue',
    fontSize: 22,
    color: '#FFD700',
    letterSpacing: 1,
  },

  // Botão Pato 🦆
  duckBtn: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  duckBtnText: {
    fontSize: 32,
    lineHeight: 38,
  },

  // Histórico — texto simples sem card
  historyPlaceholder: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    textAlign: 'center',
  },

  // ── Rodapé (Banner Ad) ──────────────────────────────────
  // position: 'absolute' = fora do fluxo flex, sempre colado na base da tela.
  // height é definido inline: 60 (conteúdo) + insets.bottom (navigation bar).
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    letterSpacing: 1,
  },
});
