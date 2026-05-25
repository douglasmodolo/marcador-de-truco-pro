/**
 * useJogo — hook de acesso ao JogoContext.
 *
 * Lança erro descritivo se utilizado fora de um <JogoProvider>,
 * eliminando a necessidade de verificar null em cada consumidor.
 *
 * Uso:
 *   const { state, adicionarPonto, avancarTruco } = useJogo();
 */
import { useContext } from 'react';
import { JogoContext } from '@/context/JogoContext';

export function useJogo() {
  const context = useContext(JogoContext);
  if (!context) {
    throw new Error('useJogo deve ser utilizado dentro de um <JogoProvider>.');
  }
  return context;
}
