import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ff7a1a',
          dark: '#f26700',
          soft: '#fff3ea'
        },
        ink: '#191919',
        muted: '#6b7280',
        canvas: '#f8f8f8'
      },
      boxShadow: {
        soft: '0 10px 35px rgba(17, 24, 39, 0.08)',
        cta: '0 12px 30px rgba(255, 122, 26, 0.28)'
      },
      borderRadius: {
        xl2: '1.5rem'
      },
      backgroundImage: {
        'hero-rings': 'radial-gradient(circle at 14% 22%, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 10%, transparent 10%, transparent 17%, rgba(255,255,255,0.12) 17%, rgba(255,255,255,0.12) 23%, transparent 23%)'
      }
    }
  },
  plugins: []
};

export default config;
