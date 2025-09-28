/**
 * Theme System for TS Kulis
 * Comprehensive design system with consistent styling
 */

import { css } from 'styled-components';

// Color palette
export const colors = {
  // Primary colors (Trabzonspor theme)
  primary: {
    50: '#f0f4ff',
    100: '#dae6ff',
    200: '#b8ceff',
    300: '#8aa8ff',
    400: '#5975ff',
    500: '#3448ff',  // Main Trabzonspor blue
    600: '#2a36cc',
    700: '#1f2899',
    800: '#161c66',
    900: '#0d1033',
    950: '#060819',
  },
  
  // Secondary colors (Burgundy accent)
  secondary: {
    50: '#fef2f2',
    100: '#fce7e7',
    200: '#f9d0d0',
    300: '#f5b5b5',
    400: '#f08a8a',
    500: '#e56565',
    600: '#d94848',
    700: '#b83535', // Trabzonspor burgundy
    800: '#982929',
    900: '#7c2323',
    950: '#431010',
  },
  
  // Grayscale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  
  // Status colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  
  info: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  
  // Semantic colors
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    disabled: '#9ca3af',
    inverse: '#ffffff',
  },
  
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    inverse: '#111827',
  },
  
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    dark: '#9ca3af',
  },
};

// Typography scale
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'].join(', '),
    serif: ['Georgia', 'Times New Roman', 'serif'].join(', '),
    mono: ['Menlo', 'Monaco', 'Consolas', 'monospace'].join(', '),
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },
  
  fontWeight: {
    thin: 100,
    extraLight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
    extraBold: 800,
    black: 900,
  },
  
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Spacing scale
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
};

// Breakpoints
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Shadow scale
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
};

// Border radius scale
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

// Z-index scale
export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modal: '1040',
  popover: '1050',
  tooltip: '1060',
  toast: '1070',
};

// Animation durations
export const duration = {
  75: '75ms',
  100: '100ms',
  150: '150ms',
  200: '200ms',
  300: '300ms',
  500: '500ms',
  700: '700ms',
  1000: '1000ms',
};

// Animation easings
export const easing = {
  linear: 'cubic-bezier(0, 0, 1, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'bounce-out': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// Media query helpers
export const media = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
  
  // Max width queries
  'max-xs': `@media (max-width: ${breakpoints.xs})`,
  'max-sm': `@media (max-width: ${breakpoints.sm})`,
  'max-md': `@media (max-width: ${breakpoints.md})`,
  'max-lg': `@media (max-width: ${breakpoints.lg})`,
  'max-xl': `@media (max-width: ${breakpoints.xl})`,
  
  // Range queries
  'sm-md': `@media (min-width: ${breakpoints.sm}) and (max-width: ${breakpoints.md})`,
  'md-lg': `@media (min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`,
  'lg-xl': `@media (min-width: ${breakpoints.lg}) and (max-width: ${breakpoints.xl})`,
  
  // Special queries
  mobile: '@media (max-width: 767px)',
  tablet: '@media (min-width: 768px) and (max-width: 1023px)',
  desktop: '@media (min-width: 1024px)',
  print: '@media print',
  'reduced-motion': '@media (prefers-reduced-motion: reduce)',
  'dark-mode': '@media (prefers-color-scheme: dark)',
};

