// TESTES MANUAIS:
// - adicionarPonto('time1') 12x → fimDeJogo = true, vencedor = 'time1'
// - adicionarPonto com valorTruco=3 → placar sobe 3, valorTruco volta para 1
// - removerPonto com pontos=0 → pontos continua 0 (não vai negativo)
// - adicionarPonto com 11 pontos → maoDeOnze.time1 = true antes, false depois (pontos=12=fimDeJogo)
// - avancarTruco() 5x → ciclo 1→3→6→9→12→1
// - novaPartida() → pontos=0, historico=[], fimDeJogo=false; nomes preservados
// - renomearTime('time1','Zé') → nome atualizado + salvo em STORAGE_KEY_NAMES

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

import { getNextTrucoValue, getPrevTrucoValue, PONTOS_VITORIA } from '@/constants/truco';
import type { TrucoValue } from '@/constants/truco';
import { storage } from '@/lib/storage';

// ─── Chaves de persistência ────────────────────────────────────────────────
const STORAGE_KEY_STATE = 'jogo_state';
const STORAGE_KEY_NAMES = 'last_team_names';

// ─── Tipos públicos ────────────────────────────────────────────────────────
export interface HistoricoEntry {
  time: 'time1' | 'time2';
  /** Pontos somados (positivo = queda, -1 = correção). */
  pontosSomados: number;
  /** Placar após a ação, ex: "4 × 1". */
  placarApos: string;
  tipo: 'queda' | 'correcao';
  timestamp: number;
}

export interface JogoState {
  time1: { nome: string; pontos: number };
  time2: { nome: string; pontos: number };
  valorTruco: TrucoValue;
  historico: HistoricoEntry[];
  fimDeJogo: boolean;
  vencedor: 'time1' | 'time2' | null;
}

export interface JogoContextValue {
  state: JogoState;
  /** true quando o time tem exatamente 11 pontos (sinaliza para a UI). */
  maoDeOnze: { time1: boolean; time2: boolean };
  /** true se existe partida salva com progresso real (pontos > 0 ou histórico). */
  temPartidaSalva: boolean;
  /** Soma valorTruco ao time, reseta truco para 1, verifica fim de jogo. */
  adicionarPonto: (time: 'time1' | 'time2') => void;
  /** Subtrai 1 ponto (mínimo 0), registra como correção no histórico. */
  removerPonto: (time: 'time1' | 'time2') => void;
  /** Avança o ciclo do botão TRUCO!: 1→3→6→9→12→1. */
  avancarTruco: () => void;
  /** Recua um passo no ciclo (botão CORRER): 12→9→6→3→1; no-op se já for 1. */
  voltarTruco: () => void;
  /** Atualiza o nome do time e persiste em MMKV. */
  renomearTime: (time: 'time1' | 'time2', nome: string) => void;
  /** Reseta pontos, histórico, truco e fimDeJogo — mantém nomes dos times. */
  novaPartida: () => void;
  /** Carrega a partida salva do MMKV para o estado ativo. */
  continuarPartida: () => void;
}

// ─── Estado padrão ────────────────────────────────────────────────────────
const DEFAULT_STATE: JogoState = {
  time1: { nome: 'Nós',  pontos: 0 },
  time2: { nome: 'Eles', pontos: 0 },
  valorTruco: 1,
  historico: [],
  fimDeJogo: false,
  vencedor: null,
};

// ─── Reducer ──────────────────────────────────────────────────────────────
type Action =
  | { type: 'ADICIONAR_PONTO'; time: 'time1' | 'time2' }
  | { type: 'REMOVER_PONTO';   time: 'time1' | 'time2' }
  | { type: 'AVANCAR_TRUCO' }
  | { type: 'VOLTAR_TRUCO' }
  | { type: 'RENOMEAR_TIME';   time: 'time1' | 'time2'; nome: string }
  | { type: 'NOVA_PARTIDA' }
  | { type: 'CARREGAR_ESTADO'; estado: JogoState };

