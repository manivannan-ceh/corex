/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // ── CSS-var-backed theme tokens ──────────────────────────
        primary:    'var(--text-1)',       // text-primary
        secondary:  'var(--text-2)',       // text-secondary
        muted:      'var(--text-3)',       // text-muted
        base:       'var(--bg-base)',      // bg-base
        surface:    'var(--bg-surface)',   // bg-surface
        elevated:   'var(--bg-elevated)',  // bg-elevated
        overlay:    'var(--bg-overlay)',   // bg-overlay
        divider:    'var(--border)',       // border-divider / divide-divider
        'divider-hi':'var(--border-strong)',
        sidebar:    'var(--bg-sidebar)',   // bg-sidebar
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in':     'fadeIn 0.25s ease-out',
        'slide-up':    'slideUp 0.3s ease-out',
        'scale-in':    'scaleIn 0.2s ease-out',
        'glow-pulse':  'glowPulse 3s ease-in-out infinite',
        'slide-right': 'slideRight 0.28s cubic-bezier(0.32,0.72,0,1)',
      },
      keyframes: {
        fadeIn:     { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:    { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:    { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        glowPulse:  { '0%, 100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
        slideRight: { '0%': { opacity: '0', transform: 'translateX(24px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
      },
      dropShadow: {
        glow: '0 0 12px rgba(99,102,241,0.5)',
      },
    },
  },
  plugins: [],
}
