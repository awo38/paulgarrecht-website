const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [path.join(__dirname, '..', 'index.html')],
  theme: {
    extend: {
      colors: {
        panel: '#0B0F14',
        panel2: '#111827',
        card: 'rgba(255,255,255,0.06)',
        cardhi: 'rgba(255,255,255,0.10)',
        edge: 'rgba(255,255,255,0.08)',
        edgehi: 'rgba(255,255,255,0.18)',
        ink: '#F8FAFC',
        muted: '#94A3B8',
        accent: {
          orange: '#FF7A00',
          blue: '#3B82F6',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      maxWidth: {
        content: '1440px',
      },
    },
  },
  plugins: [],
};
