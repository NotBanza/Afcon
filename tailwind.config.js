/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './context/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        anl: {
          night: '#05121A',
          ink: '#0A1E26',
          emerald: '#0E8F48',
          gold: '#F6C94C',
          scarlet: '#D03C34',
          ivory: '#F9F6EE',
          slate: '#6C7A89',
        },
      },
      fontFamily: {
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        mono: ['"Roboto Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 10px 40px rgba(14, 143, 72, 0.25)',
      },
      backgroundImage: {
        'anl-radial': 'radial-gradient(circle at 0% -20%, rgba(246, 201, 76, 0.25), transparent 55%), radial-gradient(circle at 110% 20%, rgba(208, 60, 52, 0.2), transparent 50%), linear-gradient(180deg, #05121A 0%, #020A0F 100%)',
        'anl-stripe': 'linear-gradient(135deg, rgba(14, 143, 72, 0.18) 0%, rgba(246, 201, 76, 0.18) 50%, rgba(208, 60, 52, 0.18) 100%)',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1.5rem',
          lg: '3rem',
          xl: '4rem',
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '1' },
          '50%': { transform: 'translateY(-4px)', opacity: '0.92' },
        },
      },
    },
  },
  safelist: [
    'bg-anl-radial',
    'bg-anl-stripe',
    'shadow-glow',
  ],
  plugins: [],
};
