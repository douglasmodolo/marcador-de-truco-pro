import { useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeOutRight,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// ─── Sorteio de Duplas / Trios ──────────────────────────────────────────────
// Embaralha os jogadores com Fisher-Yates e divide em times de 2 ou 3.
// Jogadores que sobram (ex: 5 em modo duplas) ficam no último time.
// ─────────────────────────────────────────────────────────────────────────────

type Modo = 'duplas' | 'trios';

// Fisher-Yates — embaralhamento imparcial
function embaralhar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function formarTimes(jogadores: string[], modo: Modo): string[][] {
  const tamanho = modo === 'duplas' ? 2 : 3;
  const lista = embaralhar(jogadores);
  const times: string[][] = [];
  for (let i = 0; i < lista.length; i += tamanho) {
    times.push(lista.slice(i, i + tamanho));
  }
  return times;
}

export default function Sorter() {
  const router = useRouter();

  const [modo, setModo]           = useState<Modo>('duplas');
  const [jogadores, setJogadores] = useState<string[]>([]);
  const [inputNome, setInputNome] = useState('');
  const [times, setTimes]         = useState<string[][]>([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  // Key muda a cada sorteio → garante que FadeInDown re-dispara no SORTEAR DE NOVO
  const [sorteioKey, setSorteioKey] = useState(0);

  const inputRef = useRef<TextInput>(null);

  // ── Shake no input ao tentar adicionar nome inválido/duplicado ────────────
  const shakeX = useSharedValue(0);
  const animStyleInput = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  function shake() {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 45 }),
      withTiming( 10, { duration: 45 }),
      withTiming( -8, { duration: 45 }),
      withTiming(  8, { duration: 45 }),
      withTiming( -4, { duration: 45 }),
      withTiming(  0, { duration: 45 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // ── Condição para habilitar o sorteio ────────────────────────────────────
  // DUPLAS: mínimo 2 e múltiplo de 2  |  TRIOS: mínimo 3 e múltiplo de 3
  const podeSortear =
    modo === 'duplas'
      ? jogadores.length >= 4 && jogadores.length % 2 === 0
      : jogadores.length >= 6 && jogadores.length % 3 === 0;

  // ── Adicionar jogador ─────────────────────────────────────────────────────
  function adicionarJogador() {
    const nome = inputNome.trim();
    if (!nome) { shake(); return; }
    if (jogadores.some((j) => j.toLowerCase() === nome.toLowerCase())) {
      shake(); return;
    }
    setJogadores((prev) => [...prev, nome]);
    setInputNome('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Mantém o foco para adicionar o próximo rapidamente
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  // ── Remover jogador ───────────────────────────────────────────────────────
  function removerJogador(nome: string) {
    setJogadores((prev) => prev.filter((j) => j !== nome));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // ── Sortear ───────────────────────────────────────────────────────────────
  function sortear() {
    if (!podeSortear) return;
    setTimes(formarTimes(jogadores, modo));
    setSorteioKey((k) => k + 1);
    setModalVisivel(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  function sortearDeNovo() {
    setTimes(formarTimes(jogadores, modo));
    setSorteioKey((k) => k + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

          {/* ── Header ─────────────────────────────────────────────────────── */}
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

            <Text style={styles.titulo}>SORTEIO</Text>

            {/* Espaçador simétrico */}
            <View style={styles.headerBtn} />
          </View>

          {/* ── Seletor DUPLAS / TRIOS ──────────────────────────────────────── */}
          <View style={styles.selectorRow}>
            <View style={styles.selectorPill}>
              {(['duplas', 'trios'] as Modo[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  activeOpacity={0.8}
                  onPress={() => setModo(m)}
                  style={[
                    styles.selectorOption,
                    modo === m && styles.selectorOptionActive,
                  ]}
                >
                  <Text style={[
                    styles.selectorText,
                    modo === m && styles.selectorTextActive,
                  ]}>
                    {m === 'duplas' ? 'DUPLAS' : 'TRIOS'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Input + Botão + ─────────────────────────────────────────────── */}
          <View style={styles.inputRow}>
            <Animated.View style={[styles.inputWrap, animStyleInput]}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={inputNome}
                onChangeText={setInputNome}
                placeholder="Nome do jogador..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                selectionColor="#FFD700"
                returnKeyType="done"
                onSubmitEditing={adicionarJogador}
                maxLength={20}
              />
            </Animated.View>

            <TouchableOpacity
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Adicionar jogador"
              onPress={adicionarJogador}
              style={styles.addBtn}
            >
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* ── Lista de jogadores ──────────────────────────────────────────── */}
          <ScrollView
            style={styles.lista}
            contentContainerStyle={styles.listaContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {jogadores.map((nome) => (
              <Animated.View
                key={nome}
                entering={FadeInDown.duration(250)}
                exiting={FadeOutRight.duration(200)}
                style={styles.jogadorItem}
              >
                <Text style={styles.jogadorNome}>{nome}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Remover ${nome}`}
                  onPress={() => removerJogador(nome)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="rgba(255,255,255,0.45)" />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>

          {/* ── Botão SORTEAR ──────────────────────────────────────────────── */}
          <View style={styles.sortearContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              accessibilityRole="button"
              onPress={sortear}
              disabled={!podeSortear}
              style={[styles.sortearBtn, !podeSortear && styles.sortearBtnDisabled]}
            >
              <Text style={styles.sortearBtnText}>SORTEAR</Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </LinearGradient>

      {/* ── Modal — Times Sorteados ─────────────────────────────────────────── */}
      <Modal
        visible={modalVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            <Text style={styles.modalTitulo}>TIMES SORTEADOS</Text>

            <ScrollView
              style={styles.timesScroll}
              showsVerticalScrollIndicator={false}
            >
              {times.map((time, idx) => (
                <Animated.View
                  // key com sorteioKey: garante remount e re-animação ao SORTEAR DE NOVO
                  key={`${sorteioKey}-${idx}`}
                  entering={FadeInDown.duration(350).delay(idx * 80)}
                  style={styles.timeCard}
                >
                  <Text style={styles.timeLabel}>TIME {idx + 1}</Text>
                  {time.map((nome) => (
                    <Text key={nome} style={styles.timeNome}>{nome}</Text>
                  ))}
                </Animated.View>
              ))}
            </ScrollView>

            {/* Ações */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={sortearDeNovo}
              style={styles.modalBtnSecundario}
            >
              <Text style={styles.modalBtnSecundarioText}>SORTEAR DE NOVO</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setModalVisivel(false)}
              style={styles.modalBtnPrimario}
            >
              <Text style={styles.modalBtnPrimarioText}>FECHAR</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
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
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },

  // ── Seletor DUPLAS / TRIOS ────────────────────────────────────────────────
  selectorRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectorPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 24,
    padding: 4,
  },
  selectorOption: {
    paddingHorizontal: 28,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectorOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  selectorText: {
    fontFamily: 'BebasNeue',
    fontSize: 18,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  selectorTextActive: {
    color: '#FFFFFF',
  },

  // ── Input + Botão + ───────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  inputWrap: {
    flex: 1,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  addBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontFamily: 'BebasNeue',
    fontSize: 28,
    color: '#1B4332',
    lineHeight: 32,
  },

  // ── Lista de jogadores ────────────────────────────────────────────────────
  lista: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listaContent: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  jogadorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  jogadorNome: {
    flex: 1,
    fontFamily: 'BebasNeue',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ── Botão SORTEAR ─────────────────────────────────────────────────────────
  sortearContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
  },
  sortearBtn: {
    width: '85%',
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  sortearBtnDisabled: {
    opacity: 0.4,
  },
  sortearBtnText: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: '#1B4332',
    letterSpacing: 1,
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1B4332',
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitulo: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: '#FFD700',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },

  // ScrollView dos times
  timesScroll: {
    marginBottom: 16,
  },

  // Card de cada time
  timeCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  timeLabel: {
    fontFamily: 'BebasNeue',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    marginBottom: 6,
  },
  timeNome: {
    fontFamily: 'BebasNeue',
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    lineHeight: 26,
  },

  // Botões do modal
  modalBtnSecundario: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBtnSecundarioText: {
    fontFamily: 'BebasNeue',
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  modalBtnPrimario: {
    width: '100%',
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnPrimarioText: {
    fontFamily: 'BebasNeue',
    fontSize: 18,
    color: '#FFD700',
    letterSpacing: 1,
  },
});
