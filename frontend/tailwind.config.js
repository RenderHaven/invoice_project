/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        slate: '#334155',
        surface: '#f8fafc',
        panel: '#ffffff',
        line: '#e2e8f0',
        muted: '#64748b',
        emerald: '#10b981',
        amber: '#f59e0b',
        rose: '#e11d48',
        sky: '#0284c7',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        soft: '0 10px 15px -3px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
