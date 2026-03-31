/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        void: {
          950: '#070809',
          900: '#0A0B0F',
          800: '#0F1117',
          700: '#13151D',
          600: '#181B25',
          500: '#1E2232',
        },
        border: '#1E2436',
        'border-bright': '#2A3050',
        emerald: {
          DEFAULT: '#10B981',      // main green
          dim: '#059669',          // darker green
          glow: 'rgba(16,185,129,0.15)',
        },
        violet: {
          DEFAULT: '#7B61FF',
          dim: '#5B45CC',
          glow: 'rgba(123,97,255,0.15)',
        },
        ink: {
          100: '#F0F2FA',
          200: '#C8CEDE',
          300: '#8B93AA',
          400: '#5A6380',
          500: '#373E56',
        },
        status: {
          new: '#3B82F6',
          review: '#F59E0B',
          accepted: '#10B981',
          rejected: '#EF4444',
          implemented: '#8B5CF6',
        },
      },
      backgroundImage: {
        'grid-subtle': `linear-gradient(rgba(30,36,54,0.4) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(30,36,54,0.4) 1px, transparent 1px)`,
        'grad-emerald': 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
        'grad-violet': 'linear-gradient(135deg, #7B61FF 0%, #5540D6 100%)',
        'grad-surface': 'linear-gradient(180deg, #0F1117 0%, #0A0B0F 100%)',
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
