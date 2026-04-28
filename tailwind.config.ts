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
          turquoise: '#2ECFBF',
          violet: '#7B5BFF',
          gray: '#2C2E33',
          bg: '#f8fafc',
        }
      },
      backgroundImage: {
        'alteha-gradient': 'linear-gradient(135deg, #2ECFBF 0%, #7B5BFF 100%)',
      }

    },
  },
  plugins: [],
}
export default config
