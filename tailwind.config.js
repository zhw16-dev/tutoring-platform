/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary color palette
        'sage-green': {
          DEFAULT: '#A8C6A2',
          light: '#D4E7D1',
          dark: '#8FB087',
        },
        'forest-green': {
          DEFAULT: '#2E4C3C',
          light: '#4A6B5C',
        },
        'golden-yellow': {
          DEFAULT: '#F5E6A3',
          light: '#FAF0D1',
          dark: '#E6D280',
        },
        'cream': {
          DEFAULT: '#FFFDF5',
          dark: '#F8F6E8',
        },
        
        // Semantic colors for better component consistency
        primary: {
          DEFAULT: '#A8C6A2', // sage-green
          hover: '#2E4C3C',   // forest-green
          light: '#D4E7D1',   // sage-green-light
        },
        secondary: {
          DEFAULT: '#FFFDF5', // cream
          hover: '#F8F6E8',   // cream-dark
        },
        warning: {
          DEFAULT: '#F5E6A3', // golden-yellow
          light: '#FAF0D1',   // golden-yellow-light
          dark: '#E6D280',    // golden-yellow-dark
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Single font family
        primary: ['Inter', 'sans-serif'], // Alias for consistency
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      fontSize: {
        // Consistent typography scale
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        // Consistent spacing scale
        'xs': '0.25rem',  // 4px
        'sm': '0.5rem',   // 8px
        'md': '1rem',     // 16px
        'lg': '1.5rem',   // 24px
        'xl': '2rem',     // 32px
        '2xl': '2.5rem',  // 40px
        '3xl': '3rem',    // 48px
      },
      borderRadius: {
        'sm': '0.375rem',  // 6px
        'DEFAULT': '0.5rem',     // 8px
        'md': '0.5rem',    // 8px
        'lg': '0.75rem',   // 12px
        'xl': '1rem',      // 16px
      },
      boxShadow: {
        // Consistent shadow system
        'soft': '0 2px 8px rgba(46, 76, 60, 0.08), 0 1px 3px rgba(46, 76, 60, 0.06)',
        'modal': '0 10px 25px rgba(46, 76, 60, 0.15), 0 4px 6px rgba(46, 76, 60, 0.1)',
        'hover': '0 4px 12px rgba(46, 76, 60, 0.12), 0 2px 4px rgba(46, 76, 60, 0.08)',
        'focus': '0 0 0 3px rgba(168, 198, 162, 0.1)',
      },
      animation: {
        'pulse-sage': 'pulse-sage 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.2s ease-in-out',
      },
      keyframes: {
        'pulse-sage': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slideUp': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      transitionProperty: {
        'all': 'all',
        'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
        'shadow': 'box-shadow, transform',
        'spacing': 'margin, padding',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
    },
  },
  plugins: [
    // Custom plugin for component classes
    function({ addComponents, theme }) {
      addComponents({
        // Button components using design tokens
        '.btn': {
          fontFamily: theme('fontFamily.primary'),
          fontWeight: theme('fontWeight.medium'),
          fontSize: theme('fontSize.sm'),
          padding: `${theme('spacing.sm')} ${theme('spacing.lg')}`,
          borderRadius: theme('borderRadius.md'),
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          border: '1px solid transparent',
        },
        '.btn-primary': {
          backgroundColor: theme('colors.primary.DEFAULT'),
          color: theme('colors.cream.DEFAULT'),
          borderColor: theme('colors.primary.DEFAULT'),
          '&:hover': {
            backgroundColor: theme('colors.primary.hover'),
            borderColor: theme('colors.primary.hover'),
            boxShadow: theme('boxShadow.hover'),
            transform: 'translateY(-1px)',
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
            transform: 'none',
            boxShadow: 'none',
          },
        },
        '.btn-secondary': {
          backgroundColor: theme('colors.secondary.DEFAULT'),
          color: theme('colors.forest-green.DEFAULT'),
          borderColor: theme('colors.primary.light'),
          '&:hover': {
            backgroundColor: theme('colors.primary.light'),
            borderColor: theme('colors.primary.DEFAULT'),
          },
        },
        '.btn-warning': {
          backgroundColor: theme('colors.warning.DEFAULT'),
          color: theme('colors.forest-green.DEFAULT'),
          borderColor: theme('colors.warning.DEFAULT'),
          '&:hover': {
            backgroundColor: theme('colors.warning.dark'),
            borderColor: theme('colors.warning.dark'),
          },
        },
        
        // Card components
        '.card': {
          backgroundColor: theme('colors.cream.DEFAULT'),
          border: `1px solid ${theme('colors.sage-green.light')}`,
          borderRadius: theme('borderRadius.md'),
          boxShadow: theme('boxShadow.soft'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: theme('boxShadow.hover'),
            transform: 'translateY(-1px)',
            borderColor: theme('colors.sage-green.DEFAULT'),
          },
        },
        
        // Navigation components
        '.nav-link': {
          color: theme('colors.forest-green.DEFAULT'),
          fontWeight: theme('fontWeight.medium'),
          textDecoration: 'none',
          transition: 'color 0.2s ease-in-out',
          fontFamily: theme('fontFamily.primary'),
          '&:hover': {
            color: theme('colors.sage-green.DEFAULT'),
          },
          '&.active': {
            color: theme('colors.sage-green.DEFAULT'),
            fontWeight: theme('fontWeight.semibold'),
          },
        },
        
        // Badge components
        '.badge': {
          fontFamily: theme('fontFamily.primary'),
          fontWeight: theme('fontWeight.medium'),
          fontSize: theme('fontSize.xs'),
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          display: 'inline-flex',
          alignItems: 'center',
        },
        '.badge-active': {
          backgroundColor: theme('colors.sage-green.DEFAULT'),
          color: theme('colors.cream.DEFAULT'),
        },
        '.badge-pending': {
          backgroundColor: theme('colors.warning.light'),
          color: theme('colors.forest-green.DEFAULT'),
        },
        '.badge-inactive': {
          backgroundColor: '#e5e7eb',
          color: '#6b7280',
        },
      })
    }
  ],
}