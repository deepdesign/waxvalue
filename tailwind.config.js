/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable manual dark mode toggle
  mode: 'jit', // Enable Just-In-Time mode for better performance
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        'xs': '475px',
        '3xl': '1680px',
        '4xl': '1920px',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
      // Preserve existing animations and add modern enhancements
      animation: {
        'fade-in-up': 'fadeInUp 1s ease-out',
        'bounce-slow': 'bounceSlow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'floatDelayed 8s ease-in-out infinite',
        'gradient-shift': 'gradientShift 4s linear infinite',
        'slide-down': 'slideDown 0.3s ease-out',
        'progress': 'progress 2s ease-in-out',
        'pulse-wave': 'pulseWave 1s infinite ease-in-out',
        // Modern enhancements
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        // 3D Transform effects
        'flip-x': 'flipX 0.6s ease-in-out',
        'flip-y': 'flipY 0.6s ease-in-out',
        'rotate-3d': 'rotate3d 0.8s ease-in-out',
        'tilt': 'tilt 0.3s ease-in-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        floatDelayed: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-30px)' },
        },
        gradientShift: {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
        slideDown: {
          'from': { transform: 'translateY(-100%)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        progress: {
          '0%': { width: '0%' },
          '50%': { width: '70%' },
          '100%': { width: '100%' },
        },
        pulseWave: {
          '0%': { transform: 'scaleY(1)', 'transform-origin': '50% 50%' },
          '50%': { transform: 'scaleY(0.7)', 'transform-origin': '50% 50%' },
          '100%': { transform: 'scaleY(1)', 'transform-origin': '50% 50%' },
        },
        // Modern enhancement keyframes
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { 'background-position': '-200% 0' },
          '100%': { 'background-position': '200% 0' },
        },
        'gradient-pulse': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'rainbow-shift': {
          '0%': { 'background-position': '0% 50%' },
          '100%': { 'background-position': '100% 50%' },
        },
        // 3D Transform keyframes
        flipX: {
          '0%': { transform: 'perspective(400px) rotateX(0deg)' },
          '50%': { transform: 'perspective(400px) rotateX(-90deg)' },
          '100%': { transform: 'perspective(400px) rotateX(0deg)' },
        },
        flipY: {
          '0%': { transform: 'perspective(400px) rotateY(0deg)' },
          '50%': { transform: 'perspective(400px) rotateY(-90deg)' },
          '100%': { transform: 'perspective(400px) rotateY(0deg)' },
        },
        rotate3d: {
          '0%': { transform: 'perspective(400px) rotate3d(1, 1, 0, 0deg)' },
          '50%': { transform: 'perspective(400px) rotate3d(1, 1, 0, 180deg)' },
          '100%': { transform: 'perspective(400px) rotate3d(1, 1, 0, 360deg)' },
        },
        tilt: {
          '0%': { transform: 'perspective(400px) rotateX(0deg) rotateY(0deg)' },
          '50%': { transform: 'perspective(400px) rotateX(5deg) rotateY(5deg)' },
          '100%': { transform: 'perspective(400px) rotateX(0deg) rotateY(0deg)' },
        },
      },
    },
  },
  plugins: [],
}
