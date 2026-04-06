/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        ink: {
          DEFAULT: '#0d0d1a',
          50: '#f0f0ff',
          100: '#e4e4fa',
          900: '#0d0d1a',
        },
        violet: {
          DEFAULT: '#7c3aed',
          light: '#a78bfa',
          dark: '#5b21b6',
          glow: '#8b5cf6',
        },
        teal: {
          DEFAULT: '#14b8a6',
          light: '#5eead4',
        },
        rose: {
          DEFAULT: '#f43f5e',
          light: '#fda4af',
        },
        amber: {
          DEFAULT: '#f59e0b',
          light: '#fcd34d',
        },
        jade: {
          DEFAULT: '#10b981',
          light: '#6ee7b7',
        },
      },
      backgroundImage: {
        'mesh-violet': 'radial-gradient(at 40% 20%, hsla(280,70%,30%,0.4) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(250,60%,20%,0.3) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(260,80%,15%,0.5) 0px, transparent 50%)',
        'mesh-card': 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
      },
      boxShadow: {
        'glow-violet': '0 0 30px rgba(139,92,246,0.25)',
        'glow-teal': '0 0 30px rgba(20,184,166,0.25)',
        'glow-rose': '0 0 30px rgba(244,63,94,0.25)',
        'card': '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