function reducer(state: JogoState, action: Action): JogoState {
  switch (action.type) {

    case 'ADICIONAR_PONTO': {
      // Jogo encerrado — ignora novos pontos
      if (state.fimDeJogo) return state;

      const { time } = action;
      // Teto em PONTOS_VITORIA: evita placar > 12 (ex: 9 + truco +9 = 12, não 18)
      const novos = Math.min(state[time].pontos + state.valorTruco, PONTOS_VITORIA);

      const novoTime1 = time === 'time1' ? { ...state.time1, pontos: novos } : state.time1;
      const novoTime2 = time === 'time2' ? { ...state.time2, pontos: novos } : state.time2;

      const placarApos = `${novoTime1.pontos} × ${novoTime2.pontos}`;

      const entrada: HistoricoEntry = {
        time,
        pontosSomados: state.valorTruco,
        placarApos,
        tipo: 'queda',
        timestamp: Date.now(),
      };

      const fimDeJogo = novos >= PONTOS_VITORIA;

      return {
        ...state,
        time1: novoTime1,
        time2: novoTime2,
        valorTruco: 1,          // reseta após cada queda registrada
        historico: [...state.historico, entrada],
        fimDeJogo,
        vencedor: fimDeJogo ? time : state.vencedor,
      };
    }

    case 'REMOVER_PONTO': {
      const { time } = action;
      // Não vai abaixo de 0
      if (state[time].pontos === 0) return state;

      const novos = state[time].pontos - 1;

      const novoTime1 = time === 'time1' ? { ...state.time1, pontos: novos } : state.time1;
      const novoTime2 = time === 'time2' ? { ...state.time2, pontos: novos } : state.time2;

      const placarApos = `${novoTime1.pontos} × ${novoTime2.pontos}`;

      const entrada: HistoricoEntry = {
        time,
        pontosSomados: -1,
        placarApos,
        tipo: 'correcao',
        timestamp: Date.now(),
      };

      // Reavalia fim de jogo caso a correção desfaça o placar vencedor
      const aindaFimDeJogo =
        novoTime1.pontos >= PONTOS_VITORIA || novoTime2.pontos >= PONTOS_VITORIA;

      const novoVencedor: 'time1' | 'time2' | null = aindaFimDeJogo
        ? (novoTime1.pontos >= PONTOS_VITORIA ? 'time1' : 'time2')
        : null;

      return {
        ...state,
        time1: novoTime1,
        time2: novoTime2,
        historico: [...state.historico, entrada],
        fimDeJogo: aindaFimDeJogo,
        vencedor: novoVencedor,
      };
    }

    case 'AVANCAR_TRUCO':
      return { ...state, valorTruco: getNextTrucoValue(state.valorTruco) };

    case 'VOLTAR_TRUCO':
      // No-op se já está em 1 (nenhum truco ativo)
      if (state.valorTruco === 1) return state;
      return { ...state, valorTruco: getPrevTrucoValue(state.valorTruco) };

    case 'RENOMEAR_TIME': {
      // Fallback para nome padrão se string vazia
      const nome = action.nome.trim() || (action.time === 'time1' ? 'Nós' : 'Eles');
      return {
        ...state,
        [action.time]: { ...state[action.time], nome },
      };
    }

    case 'NOVA_PARTIDA':
      return {
        // Nomes preservados
        time1: { nome: state.time1.nome, pontos: 0 },
        time2: { nome: state.time2.nome, pontos: 0 },
        valorTruco: 1,
        historico: [],
        fimDeJogo: false,
        vencedor: null,
      };

    case 'CARREGAR_ESTADO':
      return action.estado;

    default:
      return state;
  }
}

