/**
 * src/lib/storage.ts — wrapper de persistência chave-valor.
 *
 * Estratégia:
 *   - Build nativo (EAS Build / expo run:android): usa react-native-mmkv
 *     (~30× mais rápido que AsyncStorage; persiste entre sessões).
 *   - Expo Go: MMKV requer react-native-nitro-modules que precisa de build
 *     nativo — fallback transparente para memória (não persiste, mas o app
 *     não crasha e o desenvolvimento flui normalmente).
 *
 * Todos os outros módulos do projeto devem importar `storage` daqui.
 * NUNCA importar `react-native-mmkv` diretamente fora deste arquivo.
 */

/** Interface mínima de armazenamento chave-valor síncrono. */
export interface KVStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

// ---------------------------------------------------------------------------
// Inicialização — MMKV em builds nativos, memória no Expo Go
// ---------------------------------------------------------------------------
let storage: KVStorage;

try {
  // require() em vez de import estático para que o erro de módulo nativo
  // seja capturado em tempo de execução e não quebre o bundle no Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  const mmkv = new MMKV({ id: 'truco-pro' });

  storage = {
    getString: (key: string) => mmkv.getString(key),
    set:       (key: string, value: string) => mmkv.set(key, value),
    delete:    (key: string) => mmkv.delete(key),
  };
} catch {
  // Fallback para memória — Expo Go ou qualquer ambiente sem native modules.
  // O tema e outros estados NÃO persistem entre sessões neste modo.
  const memoryStore: Record<string, string | undefined> = {};

  storage = {
    getString: (key: string) => memoryStore[key],
    set:       (key: string, value: string) => { memoryStore[key] = value; },
    delete:    (key: string) => { delete memoryStore[key]; },
  };
}

export { storage };
