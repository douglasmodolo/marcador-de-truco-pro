/**
 * Constantes do Truco Paulista.
 */

/** Ciclo de valores do botão TRUCO! (+3 → +6 → +9 → +12 → volta para +1) */
export const TRUCO_VALUES = [3, 6, 9, 12] as const;

/** Pontuação necessária para vencer a partida */
export const PONTOS_VITORIA = 12;

/** Valor padrão (uma queda simples) */
export const VALOR_PADRAO = 1;

/** Nome padrão do Time 1 */
export const NOME_TIME1_PADRAO = 'Nós';

/** Nome padrão do Time 2 */
export const NOME_TIME2_PADRAO = 'Eles';
