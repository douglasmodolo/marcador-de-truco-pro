import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
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
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { captureRef } from 'react-native-view-shot';

import { useJogo } from '@/hooks/useJogo';
import { useConfig } from '@/hooks/useConfig';
import type { FontSizeKey } from '@/hooks/useConfig';
import type { HistoricoEntry } from '@/context/JogoContext';

// ─── Marcador de Pontos ─────────────────────────────────────────────────────
// Issues pendentes (próximas branches):
//   #19 AdMob — banner real no rodapé + interstitial pós-partida
//   #20 Premium — ocultar banner / compra RevenueCat
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
  // Mantém a tela acesa enquanto o marcador estiver aberto.
  useKeepAwake();

  const insets = useSafeAreaInsets();
  const router  = useRouter();

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
    resetarNomes,
    continuarPartida,
  } = useJogo();

  // ── Configurações do usuário (persistidas no MMKV) ──────────────────────
  const {
    hapticsEnabled,
    setHapticsEnabled,
    placarFontSizeKey,
    setPlacarFontSizeKey,
    placarFontSize,
  } = useConfig();

  // Helper: dispara haptic apenas se o usuário não desligou a vibração.
  function haptic(fn: () => void) {
    if (hapticsEnabled) fn();
  }

  // ── Estado local: modais ────────────────────────────────────────────────
  const [renomearModal, setRenomearModal] = useState<RenomearModalState>(
    RENOMEAR_MODAL_FECHADO,
  );
  const [novaPartidaModal, setNovaPartidaModal] = useState(false);
  const [historicoModal, setHistoricoModal]     = useState(false);
  const [menuVisivel, setMenuVisivel]           = useState(false);
  const [configModal, setConfigModal]           = useState(false);
  // Overlay de vitória: modal de confirmação de nomes + info capturada ao fim
  const [vitoriaNomesModal, setVitoriaNomesModal] = useState(false);
  const [vitoriaInfo, setVitoriaInfo] = useState<{
    nome: string;
    nomePerdedor: string;
    placar: string;
  } | null>(null);

  // ── Ref para captura do cartão de compartilhamento ──────────────────────
  const cartaoRef = useRef<View>(null);

  async function compartilhar() {
    try {
      const uri = await captureRef(cartaoRef, { format: 'png', quality: 1 });
      await Share.share(
        {
          // Android usa message; iOS usa url (a imagem) + message (texto opcional)
          message: `🏆 ${vitoriaInfo?.nome ?? ''} venceu! Placar: ${vitoriaInfo?.placar ?? ''}\nBaixe o Marcador de Truco Pro: play.google.com/store/apps/details?id=com.seuapp`,
          url: uri,
        },
        { dialogTitle: 'Compartilhar resultado' },
      );
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  }

  // ── Animação — CORRER fade in/out ────────────────────────────────────────
  // Inicia em 0 (valorTruco === 1 é o estado padrão).
  // Anima suavemente para 1 ao primeiro TRUCO e de volta para 0 ao CORRER/queda.
  const correrOpacity = useSharedValue(0);
  const animStyleCorrer = useAnimatedStyle(() => ({
    opacity: correrOpacity.value,
  }));

  useEffect(() => {
    correrOpacity.value = withTiming(state.valorTruco === 1 ? 0 : 1, { duration: 200 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.valorTruco]);

  // ── Overlay de vitória: captura info + haptic quando o jogo termina ─────
  // Não há mais navegação — o overlay é um Modal nativo por cima do marcador.
  // vitoriaInfo é salvo aqui para que o conteúdo do modal não exiba valores
  // zerados durante o fade-out quando novaPartida() resetar o state.
  useEffect(() => {
    if (!state.fimDeJogo || !state.vencedor) return;
    const perdedor = state.vencedor === 'time1' ? 'time2' : 'time1';
    setVitoriaInfo({
      nome:         state[state.vencedor].nome,
      nomePerdedor: state[perdedor].nome,
      placar:       `${state.time1.pontos} × ${state.time2.pontos}`,
    });
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.fimDeJogo]);

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
  const trucoLabel =
    state.valorTruco === 3  ? 'SEIS'  :
    state.valorTruco === 6  ? 'NOVE'  :
    state.valorTruco === 9  ? 'DOZE'  :
    'TRUCO';

  // ── Handlers do modal de renomear ───────────────────────────────────────
  function abrirRenomear(time: 'time1' | 'time2') {
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
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

  // ── Itens do menu sanduíche ─────────────────────────────────────────────
  // Definidos aqui para ter acesso a router/setMenuVisivel/Linking.
  const menuItens: Array<{
    emoji: string;
    label: string;
    premium?: boolean;
    onPress: () => void;
  }> = [
    {
      emoji: '🎲',
      label: 'Sorteio de duplas',
      onPress: () => { setMenuVisivel(false); router.push('/sorter'); },
    },
    {
      emoji: '🪙',
      label: 'Cara ou coroa',
      onPress: () => { setMenuVisivel(false); router.push('/coin'); },
    },
    {
      emoji: '🛒',
      label: 'Comprar baralhos',
      onPress: () => {
        setMenuVisivel(false);
        Linking.openURL('https://lista.mercadolivre.com.br/baralho');
      },
    },
    {
      emoji: '⚙️',
      label: 'Configurações',
      onPress: () => { setMenuVisivel(false); setConfigModal(true); },
    },
    {
      emoji: '⭐',
      label: 'Seja Premium',
      premium: true,
      onPress: () => { setMenuVisivel(false); router.push('/premium'); },
    },
  ];

  return (
    <View style={styles.root}>
      {/* backgroundColor sólido como fallback: se o LinearGradient demorar
          um frame para renderizar, o verde escuro já está visível — nunca
          há frame branco/transparente durante a transição. */}
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            onPress={() => {
              setMenuVisivel(true);
              haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
            }}
            style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="menu" size={28} color="#FFFFFF" />
          </Pressable>

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

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toque longo para renomear o time 1"
              onLongPress={() => abrirRenomear('time1')}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={styles.teamName}>{state.time1.nome}</Text>
            </Pressable>

            {/* key muda a cada ponto → React remonta → FadeIn dispara */}
            <Animated.View
              key={state.time1.pontos}
              entering={FadeIn.duration(400)}
              style={styles.scoreNumberWrap}
            >
              <Text style={[
                styles.scoreText,
                { color: maoDeOnze.time1 ? '#FFD700' : '#FFFFFF', fontSize: placarFontSize, lineHeight: placarFontSize + 10 },
              ]}>
                {state.time1.pontos}
              </Text>
            </Animated.View>

            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Adicionar ${state.valorTruco} ponto(s) ao time 1`}
              onPress={() => {
                adicionarPonto('time1');
                haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
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
                haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
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

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toque longo para renomear o time 2"
              onLongPress={() => abrirRenomear('time2')}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={styles.teamName}>{state.time2.nome}</Text>
            </Pressable>

            {/* key muda a cada ponto → React remonta → FadeIn dispara */}
            <Animated.View
              key={state.time2.pontos}
              entering={FadeIn.duration(400)}
              style={styles.scoreNumberWrap}
            >
              <Text style={[
                styles.scoreText,
                { color: maoDeOnze.time2 ? '#FFD700' : '#FFFFFF', fontSize: placarFontSize, lineHeight: placarFontSize + 10 },
              ]}>
                {state.time2.pontos}
              </Text>
            </Animated.View>

            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Adicionar ${state.valorTruco} ponto(s) ao time 2`}
              onPress={() => {
                adicionarPonto('time2');
                haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
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
                haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
              }}
              style={styles.scoreMinusBtn}
            >
              <Text style={styles.scoreMinusBtnText}>-1</Text>
            </TouchableOpacity>

          </View>

        </View>

        {/* ── ZONA DO HUD ───────────────────────────────────────────────── */}
        <View style={styles.hud}>

          {/* Botão TRUCO */}
          <TouchableOpacity
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Botão truco — valor atual: ${state.valorTruco}`}
            onPress={() => {
              avancarTruco();
              haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
            }}
            style={styles.trucoBtn}
          >
            <Text style={styles.trucoBtnText}>{trucoLabel}</Text>
          </TouchableOpacity>

          {/* Botão CORRER — Animated.View controla opacity com withTiming;
               disabled bloqueia toque enquanto invisível.
               O wrapper reserva espaço fixo (width + marginTop) para não
               deslocar o layout ao aparecer/desaparecer. */}
          <Animated.View style={[styles.correrBtnWrapper, animStyleCorrer]}>
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Correr — cancelar truco"
              disabled={state.valorTruco === 1}
              onPress={() => {
                voltarTruco();
                haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
              }}
              style={styles.correrBtn}
            >
              <Text style={styles.correrBtnText}>CORRER</Text>
            </TouchableOpacity>
          </Animated.View>

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
              state.historico.slice(-2).map((entrada) => (
                // key = timestamp único: React re-monta entradas novas (entering)
                // e desmonta as que saem do slice(-2) (exiting).
                <Animated.View
                  key={entrada.timestamp}
                  entering={FadeInDown.duration(300)}
                  exiting={FadeOutUp.duration(200)}
                >
                  <Text
                    style={[
                      styles.historyEntry,
                      entrada.tipo === 'correcao' && styles.historyEntryCorrecao,
                    ]}
                  >
                    {formatarEntrada(entrada)}
                  </Text>
                </Animated.View>
              ))
            )}
          </TouchableOpacity>

        </View>

      </SafeAreaView>

      {/* ── RODAPÉ — reserva para banner AdMob ───────────────────────────── */}
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
                  <View key={entrada.timestamp}>
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

      {/* ── MODAL — Menu sanduíche ─────────────────────────────────────────── */}
      {/* animationType="slide" desliza o card de baixo para cima.
          Pressable externo (fundo escuro) fecha ao toque fora do card.
          Pressable interno (card) absorve os toques e impede propagação. */}
      <Modal
        visible={menuVisivel}
        animationType="slide"
        transparent
        onRequestClose={() => setMenuVisivel(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisivel(false)}>
          <Pressable
            style={[styles.menuCard, { paddingBottom: insets.bottom + 16 }]}
            onPress={() => {}} // absorve toque — impede fechar ao clicar dentro do card
          >
            {/* Alça decorativa */}
            <View style={styles.menuAlca} />

            {menuItens.map((item, idx) => (
              <View key={item.label}>
                {idx > 0 && <View style={styles.menuDivider} />}
                <TouchableOpacity
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={item.onPress}
                  style={styles.menuItem}
                >
                  <Text style={styles.menuEmoji}>{item.emoji}</Text>
                  <Text style={[
                    styles.menuLabel,
                    item.premium ? styles.menuLabelPremium : undefined,
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── MODAL — Configurações ────────────────────────────────────────────── */}
      <Modal
        visible={configModal}
        transparent
        animationType="fade"
        onRequestClose={() => setConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            {/* Cabeçalho */}
            <View style={styles.configHeader}>
              <Text style={styles.configTitulo}>CONFIGURAÇÕES</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Fechar configurações"
                onPress={() => setConfigModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.configDivider} />

            {/* Opção 1 — Vibração */}
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>VIBRAÇÃO</Text>
              <Switch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#FFD700' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.configDivider} />

            {/* Opção 2 — Tamanho do placar */}
            <View style={styles.configColuna}>
              <Text style={styles.configLabel}>TAMANHO DO PLACAR</Text>
              <View style={styles.configFontRow}>
                {(['P', 'M', 'G'] as FontSizeKey[]).map((key) => (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.8}
                    onPress={() => setPlacarFontSizeKey(key)}
                    style={[
                      styles.configFontBtn,
                      placarFontSizeKey === key && styles.configFontBtnActive,
                    ]}
                  >
                    <Text style={[
                      styles.configFontBtnText,
                      placarFontSizeKey === key && styles.configFontBtnTextActive,
                    ]}>
                      {key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>
        </View>
      </Modal>

      {/* ── OVERLAY — Fim de jogo ──────────────────────────────────────────── */}
      {/* Modal nativo: animationType="fade" + statusBarTranslucent cobre 100%
          da tela incluindo status bar, sem troca de tela, sem flash. */}
      <Modal
        visible={state.fimDeJogo}
        animationType="fade"
        statusBarTranslucent
        transparent={false}
        onRequestClose={() => {}} // impede fechar com botão voltar durante vitória
      >
        {/* View sólida como fallback — mesmo padrão do root da tela */}
        <View style={styles.vitoriaRoot}>
          <LinearGradient
            colors={['#2D6A4F', '#1B4332']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.vitoriaGradient}
          >
            <StatusBar style="light" />
            <SafeAreaView style={styles.vitoriaSafe} edges={['top', 'bottom']}>

              {/* ── Conteúdo central com animações escalonadas ─────────────── */}
              <View style={styles.vitoriaContent}>
                <Animated.View entering={FadeIn.duration(600)}>
                  <Text style={styles.vitoriaTrophy}>🏆</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.duration(500).delay(200)}>
                  <Text style={styles.vitoriaLabel}>VENCEDOR</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.duration(600).delay(400)}>
                  <Text style={styles.vitoriaNome} numberOfLines={2} adjustsFontSizeToFit>
                    {vitoriaInfo?.nome ?? ''}
                  </Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.duration(500).delay(600)}>
                  <Text style={styles.vitoriaPlacar}>{vitoriaInfo?.placar ?? ''}</Text>
                </Animated.View>
              </View>

              {/* ── Botões de ação ──────────────────────────────────────────── */}
              <Animated.View
                entering={FadeInDown.duration(500).delay(800)}
                style={styles.vitoriaActions}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Nova partida"
                  onPress={() => setVitoriaNomesModal(true)}
                  style={styles.vitoriaBtnNovaPartida}
                >
                  <Text style={styles.vitoriaBtnNovaPartidaText}>NOVA PARTIDA</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Manter times e jogar nova partida"
                  onPress={novaPartida}
                  style={styles.vitoriaBtnManterTimes}
                >
                  <Text style={styles.vitoriaBtnManterTimesText}>MANTER TIMES E JOGAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Compartilhar resultado"
                  onPress={compartilhar}
                  style={styles.vitoriaBtnCompartilhar}
                >
                  <Ionicons name="share-social" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.vitoriaBtnCompartilharText}>COMPARTILHAR</Text>
                </TouchableOpacity>
              </Animated.View>

            </SafeAreaView>
          </LinearGradient>
        </View>

        {/* ── Cartão oculto para captura — posicionado fora da área visível ── */}
        {/* Permanece montado enquanto o Modal está visível (state.fimDeJogo)   */}
        {/* para que captureRef() encontre o layout já calculado.              */}
        <View ref={cartaoRef} style={styles.cartao} collapsable={false}>
          <LinearGradient
            colors={['#2D6A4F', '#1B4332']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.cartaoGradiente}
          >
            <Text style={styles.cartaoTrofeu}>🏆</Text>
            <View style={styles.cartaoSeparador} />
            <Text style={styles.cartaoVencedorLabel}>VENCEDOR</Text>
            <Text style={styles.cartaoVencedorNome} numberOfLines={2} adjustsFontSizeToFit>
              {vitoriaInfo?.nome ?? ''}
            </Text>
            <Text style={styles.cartaoPlacar}>{vitoriaInfo?.placar ?? ''}</Text>
            <View style={styles.cartaoPerdedorRow}>
              <Text style={styles.cartaoPato}>🦆</Text>
              <Text style={styles.cartaoPerdedorNome}>{vitoriaInfo?.nomePerdedor ?? ''}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── Modal aninhado — confirmar nomes para nova partida ─────────── */}
        <Modal
          visible={vitoriaNomesModal}
          transparent
          animationType="fade"
          onRequestClose={() => setVitoriaNomesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>NOVA PARTIDA</Text>
              <Text style={styles.modalBody}>Manter os nomes dos times?</Text>
              <Text style={styles.vitoriaModalTeams}>
                {state.time1.nome}  vs  {state.time2.nome}
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => { setVitoriaNomesModal(false); resetarNomes(); novaPartida(); }}
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                >
                  <Text style={styles.modalBtnCancelText}>NÃO</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => { setVitoriaNomesModal(false); novaPartida(); }}
                  style={[styles.modalBtn, styles.modalBtnConfirm]}
                >
                  <Text style={styles.modalBtnConfirmText}>SIM</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setVitoriaNomesModal(false)}
                style={styles.vitoriaModalBtnCancelar}
              >
                <Text style={styles.vitoriaModalBtnCancelarText}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </Modal>

    </LinearGradient>
    </View>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // Wrapper sólido: garante cor de fundo enquanto o gradiente não renderizou
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

  // Wrapper animado do botão CORRER — carrega layout (width/marginTop).
  // A Animated.View envolve o TouchableOpacity para que withTiming
  // anime a opacity sem interferir no toque gerenciado por disabled.
  correrBtnWrapper: {
    alignSelf: 'center',
    width: '60%',
    marginTop: 8,
  },
  correrBtn: {
    width: '100%',
    backgroundColor: 'rgba(255,0,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.5)',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 36,
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

  // ── Modais — estilos compartilhados ────────────────────────────────────
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

  // ── Modal histórico completo ─────────────────────────────────────────────
  historicoCard: {
    maxHeight: '75%',
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

  // ── Menu sanduíche ───────────────────────────────────────────────────────
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  menuCard: {
    backgroundColor: '#1B4332',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },
  menuAlca: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  menuEmoji: {
    fontSize: 22,
    marginRight: 16,
  },
  menuLabel: {
    fontFamily: 'BebasNeue',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  menuLabelPremium: {
    color: '#FFD700',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 24,
  },

  // ── Overlay de vitória ────────────────────────────────────────────────────
  vitoriaRoot:     { flex: 1, backgroundColor: '#1B4332' },
  vitoriaGradient: { flex: 1 },
  vitoriaSafe:     { flex: 1 },
  vitoriaContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  vitoriaTrophy: {
    fontSize: 80,
    lineHeight: 96,
    marginBottom: 8,
    textAlign: 'center',
  },
  vitoriaLabel: {
    fontFamily: 'BebasNeue',
    fontSize: 28,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  vitoriaNome: {
    fontFamily: 'BebasNeue',
    fontSize: 72,
    color: '#FFD700',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  vitoriaPlacar: {
    fontFamily: 'BebasNeue',
    fontSize: 32,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  vitoriaActions: {
    alignItems: 'center',
    paddingBottom: 40,
    gap: 12,
  },
  vitoriaBtnNovaPartida: {
    width: '80%',
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  vitoriaBtnNovaPartidaText: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: '#1B4332',
    letterSpacing: 1,
  },
  vitoriaBtnManterTimes: {
    width: '80%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  vitoriaBtnManterTimesText: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  vitoriaModalTeams: {
    fontFamily: 'BebasNeue',
    fontSize: 18,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginBottom: 20,
  },
  vitoriaModalBtnCancelar: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  vitoriaModalBtnCancelarText: {
    fontFamily: 'BebasNeue',
    fontSize: 16,
    color: 'rgba(255,255,255,0.4)',
  },

  // ── Botão compartilhar (vitória) ─────────────────────────────────────────
  vitoriaBtnCompartilhar: {
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 16,
    paddingVertical: 14,
  },
  vitoriaBtnCompartilharText: {
    fontFamily: 'BebasNeue',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // ── Cartão de compartilhamento (oculto, capturado via react-native-view-shot) ──
  cartao: {
    position: 'absolute',
    left: -9999,
    top: 0,
    width: 400,
    height: 400,
  },
  cartaoGradiente: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  cartaoTrofeu: {
    fontSize: 64,
    textAlign: 'center',
  },
  cartaoSeparador: {
    width: 60,
    height: 2,
    backgroundColor: '#FFD700',
    marginVertical: 8,
  },
  cartaoVencedorLabel: {
    fontFamily: 'BebasNeue',
    fontSize: 20,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 3,
    textAlign: 'center',
  },
  cartaoVencedorNome: {
    fontFamily: 'BebasNeue',
    fontSize: 56,
    color: '#FFD700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  cartaoPlacar: {
    fontFamily: 'BebasNeue',
    fontSize: 28,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  cartaoPerdedorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  cartaoPato: {
    fontSize: 32,
  },
  cartaoPerdedorNome: {
    fontFamily: 'BebasNeue',
    fontSize: 28,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },

  // ── Modal de configurações ───────────────────────────────────────────────
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  configTitulo: {
    fontFamily: 'BebasNeue',
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  configDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 16,
  },
  // Linha: label à esquerda + controle à direita
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Coluna: label acima + controle abaixo
  configColuna: {
    gap: 12,
  },
  configLabel: {
    fontFamily: 'BebasNeue',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // Botões P / M / G
  configFontRow: {
    flexDirection: 'row',
    gap: 10,
  },
  configFontBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  configFontBtnActive: {
    backgroundColor: '#FFD700',
  },
  configFontBtnText: {
    fontFamily: 'BebasNeue',
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  configFontBtnTextActive: {
    color: '#1B4332',
  },
});
