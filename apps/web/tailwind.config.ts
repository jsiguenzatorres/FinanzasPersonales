import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // FlowFinance brand — semántica financiera (positivo/negativo/alerta).
        // v2 (2026-07-16): recalibrados de neón (pensados para fondo negro)
        // a tonos profundos con contraste real sobre el fondo crema —
        // mantienen el significado (verde=positivo, rojo=negativo,
        // amarillo=alerta) pero ya no son ilegibles en texto sobre claro.
        ff: {
          green: '#2F6B45',
          blue: '#35578C',
          red: '#A13A2C',
          yellow: '#8F6D1F',
          orange: '#B0631F',
          purple: '#6B4A8A',
        },
        // Landing page — editorial, cálido. Deliberadamente distinto del
        // dark-mode-verde-neón de la app: la marca puede tener dos voces.
        landing: {
          cream: '#F7F0E3',
          paper: '#EDE2CC',
          'paper-deep': '#E2D4B8',
          ink: '#241D15',
          'ink-soft': '#6E5E48',
          terracotta: '#BD5A34',
          'terracotta-soft': '#DE9468',
          'terracotta-deep': '#9A4526',
          forest: '#3E5A45',
          'forest-soft': '#6E8A72',
          gold: '#B08A4E',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
