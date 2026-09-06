/** @type {import('tailwindcss').Config} */
module.exports = {
  // 'class' strategy kept for a possible dark theme
  darkMode: 'class',

  content: ['./src/**/*.{html,ts}'],

  // All utilities are prefixed to avoid collisions with NG-ZORRO's `ant-*` classes
  prefix: 'tw-',

  theme: {
    extend: {
      colors: {
        // Bleu France (DSFR) — primary institutional color
        brand: {
          50: '#e3e3fd',
          100: '#cacafb',
          200: '#adadf9',
          300: '#8585f6',
          400: '#6a6af4',
          500: '#000091', // primary CTAs, links, focus rings
          600: '#00007a',
          700: '#000063',
          800: '#00004d',
          900: '#000036',
        },
        accent: {
          300: '#F5CE82',
          400: '#EDB732',
          500: '#C9860A', // notification badges, action highlights
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#FAFAFA',
          tertiary: '#F0F2F5',
          border: '#D9D9D9',
        },
        // Accessible semantic colors — all ≥ 4.5:1 on white
        semantic: {
          success: '#1f7a3c',
          warning: '#a05c00',
          error: '#c62828',
          info: '#000091',
        },
        text: {
          primary: '#141414',
          secondary: '#595959',
          disabled: '#767676',
          inverse: '#FFFFFF',
          link: '#000091',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        xs: ['11px', '1.4'],
        sm: ['13px', '1.5'],
        base: ['15px', '1.6'], // 15px base for readability
        md: ['16px', '1.6'],
        lg: ['17px', '1.4'],
        xl: ['19px', '1.3'],
        '2xl': ['22px', '1.25'],
        '3xl': ['26px', '1.2'],
        '4xl': ['30px', '1.1'],
      },
      spacing: {
        4.5: '1.125rem',
        11: '2.75rem',
        12: '3rem', // 48px — touch target
        13: '3.25rem',
        14: '3.5rem', // 56px — large CTA
        18: '4.5rem',
      },
      minHeight: {
        touch: '48px', // WCAG 2.5.5 minimum touch target
        'touch-lg': '56px',
      },
      minWidth: {
        touch: '48px',
        'touch-lg': '56px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02)',
        'card-hover': '0 4px 12px rgba(0,0,145,0.10)',
        nav: '0 2px 8px rgba(0,0,145,0.15)',
      },
    },
  },

  corePlugins: {
    // NG-ZORRO owns base/reset styles
    preflight: false,
  },

  plugins: [],
};
