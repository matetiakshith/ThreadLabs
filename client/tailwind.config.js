/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--paper-rgb) / <alpha-value>)', surface: 'rgb(var(--surface-rgb) / <alpha-value>)', sand: 'rgb(var(--sand-rgb) / <alpha-value>)', ink: 'rgb(var(--ink-rgb) / <alpha-value>)', muted: 'rgb(var(--muted-rgb) / <alpha-value>)', line: 'rgb(var(--line-rgb) / <alpha-value>)', rose: { DEFAULT: 'var(--rose)', light: 'var(--blush)' }, forest: 'rgb(var(--forest-rgb) / <alpha-value>)',
        heritage: { cream: 'rgb(var(--surface-rgb) / <alpha-value>)', sand: 'rgb(var(--sand-rgb) / <alpha-value>)', silk: 'rgb(var(--line-rgb) / <alpha-value>)', indigo: 'rgb(var(--ink-rgb) / <alpha-value>)', indigoLight: 'var(--muted)', charcoal: 'var(--ink)', muted: 'var(--muted)', terracotta: 'var(--rose)', gold: 'var(--rose)', goldLight: '#f3dfb6' },
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#2563eb',
          600: '#1d4ed8',
          900: '#0f172a',
        },
        clay: {
          500: '#f97316',
          600: '#ea580c',
        },
        accent: {
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          indigo: '#4f46e5',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'modern': '0 20px 40px -15px rgba(0, 0, 0, 0.07), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
        'float': '0 14px 30px rgba(37, 99, 235, 0.25)',
        'clay-glow': '0 12px 28px rgba(249, 115, 22, 0.25)',
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
