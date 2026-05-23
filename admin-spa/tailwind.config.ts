import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF9',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        ink: { DEFAULT: '#0A0A0A', muted: '#6B7280', faint: '#9CA3AF' },
        brand: { DEFAULT: '#2563EB', hover: '#1D4ED8', soft: '#EFF6FF' },
        success: '#10B981',
        danger: '#DC2626',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04)',
        pop: '0 8px 24px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config
