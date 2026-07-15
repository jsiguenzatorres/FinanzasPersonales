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
        // FlowFinance brand (app, dark)
        ff: {
          green: '#00E5A0',
          blue: '#5B6EFF',
          red: '#FF6B6B',
          yellow: '#FFD166',
          orange: '#FF9F43',
          purple: '#C084FC',
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
