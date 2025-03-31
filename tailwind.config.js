/** @type {import('tailwindcss').Config} */
// import colors from 'tailwindcss/colors';

export default {
    content: ['src/assets/**', 'src/entrypoints/**', 'src/components/**'],
    darkMode: 'class',
    theme: {
      colors: {
        'okRed': {
          50: '#fcf3f6',
          100: '#fae9ef',
          200: '#f7d3e0',
          300: '#f2afc4',
          400: '#e97d9e',
          500: '#db436c',
          600: '#cc3657',
          700: '#b02640',
          800: '#922236',
          900: '#7a2131',
          950: '#4a0d17',
        },
        'okGreen': {
          50: '#eefbf6',
          100: '#d5f6e7',
          200: '#98e5c7',
          300: '#7bdabb',
          400: '#45c29d',
          500: '#22a784',
          600: '#15866b',
          700: '#106c59',
          800: '#105547',
          900: '#0e463b',
          950: '#072722',
        },
        'okGold': {
          50: '#fff9eb',
          100: '#fdedc8',
          200: '#fbdc8c',
          300: '#f9c350',
          400: '#f8b135',
          500: '#f18a0f',
          600: '#d66609',
          700: '#b1450c',
          800: '#903610',
          900: '#762c11',
          950: '#441504',
        },
        'okBlue': {
          50: '#f0f7fe',
          100: '#deecfb',
          200: '#c4e1f9',
          300: '#9ccef4',
          400: '#67aeec',
          500: '#4b93e6',
          600: '#3677da',
          700: '#2d63c8',
          800: '#2a51a3',
          900: '#274681',
          950: '#1c2c4f',
        },
        okPurple: {
          50: '#fbf7fc',
          100: '#f8eef9',
          200: '#efdbf3',
          300: '#e5bee9',
          400: '#d698da',
          500: '#b85bbf',
          600: '#a54faa',
          700: '#8a3f8c',
          800: '#723573',
          900: '#5f305e',
          950: '#3c163c',
        },
      },
      extend: {
        colors: {
          primary: {
            bg: 'var(--color-primary-bg)',
            text: 'var(--color-primary-text)',
            border: 'var(--color-primary-border)',
          },
          secondary: {
            bg: 'var(--color-secondary-bg)',
            text: 'var(--color-secondary-text)',
            border: 'var(--color-secondary-border)',
          },
        transitionProperty: {
          'okapi': 'background-color, color, border-color, transform'
        }
        },
      },
    },
    plugins: [],
  }