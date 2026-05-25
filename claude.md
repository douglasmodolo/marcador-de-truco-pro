# claude.md — Marcador de Truco Premium (APP_NAME_PLACEHOLDER)

> **Instruções para o Claude Code:** Leia este arquivo integralmente antes de qualquer implementação.
> Siga a ordem das seções e abra uma branch por feature conforme o plano de issues no final.

---

## 1. Visão Geral do Produto

Aplicativo mobile Android (inicialmente) para marcação de pontos de **Truco Paulista**.
Design "Pure Dark", focado em gestos de tela cheia, feedback háptico, overlays flutuantes (HUD)
e uma ferramenta de zoeira (som de pato). Monetização via Google AdMob (anúncios) e RevenueCat
+ Google Play Billing (plano Premium para remover anúncios).

**Variante suportada na v1:** Truco Paulista
**Variante planejada para v2:** Truco Mineiro (2 em 2, lógica separada)

---

## 2. Regras do Truco Paulista (Implementar Fielmente)

| Conceito       | Regra                                                                 |
|----------------|-----------------------------------------------------------------------|
| Pontuação base | Cada queda ganha vale **1 ponto** por padrão                          |
| Truco          | Pedido que altera o valor da próxima queda a ser ganha                |
| Ciclo Truco    | +3 → +6 → +9 → +12 → volta para +1 (padrão)                          |
| Partida        | Vai até **12 pontos**; quem atingir 12 primeiro vence                 |
| Queda          | 1 rodada completa (melhor de 3 cartas)                                |
| Mão de 10      | **v2** — não implementar na v1                                        |

### Mecânica do botão TRUCO!

- Estado padrão (`valorTruco = 1`): label **"TRUCO"**
- Após 1 clique (`valorTruco = 3`): label **"SEIS"**
- Após 2 cliques (`valorTruco = 6`): label **"NOVE"**
- Após 3 cliques (`valorTruco = 9`): label **"DOZE"**
- Após 4 cliques (`valorTruco = 12`): label volta para **"TRUCO"** (ciclo completo)
- O botão volta para `+1` automaticamente após a queda ser registrada
- **Não há fluxo de "aceitar/recusar" no app** — os jogadores resolvem isso verbalmente;
  o app só registra quem ganhou e quanto valeu

### Botão CORRER

- **Visível apenas quando `valorTruco > 1`** (truco foi pedido)
- **Invisível quando `valorTruco = 1`** (rodada normal)
- Posicionado abaixo do botão TRUCO, centralizado
- Ao tocar: volta um passo no ciclo do truco — `12→9`, `9→6`, `6→3`, `3→1`
- Label: **"CORRER"**
- Estilo: fundo `rgba(255,0,0,0.15)`, borda `rgba(255,0,0,0.5)` 1px, texto vermelho claro, borderRadius 24
- **Não há mais botão de pato/zoeira** — o CORRER ocupa esse espaço

---

## 3. Tech Stack

| Camada              | Tecnologia                                        | Observação                                      |
|---------------------|---------------------------------------------------|-------------------------------------------------|
| Framework           | **Expo SDK 52+** (Managed Workflow)               |                                                 |
| Navegação           | **Expo Router v4** (File-based)                   |                                                 |
| Estilização         | **NativeWind v4** (Tailwind CSS para RN)          |                                                 |
| Gestos              | `react-native-gesture-handler` + `react-native-reanimated` |                                        |
| Áudio               | **`expo-audio`** (NÃO usar expo-av — deprecado)   |                                                 |
| Feedback Físico     | `expo-haptics`                                    | Ver tipos na seção 6                            |
| Orientação de Tela  | `expo-screen-orientation`                         | Não é mais necessário lock — tela em retrato padrão |
| Tela Sempre Ativa   | `expo-keep-awake`                                 | Ativar só na tela do marcador                   |
| Persistência        | **`react-native-mmkv`**                           | ~30x mais rápido que AsyncStorage; use para tudo|
| Anúncios            | `react-native-google-mobile-ads` (AdMob)          |                                                 |
| IAP / Premium       | **RevenueCat** (`react-native-purchases`)         | Ver seção 7                                     |
| Estado Global       | Context API + custom hooks (`JogoContext`)        |                                                 |

