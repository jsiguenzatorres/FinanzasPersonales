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
        // v3 (2026-10-02): en vars de --ff-* (ver globals.css) en vez de hex
        // fijo, para que el modo oscuro los recalibre automáticamente sin
        // tocar ninguna pantalla — mantienen el significado (verde=positivo,
        // rojo=negativo, amarillo=alerta) en ambos modos.
        ff: {
          green: 'hsl(var(--ff-green))',
          blue: 'hsl(var(--ff-blue))',
          red: 'hsl(var(--ff-red))',
          yellow: 'hsl(var(--ff-yellow))',
          orange: 'hsl(var(--ff-orange))',
          purple: 'hsl(var(--ff-purple))',
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
