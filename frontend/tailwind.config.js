/** @type {import('tailwindcss').Config} */
// Mirrors the T-Mobile Design System (TDDS) — see /toolkit/apps/personal-assistant/frontend/src/demo/demoTheme.ts
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // T-Mobile Magenta — primary brand
        magenta: {
          50:  '#fff5fa',  // accessedBg subtle
          100: '#ffe5f0',  // accessedBgStrong
          200: '#ffb8d8',
          300: '#ff85ba',
          400: '#ff52a3',  // tdds primary-200 — watermelon
          500: '#e20074',  // tdds primary-400 — T-Mobile Magenta ★
          600: '#a7005a',  // tdds primary-500 — berry / hover
          700: '#770141',  // tdds primary-600 — dark berry / pressed
          800: '#530129',
          900: '#2e0117',
        },
        // Compat alias: legacy pages use `primary-*` for buttons/active states/nav.
        // Mapping to TDDS near-black grays — this is t-mobile.com's actual pattern
        // (black UI chrome, magenta reserved for spotlight CTAs). Real magenta is
        // available explicitly via `magenta-*`.
        primary: {
          50:  '#fbfbfb',
          100: '#f5f5f5',
          200: '#e6e6e6',
          300: '#cccccc',
          400: '#8c8c8c',
          500: '#414141',
          600: '#2a2a2a',
          700: '#1f1f1f',
          800: '#141414',
          900: '#141414',
          950: '#000000',
        },
        // TDDS grayscale — near-black text, NOT pure #000
        tdds: {
          50:  '#fbfbfb',  // grayscale-100 — subtle elevated
          100: '#f5f5f5',  // grayscale-200 — page canvas ★
          200: '#e6e6e6',  // grayscale-300 — border subtle ★
          300: '#cccccc',  // grayscale-400 — border default
          400: '#8c8c8c',  // grayscale-500 — border strong / muted text
          500: '#6a6a6a',  // grayscale-600 — tertiary text / T-Mobile Dark Grey
          600: '#414141',  // grayscale-700 — secondary text
          700: '#2a2a2a',
          800: '#1f1f1f',
          900: '#141414',  // grayscale-1000 — primary text ★ (not pure black)
        },
        // Semantic — TDDS status tokens
        success: '#008110',  // status-positive-300
        warning: '#ad590b',  // status-caution-300
        critical: '#d20d00', // status-critical-300
        // Negotiation-impact accent (the "green bar" of the waterfall).
        // Per the onboarding doc this should READ as positive impact. T-Mobile
        // green is uncommon in the brand; we use TDDS success as a calm accent
        // but keep magenta as the brand spotlight elsewhere.
        impact: '#008110',
      },
      fontFamily: {
        // TeleNeo first (proprietary — falls through to Plus Jakarta Sans).
        // Plus Jakarta Sans is the closest free substitute for TeleNeo's
        // geometric-rounded display feel.
        sans: ['Inter', 'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['TeleNeo', '"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Consolas', 'monospace'],
      },
      fontSize: {
        // TDDS scale — body-md is 14px, headlines climb to 32px
        '2xs':   ['11px', { lineHeight: '1.3' }],
        'xs':    ['12px', { lineHeight: '1.4' }],
        'sm':    ['13px', { lineHeight: '1.45' }],
        'base':  ['14px', { lineHeight: '1.55' }],
        'lg':    ['16px', { lineHeight: '1.5' }],
        'xl':    ['20px', { lineHeight: '1.3',  letterSpacing: '-0.01em',  fontWeight: '700' }],
        '2xl':   ['24px', { lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '700' }],
        '3xl':   ['32px', { lineHeight: '1.15', letterSpacing: '-0.02em',  fontWeight: '700' }],
        '4xl':   ['40px', { lineHeight: '1.1',  letterSpacing: '-0.025em', fontWeight: '800' }],
        // Dollar-impact display sizes — tabular, headline weight
        'stat':    ['28px', { lineHeight: '1',    letterSpacing: '-0.02em',  fontWeight: '700' }],
        'stat-lg': ['40px', { lineHeight: '1',    letterSpacing: '-0.025em', fontWeight: '800' }],
        'stat-xl': ['56px', { lineHeight: '1',    letterSpacing: '-0.03em',  fontWeight: '800' }],
        // Eyebrow — uppercase tracked label above sections
        'eyebrow': ['10px', { lineHeight: '1.3', letterSpacing: '0.1em', fontWeight: '600' }],
      },
      borderRadius: {
        // TDDS uses TIGHT radii — 2/4/8/12, no big bubbles
        none: '0',
        xs: '2px',
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',     // tdds card
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        // TDDS onLight shadows — neutral gray rgba(65,65,65, .19)
        xs: '0 1px 2px 0 rgba(65, 65, 65, 0.08)',
        sm: '0 2px 2px 0 rgba(65, 65, 65, 0.12)',
        DEFAULT: '0 3px 10px 0 rgba(65, 65, 65, 0.14)',
        md: '0 4px 14px -2px rgba(65, 65, 65, 0.16)',
        lg: '0 8px 24px 0 rgba(65, 65, 65, 0.18)',
        glow: '0 0 0 3px rgba(226, 0, 116, 0.16)',
        focus: '0 0 0 3px rgba(226, 0, 116, 0.32)',
      },
      transitionTimingFunction: {
        tdds: 'cubic-bezier(0.4, 0, 0.2, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'card-flash': {
          '0%':   { boxShadow: '0 0 0 0 rgba(226, 0, 116, 0)' },
          '8%':   { boxShadow: '0 0 22px 4px rgba(226, 0, 116, 0.22)' },
          '100%': { boxShadow: '0 0 0 0 rgba(226, 0, 116, 0)' },
        },
      },
      animation: {
        'fade-in':    'fade-in 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up':   'slide-up 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'card-flash': 'card-flash 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