---

## 4. Arquitetura de Arquivos

```
app/
  _layout.tsx          # Root layout com providers (JogoContext, RevenueCat init)
  index.tsx            # Tela do Marcador (abre direto — é a tela principal)
  sorter.tsx           # Sorteador de Times (acessível pelo menu sanduíche)
  premium.tsx          # Tela de compra Premium

src/
  components/
    TrucoButton.tsx    # Botão flutuante TRUCO! com ciclo de valores
    DuckButton.tsx     # Botão de zoeira (pato)
    ScoreHalf.tsx      # Metade da tela de cada time (gestos + pontuação)
    HistoryHUD.tsx     # Painel flutuante glassmorphism com histórico
    WinnerOverlay.tsx  # Tela de fim de jogo + animação do pato
    SideMenu.tsx       # Menu sanduíche (drawer ou modal) com Sorteador, Loja, Premium
  context/
    JogoContext.tsx    # Estado global da partida
  hooks/
    useJogo.ts         # Hook principal que consome JogoContext
    usePremium.ts      # Hook que consulta RevenueCat sobre status premium
    useAds.ts          # Hook que gerencia exibição de anúncios
  sounds/
    quack.mp3          # Som de pato para zoeira
    vitoria.mp3        # Som de fim de jogo (opcional)
  constants/
    truco.ts           # TRUCO_VALUES = [3, 6, 9, 12], PONTOS_VITORIA = 12
```

---

## 5. Arquitetura de Telas e Fluxo do Usuário

**O app abre direto na tela do Marcador (`app/index.tsx`) — não há menu principal.**
O acesso a funcionalidades secundárias é feito pelo menu sanduíche (☰) no canto superior esquerdo.

---

### Tela Principal: Marcador de Pontos (Retrato — orientação padrão)

**Ao entrar:**
1. Chamar `activateKeepAwakeAsync()` para manter a tela ativa durante a partida
2. Ao sair: desfazer o keep awake

**Nomes padrão (fallback):** `"Nós"` e `"Eles"`.
**Edição de nome:** Toque longo no nome do time abre um modal/input inline para renomear.

#### Layout Visual

```
┌─────────────────────────────┐
│ ☰   Nós      |      Eles   │  ← topo: menu + nomes dos times
│                             │
│     88       │      88     │  ← meio: placar gigante (Bebas Neue, ~160px)
│              │             │
│              │             │
│  [TRUCO+3]  [🦆]  [hist.]  │  ← HUD flutuante central
│                             │
├─────────────────────────────┤
│          [Banner Ad]        │  ← rodapé fixo (oculto se premium)
└─────────────────────────────┘
```

#### A. Divisão de Toque (Background)

A tela é dividida verticalmente ao meio. Cada metade é uma área de toque independente:

| Área | Função |
|---|---|
| Metade esquerda (50%) | Time 1: nome no topo, pontuação gigante centralizada |
| Metade direita (50%) | Time 2: espelho exato do Time 1 |

A linha divisória central é sutil — apenas uma linha de 1px `rgba(255,255,255,0.15)`.

A fonte da pontuação deve ser grande o suficiente para ser lida de longe — **Bebas Neue 160px**.
Fundo: gradiente verde `#2D6A4F` → `#1B4332` (mesa de truco).

#### B. HUD — Elementos Flutuantes (sobrepõem o fundo)

**1. Menu Sanduíche ☰ (canto superior esquerdo)**
- Abre um drawer ou modal com:
  - **Sorteador de Times** → navega para `sorter.tsx`
  - **Loja de Baralhos** → abre link externo via `expo-linking`
  - **Remover Anúncios** → navega para `premium.tsx`
  - **Nova Partida** → reseta o estado (com confirmação)

**2. Botão TRUCO (centro, eixo horizontal médio)**
- Label dinâmico: `valorTruco=1` → **"TRUCO"** / `3` → **"SEIS"** / `6` → **"NOVE"** / `9` → **"DOZE"**
- Após registrar uma queda, reset automático para `valorTruco=1` e label **"TRUCO"**
- Haptic: `ImpactFeedbackStyle.Heavy` ao tocar

