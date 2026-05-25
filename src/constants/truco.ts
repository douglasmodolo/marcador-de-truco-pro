/**
 * Constantes do Truco Paulista.
 *
 * Ciclo do botão TRUCO!:
 *   +3 → +6 → +9 → +12 → +1 (volta ao padrão)
 *
 * O valor 1 representa o estado padrão (nenhum truco ativo).
 */

export const TRUCO_VALUES = [3, 6, 9, 12, 1] as const;
export type TrucoValue = (typeof TRUCO_VALUES)[number];

/** Pontuação máxima para vencer uma partida. */
export const PONTOS_VITORIA = 12;

/**
 * Retorna o próximo valor no ciclo do truco.
 * Ex: getNextTrucoValue(3) → 6, getNextTrucoValue(12) → 1
 */
export function getNextTrucoValue(current: TrucoValue): TrucoValue {
  const idx = TRUCO_VALUES.indexOf(current);
  return TRUCO_VALUES[(idx + 1) % TRUCO_VALUES.length];
}

/**
 * Retorna o valor anterior no ciclo do truco (usado pelo botão CORRER).
 * Ex: getPrevTrucoValue(6) → 3, getPrevTrucoValue(3) → 1, getPrevTrucoValue(1) → 1 (no-op)
 */
export function getPrevTrucoValue(current: TrucoValue): TrucoValue {
  if (current === 1) return 1;
  const idx = TRUCO_VALUES.indexOf(current);
  return TRUCO_VALUES[(idx - 1 + TRUCO_VALUES.length) % TRUCO_VALUES.length];
}
