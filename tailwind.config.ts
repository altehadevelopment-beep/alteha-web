import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        alteha: {
          turquoise: '#18D19A',
          violet: '#6A4DFE',
          gray: '#2C2E33',
          bg: '#f8fafc',
        }
      },
      backgroundImage: {
        'alteha-gradient': 'linear-gradient(135deg, #18D19A 0%, #6A4DFE 100%)',
      }
    },
  },
  plugins: [],
}
export default config