**3. Botão CORRER (abaixo do TRUCO)**
- **Visível apenas quando `valorTruco > 1`**
- Ao tocar: volta um passo — `12→9→6→3→1`
- Label: **"CORRER"**
- Estilo: fundo `rgba(255,0,0,0.15)`, borda `rgba(255,0,0,0.5)` 1px, texto vermelho claro, borderRadius 24
- Haptic: `ImpactFeedbackStyle.Light`

**4. Histórico Flutuante — HistoryHUD (abaixo do TRUCO! e Pato)**
- Painel translúcido glassmorphism (blur + opacidade ~70%)
- Exibe o log de quedas:
  ```
  Nós ganhou (+1) → 1 × 0
  Eles trucou e ganhou (+3) → 1 × 3
  ```
- Scroll vertical se o histórico crescer

---

### Tela Sorteador de Times (Retrato)

- Campo de texto para adicionar nomes
- Lista com exclusão por swipe
- Seletor: **[Duplas]** ou **[Trios]**
- Botão **[Sortear]**
- Botão **[Iniciar Jogo com estes Times]**: volta para `index.tsx` passando os nomes via parâmetros

---

### Tela Premium (Retrato)

- Descrição do benefício (sem anúncios para sempre)
- Preço e botão de compra via RevenueCat
- Botão "Restaurar compra"

---

## 6. Mecânica de Gestos e Pontuação

### Gestos nas metades da tela (via `react-native-gesture-handler`)

| Gesto | Ação |
|---|---|
| **Tap simples** na metade do time | Registra queda ganha: soma o valor atual do botão TRUCO ao placar; reset do botão para `+1`; registra no histórico |
| **Swipe Down** na metade do time | Subtrai 1 ponto do placar (correção de erro); registra no histórico como `(correção -1)` |

### Feedback Háptico (usar `expo-haptics`)

| Evento | Tipo de Haptic |
|---|---|
| Tap — registrar queda | `ImpactFeedbackStyle.Medium` |
| Swipe Down — desfazer | `ImpactFeedbackStyle.Light` |
| Botão TRUCO! | `ImpactFeedbackStyle.Heavy` |
| Fim de jogo | `NotificationFeedbackType.Success` (3 pulsos) |

---

## 7. Estado Global — JogoContext

```typescript
interface JogoState {
  time1: { nome: string; pontos: number; quedas: number }
  time2: { nome: string; pontos: number; quedas: number }
  valorTruco: 1 | 3 | 6 | 9 | 12   // valor atual do botão TRUCO
  historico: HistoricoEntry[]
  fimDeJogo: boolean
  vencedor: 'time1' | 'time2' | null
}

interface HistoricoEntry {
  time: 'time1' | 'time2'
  pontosSomados: number
  placarApos: string   // ex: "1 × 3"
  tipo: 'queda' | 'correcao'
  timestamp: number
}
```

**Persistência:** Salvar o `JogoState` no MMKV a cada mudança de estado.
Ao abrir o marcador, verificar se existe uma partida salva e oferecer "Continuar partida?" via Alert.

---

## 8. Fim de Jogo

Acionado quando qualquer time atinge **12 pontos**:

1. Setar `fimDeJogo: true` no contexto
2. A tela do marcador se divide em duas animações simultâneas:
   - **Lado vencedor:** animação de confete (usar `react-native-confetti-cannon` ou similar) + nome do time em destaque
   - **Lado perdedor:** imagem/gif de pato gigante ocupa a metade — cada toque emite um som de quack
3. Haptic: `NotificationFeedbackType.Success` (3 pulsos)
4. Botão **[Nova Partida]**: reseta o estado, mantém nomes dos times
5. Botão **[Compartilhar resultado]**: gera imagem do placar final e abre share sheet do sistema (`expo-sharing` + `react-native-view-shot` para capturar a tela como imagem)

**Usuário Free:** ao fechar o overlay de fim de jogo, exibir anúncio interstitial AdMob.

---

## 8.1 Aviso Visual — Mão de 11

Quando qualquer time atinge **11 pontos**:
- A cor do número do placar daquele time muda de branco para **dourado `#FFD700`**
- Nenhum bloqueio de funcionalidade — apenas alerta visual
- Quando o jogo terminar (12 pontos), a animação de fim de jogo sobrepõe normalmente

