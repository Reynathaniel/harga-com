import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold:    '#f59e0b',
          indigo:  '#6366f1',
          dark:    '#0a0a0f',
          card:    '#12121a',
          border:  '#1e1e2e',
          muted:   '#6b7280',
        },
        platform: {
          tokped:  '#42b549',
          shopee:  '#ee4d2d',
          lazada:  '#0f146d',
          bukalapak: '#e31e52',
          blibli:  '#0095da',
          tiktok:  '#010101',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
export default config