// Component variants
export const components = {
  button: {
    sizes: {
      sm: css`
        padding: ${spacing[2]} ${spacing[3]};
        font-size: ${typography.fontSize.sm};
        border-radius: ${borderRadius.md};
      `,
      md: css`
        padding: ${spacing[2.5]} ${spacing[4]};
        font-size: ${typography.fontSize.base};
        border-radius: ${borderRadius.md};
      `,
      lg: css`
        padding: ${spacing[3]} ${spacing[6]};
        font-size: ${typography.fontSize.lg};
        border-radius: ${borderRadius.lg};
      `,
    },
    
    variants: {
      primary: css`
        background-color: ${colors.primary[500]};
        color: white;
        border: 1px solid ${colors.primary[500]};
        
        &:hover {
          background-color: ${colors.primary[600]};
          border-color: ${colors.primary[600]};
        }
        
        &:active {
          background-color: ${colors.primary[700]};
          border-color: ${colors.primary[700]};
        }
        
        &:disabled {
          background-color: ${colors.gray[300]};
          border-color: ${colors.gray[300]};
          color: ${colors.gray[500]};
        }
      `,
      
      secondary: css`
        background-color: ${colors.secondary[500]};
        color: white;
        border: 1px solid ${colors.secondary[500]};
        
        &:hover {
          background-color: ${colors.secondary[600]};
          border-color: ${colors.secondary[600]};
        }
        
        &:active {
          background-color: ${colors.secondary[700]};
          border-color: ${colors.secondary[700]};
        }
      `,
      
      outline: css`
        background-color: transparent;
        color: ${colors.primary[500]};
        border: 1px solid ${colors.primary[500]};
        
        &:hover {
          background-color: ${colors.primary[500]};
          color: white;
        }
      `,
      
      ghost: css`
        background-color: transparent;
        color: ${colors.primary[500]};
        border: 1px solid transparent;
        
        &:hover {
          background-color: ${colors.primary[50]};
        }
      `,
    },
  },
  
  input: {
    base: css`
      padding: ${spacing[2.5]} ${spacing[3]};
      border: 1px solid ${colors.border.medium};
      border-radius: ${borderRadius.md};
      font-size: ${typography.fontSize.base};
      transition: all ${duration[150]} ${easing.out};
      
      &:focus {
        outline: none;
        border-color: ${colors.primary[500]};
        box-shadow: 0 0 0 3px ${colors.primary[500]}20;
      }
      
      &:disabled {
        background-color: ${colors.background.tertiary};
        color: ${colors.text.disabled};
        cursor: not-allowed;
      }
      
      &::placeholder {
        color: ${colors.text.secondary};
      }
    `,
    
    sizes: {
      sm: css`
        padding: ${spacing[2]} ${spacing[2.5]};
        font-size: ${typography.fontSize.sm};
      `,
      lg: css`
        padding: ${spacing[3]} ${spacing[4]};
        font-size: ${typography.fontSize.lg};
      `,
    },
    
    variants: {
      error: css`
        border-color: ${colors.error[500]};
        
        &:focus {
          border-color: ${colors.error[500]};
          box-shadow: 0 0 0 3px ${colors.error[500]}20;
        }
      `,
      
      success: css`
        border-color: ${colors.success[500]};
        
        &:focus {
          border-color: ${colors.success[500]};
          box-shadow: 0 0 0 3px ${colors.success[500]}20;
        }
      `,
    },
  },
  
  card: {
    base: css`
      background-color: ${colors.background.primary};
      border: 1px solid ${colors.border.light};
      border-radius: ${borderRadius.lg};
      box-shadow: ${shadows.sm};
      transition: all ${duration[200]} ${easing.out};
    `,
    
    variants: {
      elevated: css`
        box-shadow: ${shadows.md};
        
        &:hover {
          box-shadow: ${shadows.lg};
          transform: translateY(-2px);
        }
      `,
      
      interactive: css`
        cursor: pointer;
        
        &:hover {
          box-shadow: ${shadows.md};
          border-color: ${colors.primary[300]};
        }
      `,
    },
  },
};

// Utility functions
export const rem = (pixels: number): string => `${pixels / 16}rem`;
export const em = (pixels: number, base = 16): string => `${pixels / base}em`;

// Theme object
export const theme = {
  colors,
  typography,
  spacing,
  breakpoints,
  shadows,
  borderRadius,
  zIndex,
  duration,
  easing,
  media,
  components,
  rem,
  em,
};

export type Theme = typeof theme;

export default theme;