---

## 8.2 Histórico Expansível

- Por padrão, o histórico exibe as **últimas 2 entradas** na zona do HUD
- Um toque no histórico expande para um modal/drawer mostrando todas as entradas da partida
- Cada entrada no formato: `Nós ganhou (+3) → 4 × 1`
- Botão de fechar no modal

---

## 8.3 Nomes Persistidos

- Ao renomear um time, salvar no MMKV com chave `lastTeamNames`
- Na próxima abertura do app, se existirem nomes salvos, exibir Alert:
  "Usar nomes da última partida? **Família** vs **Amigos**" com opções [Sim] [Não]
- Se não houver nomes salvos, usar "Nós" e "Eles" como padrão

---

## 9. Monetização

### Anúncios (Google AdMob)
- **Banner:** exibido no rodapé fixo da tela do marcador — ocultar se premium
- **Interstitial:** disparado ao fechar o overlay de fim de jogo — pular se premium
- Configurar IDs de teste durante desenvolvimento; substituir pelos IDs reais antes do build de produção

### Premium — RevenueCat + Google Play Billing

**Setup:**
1. Criar conta em [revenuecat.com](https://revenuecat.com) (gratuito até $2.5k/mês de receita)
2. Configurar produto no Google Play Console: compra única, ex: `truco_premium_lifetime`
3. Integrar `react-native-purchases` com a chave pública do RevenueCat
4. O hook `usePremium.ts` chama `Purchases.getCustomerInfo()` e verifica se o entitlement
   `premium` está ativo

**Fluxo de compra:**
1. Usuário toca em **[Remover Anúncios]** no menu
2. App exibe uma tela/modal com descrição do benefício e preço
3. Chama `Purchases.purchasePackage(package)` — RevenueCat gerencia o resto
4. Após confirmação, `usePremium` retorna `isPremium: true` e todos os anúncios somem

**Restore de compra:** botão "Restaurar compra" na tela de premium, chama
`Purchases.restorePurchases()` — obrigatório para aprovação na Play Store.

---

## 10. Plano de Implementação e Git

### Estrutura de Branches

```
main        → produção (tag a cada release: v1.0.0, v1.1.0...)
develop     → integração; base para PRs de features
feature/*   → novas funcionalidades
fix/*       → correções de bugs
chore/*     → setup, CI, configs, documentação
```

### Fluxo de Trabalho

```
chore/setup-expo
      ↓ PR → develop
feature/menu-principal
      ↓ PR → develop
feature/sorteador
      ↓ PR → develop
feature/marcador-layout
      ↓ PR → develop
...todas as features...
      ↓ PR (release candidate) → main
                                    ↓
                              tag v1.0.0
                                    ↓
                           EAS Build (Android)
                                    ↓
                            Google Play Store
```

### Issues GitHub — Milestone v1.0

Criar estas issues antes de começar, com as labels indicadas:

| # | Label | Título |
|---|-------|--------|
| 1 | `chore` | Setup inicial: Expo + Expo Router + NativeWind + MMKV ✅ |
| 2 | `chore` | Configurar EAS Build para Android ✅ |
| 3 | `chore` | Configurar RevenueCat e AdMob (IDs de teste) ✅ |
| 4 | `feature` | Tela do Marcador — layout base vertical + fundo verde ✅ |
| 5 | `feature` | JogoContext — estado global e persistência MMKV |
| 6 | `feature` | Botões +1 e -1 com lógica de pontuação real |
| 7 | `feature` | Botão TRUCO (labels dinâmicos) + Botão CORRER |
| 8 | `feature` | Histórico expansível — últimas 2 entradas + modal completo |
| 9 | `feature` | Aviso visual mão de 11 (placar dourado) |
| 10 | `feature` | Nomes persistidos no MMKV + sugestão na próxima partida |
| 11 | `feature` | Placar animado (flip/bounce ao mudar número) |
| 12 | `feature` | Keep Awake na tela do marcador |
| 14 | `feature` | Fim de jogo — confete no vencedor + pato no perdedor |
| 15 | `feature` | Compartilhar resultado como imagem |
| 16 | `feature` | Menu sanduíche (☰) com Sorteador, Loja, Premium, Nova Partida |
| 17 | `feature` | Sorteador de Times |
| 18 | `feature` | Edição de nome de time (toque longo) |
| 19 | `feature` | AdMob — banner no rodapé + interstitial pós-partida |
| 20 | `feature` | Premium — tela de compra + RevenueCat + restore |
| 21 | `chore` | Assets de produção: ícone, splash screen, metadados Play Store |
| 22 | `chore` | Build de produção + submissão à Play Store |

### Labels recomendadas no GitHub

`feature` · `bug` · `ux` · `monetization` · `performance` · `chore` · `v1` · `v2`

---

## 11. Instruções de Inicialização para o Claude Code

Ao iniciar a sessão de implementação, copiar este bloco como contexto inicial:

```
Leia o claude.md completo antes de qualquer ação.

Stack obrigatória:
- Expo SDK 52+ com Expo Router v4
- NativeWind v4 para estilização
- expo-audio (NÃO expo-av — está deprecado)
- react-native-mmkv para toda persistência local
- expo-screen-orientation com lock landscape na tela do marcador
- RevenueCat (react-native-purchases) para IAP Premium
- react-native-google-mobile-ads para AdMob

Estrutura de diretórios: app/ para rotas, src/ para componentes/hooks/context/sounds.

Comece pela issue #1: setup do projeto limpo com todas as dependências instaladas
e uma tela index.tsx funcionando. Abra a branch chore/setup-expo antes de qualquer código.
```

---

## 12. Sistema de Temas (Dark / Light)

### Filosofia: bateria primeiro

| Tema | Fundo | Texto/Números | Quando usar |
|------|-------|---------------|-------------|
| **Dark** (padrão) | `#000000` puro | `#FFFFFF` | Ambientes internos, noite — pixels OLED desligados = máxima economia |
| **Light** (modo sol) | `#FFF8E7` (creme quente) | `#000000` | Ao sol / ambientes com muita luz — NÃO usar branco puro `#FFFFFF` (reflete luz solar, piora leitura) |

**Por que creme e não branco?** Branco puro reflete a luz solar diretamente para o olho, paradoxalmente dificultando a leitura. Tom levemente quente (`#FFF8E7`) mantém alto contraste com texto preto e é mais confortável sob luz intensa.

### Lógica de seleção

```typescript
// hook: useTheme.ts
// 1. Lê override salvo no MMKV: 'dark' | 'light' | null
// 2. Se null → segue useColorScheme() do sistema operacional
// 3. Se definido → usa o override independente do sistema

const themeOverride = mmkv.getString('theme_override') // 'dark' | 'light' | null
const systemTheme = useColorScheme()                    // 'dark' | 'light'
const activeTheme = themeOverride ?? systemTheme
```

### Onde expor o controle

- **Menu Principal:** toggle ou seletor Dark / Light / Auto (salva no MMKV)
- **Tela do Marcador:** botão minimalista no HUD (canto oposto ao botão de reset)
  para trocar o tema instantaneamente sem sair da partida — essencial quando
  os jogadores saem de ambiente fechado para área externa durante o jogo

### Tokens de cor (definir em `src/constants/theme.ts`)

```typescript
export const themes = {
  dark: {
    background: '#000000',
    surface: 'rgba(255,255,255,0.08)',   // HUD glassmorphism
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.5)',
    accent: '#FFD700',                   // amarelo para TRUCO!
  },
  light: {
    background: '#FFF8E7',
    surface: 'rgba(0,0,0,0.06)',         // HUD glassmorphism
    text: '#000000',
    textMuted: 'rgba(0,0,0,0.45)',
    accent: '#B8860B',                   // amarelo escuro legível ao sol
  },
}
```

---

## 13. Roadmap v2 (Não Implementar na v1)

- Truco Mineiro (pontuação 2 em 2, regras específicas)
- Mão de 10 (bloquear truco quando ambos têm 10 pontos)
- Histórico de partidas salvo com data e resultado
- Share do placar final como imagem (WhatsApp/Instagram)
- Tema claro (para jogar ao sol)
- Modo torneio / chaveamento
- Estatísticas por jogador