// ─── Inicialização lazy (3.º arg de useReducer) ───────────────────────────
// Começa com jogo limpo, mas reaproveita os nomes da última partida.
// NÃO carrega a partida salva automaticamente — isso é responsabilidade
// da UI via continuarPartida() após perguntar ao usuário.
function init(_: undefined): JogoState {
  try {
    const savedNames = storage.getString(STORAGE_KEY_NAMES);
    if (savedNames) {
      const names = JSON.parse(savedNames) as { time1?: string; time2?: string };
      return {
        ...DEFAULT_STATE,
        time1: { nome: names.time1 || 'Nós',  pontos: 0 },
        time2: { nome: names.time2 || 'Eles', pontos: 0 },
      };
    }
  } catch {
    // storage indisponível (Expo Go) — usa padrão
  }
  return DEFAULT_STATE;
}

// ─── Context ──────────────────────────────────────────────────────────────
export const JogoContext = createContext<JogoContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────
export function JogoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  // ── Flag de partida salva ─────────────────────────────────────────────
  // Avaliada uma única vez ao montar — não precisa ser reativa.
  const [temPartidaSalva] = useState<boolean>(() => {
    try {
      const saved = storage.getString(STORAGE_KEY_STATE);
      if (!saved) return false;
      const parsed = JSON.parse(saved) as JogoState;
      return (
        (parsed?.time1?.pontos ?? 0) > 0 ||
        (parsed?.time2?.pontos ?? 0) > 0 ||
        (parsed?.historico?.length ?? 0) > 0
      );
    } catch {
      return false;
    }
  });

  // ── Persistência automática ───────────────────────────────────────────
  // Salva o estado completo no MMKV a cada mudança de estado.
  useEffect(() => {
    try {
      storage.set(STORAGE_KEY_STATE, JSON.stringify(state));
    } catch {
      // Falha silenciosa — storage pode estar indisponível no Expo Go
    }
  }, [state]);

  // ─── Ações ──────────────────────────────────────────────────────────────
  const adicionarPonto = useCallback((time: 'time1' | 'time2') => {
    dispatch({ type: 'ADICIONAR_PONTO', time });
  }, []);

  const removerPonto = useCallback((time: 'time1' | 'time2') => {
    dispatch({ type: 'REMOVER_PONTO', time });
  }, []);

  const avancarTruco = useCallback(() => {
    dispatch({ type: 'AVANCAR_TRUCO' });
  }, []);

  const voltarTruco = useCallback(() => {
    dispatch({ type: 'VOLTAR_TRUCO' });
  }, []);

  const renomearTime = useCallback(
    (time: 'time1' | 'time2', nome: string) => {
      dispatch({ type: 'RENOMEAR_TIME', time, nome });
      // Persiste os nomes separadamente para pré-preencher a próxima partida
      try {
        const time1Nome = time === 'time1' ? (nome.trim() || 'Nós')  : state.time1.nome;
        const time2Nome = time === 'time2' ? (nome.trim() || 'Eles') : state.time2.nome;
        storage.set(STORAGE_KEY_NAMES, JSON.stringify({ time1: time1Nome, time2: time2Nome }));
      } catch {}
    },
    [state.time1.nome, state.time2.nome],
  );

  const novaPartida = useCallback(() => {
    dispatch({ type: 'NOVA_PARTIDA' });
  }, []);

  const continuarPartida = useCallback(() => {
    try {
      const saved = storage.getString(STORAGE_KEY_STATE);
      if (!saved) return;
      const parsed = JSON.parse(saved) as JogoState;
      if (parsed?.time1 && parsed?.time2) {
        dispatch({ type: 'CARREGAR_ESTADO', estado: parsed });
      }
    } catch {}
  }, []);

  // ─── Valores derivados ───────────────────────────────────────────────────
  const maoDeOnze = useMemo(
    () => ({
      time1: state.time1.pontos === PONTOS_VITORIA - 1,  // exatamente 11
      time2: state.time2.pontos === PONTOS_VITORIA - 1,
    }),
    [state.time1.pontos, state.time2.pontos],
  );

  const value = useMemo<JogoContextValue>(
    () => ({
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
    }),
    [
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
    ],
  );

  return <JogoContext.Provider value={value}>{children}</JogoContext.Provider>;
}
