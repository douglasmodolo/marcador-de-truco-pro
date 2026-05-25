/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Dark theme
        'dark-bg': '#000000',
        'dark-surface': 'rgba(255,255,255,0.08)',
        'dark-text': '#FFFFFF',
        'dark-muted': 'rgba(255,255,255,0.5)',
        'dark-accent': '#FFD700',
        // Light theme
        'light-bg': '#FFF8E7',
        'light-surface': 'rgba(0,0,0,0.06)',
        'light-text': '#000000',
        'light-muted': 'rgba(0,0,0,0.45)',
        'light-accent': '#B8860B',
      },
      fontFamily: {
        // Add custom fonts here after adding them with expo-font
        // 'bebas': ['BebasNeue_400Regular'],
        // 'oswald': ['Oswald_700Bold'],
      },
    },
  },
  plugins: [],
};
