/** @type {import('tailwindcss').Config} */
module.exports = {
  // Inclui todos os arquivos de rotas e componentes do projeto
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Accent amarelo do tema dark (botão TRUCO!)
        truco: '#FFD700',
        // Accent amarelo escuro para tema light (legível ao sol)
        'truco-light': '#B8860B',
      },
      fontSize: {
        // Fonte gigante para placar — legível de longe
        score: ['120px', { lineHeight: '1' }],
      },
    },
  },
  plugins: [],
};
