/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // SecureCardr Design System
        background: '#0F172A',
        surface: '#1E293B',
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#FACC15',
        'text-primary': '#E2E8F0',
        'text-secondary': '#94A3B8',
        
        // Extended palette for components
        blue: {
          600: '#3B82F6',
          700: '#1D4ED8',
        },
        emerald: {
          500: '#10B981',
          600: '#059669',
        },
        yellow: {
          400: '#FACC15',
          500: '#EAB308',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Montserrat', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Typography scale from design specs
        'h1': ['2.5rem', { lineHeight: '1.25' }],    // 40px
        'h2': ['2rem', { lineHeight: '1.25' }],      // 32px
        'h3': ['1.5rem', { lineHeight: '1.25' }],    // 24px
        'body': ['1rem', { lineHeight: '1.5' }],     // 16px
        'small': ['0.875rem', { lineHeight: '1.5' }], // 14px
      },
      spacing: {
        // Spacing system from design specs
        '16': '16px',  // small gutter
        '24': '24px',  // base gutter
        '32': '32px',  // large sections
      },
      borderRadius: {
        'md': '8px',
        'lg': '10px',
      },
      boxShadow: {
        'lift': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
