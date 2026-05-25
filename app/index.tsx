import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useJogo } from '@/hooks/useJogo';
import type { HistoricoEntry } from '@/context/JogoContext';

// ─── Marcador de Pontos ─────────────────────────────────────────────────────
// Issues pendentes (próximas branches):
//   #10 HistoryHUD — painel glassmorphism + log de quedas
//   #12 WinnerOverlay — fim de jogo
//   #13 Keep Awake na tela do marcador
// ─────────────────────────────────────────────────────────────────────────────

// ── Tipo do estado do modal de renomear ─────────────────────────────────────
interface RenomearModalState {
  visivel: boolean;
  time: 'time1' | 'time2';
  valor: string;
}

const RENOMEAR_MODAL_FECHADO: RenomearModalState = {
  visivel: false,
  time: 'time1',
  valor: '',
};

export default function Index() {
  const insets = useSafeAreaInsets();

  const {
    state,
    maoDeOnze,
    temPartidaSalva,
    adicionarPonto,
    removerPonto,
    avancarTruco,
    voltarTruco,
    renomearTime,
    novaPartida,
    continuarPartida,
  } = useJogo();

  // ── Estado local: modais ────────────────────────────────────────────────
  const [renomearModal, setRenomearModal] = useState<RenomearModalState>(
    RENOMEAR_MODAL_FECHADO,
  );
  const [novaPartidaModal, setNovaPartidaModal] = useState(false);
  const [historicoModal, setHistoricoModal] = useState(false);

  // ── Dialog "Continuar partida?" ─────────────────────────────────────────
  // Exibido uma única vez ao montar, se houver partida salva com progresso.
  useEffect(() => {
    if (!temPartidaSalva) return;
    Alert.alert(
      'Partida em andamento',
      'Deseja continuar a última partida?',
      [
        { text: 'Nova Partida', style: 'destructive', onPress: novaPartida },
        { text: 'Continuar',    style: 'default',     onPress: continuarPartida },
      ],
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intencional: executa apenas no mount; referências são estáveis

  // ── Label dinâmica do botão TRUCO ───────────────────────────────────────
  // Exibe o próximo passo do ciclo que será acionado ao tocar:
  //   valorTruco=1  → "TRUCO"  (vai pedir truco, próximo valor será 3)
  //   valorTruco=3  → "SEIS"   (vai pedir seis,  próximo valor será 6)
  //   valorTruco=6  → "NOVE"   (vai pedir nove,  próximo valor será 9)
  //   valorTruco=9  → "DOZE"   (vai pedir doze,  próximo valor será 12)
  //   valorTruco=12 → "TRUCO"  (ciclo completo, volta para 1 ao registrar queda)
  const trucoLabel =
    state.valorTruco === 3  ? 'SEIS'  :
    state.valorTruco === 6  ? 'NOVE'  :
    state.valorTruco === 9  ? 'DOZE'  :
    'TRUCO'; // valorTruco === 1 ou 12

  // ── Handlers do modal de renomear ───────────────────────────────────────
  function abrirRenomear(time: 'time1' | 'time2') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRenomearModal({
      visivel: true,
      time,
      valor: state[time].nome,
    });
  }

  function confirmarRenomear() {
    const nome = renomearModal.valor.trim();
    if (nome) renomearTime(renomearModal.time, nome);
    setRenomearModal(RENOMEAR_MODAL_FECHADO);
  }

  function cancelarRenomear() {
    setRenomearModal(RENOMEAR_MODAL_FECHADO);
  }

  // ── Helper: formata uma entrada do histórico como string ────────────────
  // Ex.: "Nós +3 → 4 × 1"  |  "Eles -1 → 3 × 1"
  function formatarEntrada(entrada: HistoricoEntry): string {
    const nomeTime =
      entrada.time === 'time1' ? state.time1.nome : state.time2.nome;
    const sinal = entrada.pontosSomados > 0 ? '+' : '';
    return `${nomeTime} ${sinal}${entrada.pontosSomados} → ${entrada.placarApos}`;
  }

  // ── Handler do botão de nova partida (header) ───────────────────────────
  function confirmarNovaPartida() {
    setNovaPartidaModal(true);
  }

  return (
    <LinearGradient
      colors={['#2D6A4F', '#1B4332']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar style="light" />

      <SafeAreaView
        style={[styles.safe, { paddingBottom: 60 + insets.bottom }]}
        edges={['top']}
      >

        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <View style={styles.header}>
          {/* Botão ☰ — menu sanduíche (esquerda) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            onPress={() => Alert.alert('Menu', 'Em construção — Issue #5 / SideMenu.tsx')}
            style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="menu" size={28} color="#FFFFFF" />
          </Pressable>

          {/* Botão ↺ — nova partida (direita) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nova partida"
            onPress={confirmarNovaPartida}
            style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="refresh" size={24} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        {/* ── ÁREA DO PLACAR ────────────────────────────────────────────── */}
        <View style={styles.scoreArea}>

          {/* Metade esquerda — Time 1 */}
          <View style={styles.scoreHalf}>

            {/* Toque longo no nome abre modal de renomear */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toque longo para renomear o time 1"
              onLongPress={() => abrirRenomear('time1')}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={styles.teamName}>{state.time1.nome}</Text>
            </Pressable>

            <View style={styles.scoreNumberWrap}>
              {/* Dourado quando mão de 11 (11 pontos), branco nos demais */}
              <Text style={[
                styles.scoreText,
                { color: maoDeOnze.time1 ? '#FFD700' : '#FFFFFF' },
              ]}>
                {state.time1.pontos}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Adicionar ${state.valorTruco} ponto(s) ao time 1`}
              onPress={() => {
                adicionarPonto('time1');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }}
              style={styles.scorePlusBtn}
            >
              <Text style={styles.scorePlusBtnText}>+{state.valorTruco}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Remover ponto do time 1"
              onPress={() => {
                removerPonto('time1');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={styles.scoreMinusBtn}
            >
              <Text style={styles.scoreMinusBtnText}>-1</Text>
            </TouchableOpacity>

          </View>

          {/* Divisória vertical central */}
          <View style={styles.dividerV} />

          {/* Metade direita — Time 2 */}
          <View style={styles.scoreHalf}>

            {/* Toque longo no nome abre modal de renomear */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toque longo para renomear o time 2"
              onLongPress={() => abrirRenomear('time2')}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={styles.teamName}>{state.time2.nome}</Text>
            </Pressable>

            <View style={styles.scoreNumberWrap}>
              <Text style={[
                styles.scoreText,
                { color: maoDeOnze.time2 ? '#FFD700' : '#FFFFFF' },
              ]}>
                {state.time2.pontos}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Adicionar ${state.valorTruco} ponto(s) ao time 2`}
              onPress={() => {
                adicionarPonto('time2');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }}
              style={styles.scorePlusBtn}
            >
              <Text style={styles.scorePlusBtnText}>+{state.valorTruco}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Remover ponto do time 2"
              onPress={() => {
                removerPonto('time2');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={styles.scoreMinusBtn}
            >
              <Text style={styles.scoreMinusBtnText}>-1</Text>
            </TouchableOpacity>

          </View>

        </View>

        {/* ── ZONA DO HUD ───────────────────────────────────────────────── */}
        <View style={styles.hud}>

          {/* Botão TRUCO — avança o ciclo: TRUCO → SEIS → NOVE → DOZE → TRUCO */}
          <TouchableOpacity
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Botão truco — valor atual: ${state.valorTruco}`}
            onPress={() => {
              avancarTruco();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }}
            style={styles.trucoBtn}
          >
            <Text style={styles.trucoBtnText}>{trucoLabel}</Text>
          </TouchableOpacity>

          {/* Botão CORRER — reserva espaço fixo; opacity:0 + disabled quando valorTruco===1
               Usar disabled/opacity em vez de renderização condicional evita que o
               layout "pule" quando o botão aparece/desaparece. */}
          <TouchableOpacity
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Correr — cancelar truco"
            disabled={state.valorTruco === 1}
            onPress={() => {
              voltarTruco();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            style={[
              styles.correrBtn,
              { opacity: state.valorTruco === 1 ? 0 : 1 },
            ]}
          >
            <Text style={styles.correrBtnText}>CORRER</Text>
          </TouchableOpacity>

          {/* ── Histórico — últimas 2 entradas; toque abre modal completo ── */}
          <TouchableOpacity
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Ver histórico de quedas"
            onPress={() => setHistoricoModal(true)}
            style={styles.historyHud}
          >
            {state.historico.length === 0 ? (
              <Text style={styles.historyEmpty}>Histórico aparece aqui</Text>
            ) : (
              state.historico.slice(-2).map((entrada, idx) => (
                <Text
                  key={entrada.timestamp + idx}
                  style={[
                    styles.historyEntry,
                    entrada.tipo === 'correcao' && styles.historyEntryCorrecao,
                  ]}
                >
                  {formatarEntrada(entrada)}
                </Text>
              ))
            )}
          </TouchableOpacity>

        </View>

      </SafeAreaView>

      {/* ── RODAPÉ — reserva para banner AdMob (Issue #16) ────────────────
          position: 'absolute' → sempre colado na base da tela.
          height = 60px (banner) + insets.bottom (navigation bar Android).
          paddingBottom → justifyContent:'center' centraliza nos 60px de conteúdo.
          ────────────────────────────────────────────────────────────────── */}
      <View style={[styles.footer, {
        height: 60 + insets.bottom,
        paddingBottom: insets.bottom,
      }]}>
        <Text style={styles.footerText}>[ Banner Ad ]</Text>
      </View>

      {/* ── MODAL — Renomear time ─────────────────────────────────────────── */}
      <Modal
        visible={renomearModal.visivel}
        transparent
        animationType="fade"
        onRequestClose={cancelarRenomear}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            <Text style={styles.modalTitle}>Renomear time</Text>

            <TextInput
              style={styles.modalInput}
              value={renomearModal.valor}
              onChangeText={(texto) =>
                setRenomearModal((prev) => ({ ...prev, valor: texto }))
              }
              placeholder="Nome do time"
              placeholderTextColor="rgba(255,255,255,0.35)"
              selectionColor="#FFD700"
              autoFocus
              maxLength={20}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={cancelarRenomear}
                style={[styles.modalBtn, styles.modalBtnCancel]}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={confirmarRenomear}
                style={[styles.modalBtn, styles.modalBtnConfirm]}
              >
                <Text style={styles.modalBtnConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* ── MODAL — Nova partida ──────────────────────────────────────────── */}
      <Modal
        visible={novaPartidaModal}
        transparent
        animationType="fade"
        onRequestClose={() => setNovaPartidaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            <Text style={styles.modalTitle}>NOVA PARTIDA</Text>
            <Text style={styles.modalBody}>Zerar o placar?</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setNovaPartidaModal(false)}
                style={[styles.modalBtn, styles.modalBtnCancel]}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  novaPartida();
                  setNovaPartidaModal(false);
                }}
                style={[styles.modalBtn, styles.modalBtnConfirm]}
              >
                <Text style={styles.modalBtnConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* ── MODAL — Histórico completo ────────────────────────────────────── */}
      <Modal
        visible={historicoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoricoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.historicoCard]}>

            <Text style={styles.modalTitle}>HISTÓRICO</Text>

            <ScrollView
              style={styles.historicoScroll}
              showsVerticalScrollIndicator={false}
            >
              {state.historico.length === 0 ? (
                <Text style={styles.historicoVazio}>
                  Nenhuma queda registrada ainda
                </Text>
              ) : (
                state.historico.map((entrada, idx) => (
                  <View key={entrada.timestamp + idx}>
                    {idx > 0 && <View style={styles.historicoDivider} />}
                    <Text
                      style={[
                        styles.historicoEntrada,
                        entrada.tipo === 'correcao' && styles.historicoEntradaCorrecao,
                      ]}
                    >
                      {formatarEntrada(entrada)}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setHistoricoModal(false)}
              style={styles.historicoFecharBtn}
            >
              <Text style={styles.historicoFecharBtnText}>FECHAR</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  gradient: {
    flex: 1,
  },

  safe: {
    flex: 1,
  },

  // ── Header ────────────────────────────────────────────
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  headerBtn: {
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
  // Cor definida inline: branco padrão, #FFD700 quando mão de 11
  scoreText: {
    fontFamily: 'BebasNeue',
    fontSize: 160,
    lineHeight: 170,
  },

  // Botão +N
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

  // Botão -1
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
  hud: {
    alignItems: 'center',
    paddingBottom: 12,
  },

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

  correrBtn: {
    width: '60%',
    backgroundColor: 'rgba(255,0,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.5)',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  correrBtnText: {
    fontFamily: 'BebasNeue',
    fontSize: 22,
    color: '#FF6B6B',
    letterSpacing: 1,
  },

  // ── HUD mini-histórico ──────────────────────────────────────────────────
  historyHud: {
    marginTop: 10,
    alignItems: 'center',
    minHeight: 36, // reserva espaço mesmo quando vazio
    paddingHorizontal: 16,
  },
  historyEmpty: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    textAlign: 'center',
  },
  historyEntry: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  historyEntryCorrecao: {
    color: 'rgba(255,120,120,0.8)',
  },

  // ── Modal histórico completo ─────────────────────────────────────────────
  historicoCard: {
    maxHeight: '75%', // limita altura para não cobrir a tela toda
  },
  historicoScroll: {
    marginBottom: 16,
  },
  historicoVazio: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  historicoEntrada: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    paddingVertical: 8,
  },
  historicoEntradaCorrecao: {
    color: 'rgba(255,120,120,0.8)',
  },
  historicoDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  historicoFecharBtn: {
    alignSelf: 'center',
    width: '60%',
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  historicoFecharBtnText: {
    fontFamily: 'BebasNeue',
    fontSize: 18,
    color: '#FFD700',
  },

  // ── Rodapé (Banner Ad) ──────────────────────────────────
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

  // ── Modal de renomear ───────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1B4332',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontFamily: 'BebasNeue',
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  // Subtítulo/corpo usado no modal de confirmação (sem TextInput)
  modalBody: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  modalBtnCancelText: {
    fontFamily: 'BebasNeue',
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
  },
  modalBtnConfirm: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  modalBtnConfirmText: {
    fontFamily: 'BebasNeue',
    fontSize: 18,
    color: '#FFD700',
  },
});
