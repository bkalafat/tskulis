/**
 * Simple Button Component for TS Kulis
 * CSS-in-JS alternative using React inline styles
 */

import React from 'react';
import { theme } from '../../styles/theme';

export interface SimpleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const getButtonStyles = (props: SimpleButtonProps): React.CSSProperties => {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false
  } = props;

  // Base styles
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    fontFamily: theme.typography.fontFamily.sans,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: theme.typography.lineHeight.tight,
    letterSpacing: theme.typography.letterSpacing.wide,
    textDecoration: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease-out',
    position: 'relative',
    overflow: 'hidden',
    border: 'none',
    borderRadius: theme.borderRadius.md,
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
  };

  // Size styles
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
      fontSize: theme.typography.fontSize.sm,
    },
    md: {
      padding: `${theme.spacing[2.5]} ${theme.spacing[4]}`,
      fontSize: theme.typography.fontSize.base,
    },
    lg: {
      padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
      fontSize: theme.typography.fontSize.lg,
      borderRadius: theme.borderRadius.lg,
    },
  };

  // Variant styles
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: theme.colors.primary[500],
      color: 'white',
      border: `1px solid ${theme.colors.primary[500]}`,
    },
    secondary: {
      backgroundColor: theme.colors.secondary[500],
      color: 'white',
      border: `1px solid ${theme.colors.secondary[500]}`,
    },
    outline: {
      backgroundColor: 'transparent',
      color: theme.colors.primary[500],
      border: `1px solid ${theme.colors.primary[500]}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.primary[500],
      border: '1px solid transparent',
    },
  };

  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

const LoadingSpinner: React.FC = () => (
  <div
    style={{
      width: '1em',
      height: '1em',
      border: '2px solid transparent',
      borderTop: '2px solid currentColor',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }}
  />
);

export const SimpleButton: React.FC<SimpleButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  const buttonStyles = getButtonStyles({
    variant,
    size,
    fullWidth,
    loading,
    disabled,
  });

  // Hover styles
  const getHoverStyles = (): React.CSSProperties => {
    if (disabled || loading || !isHovered) return {};
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary[600],
          borderColor: theme.colors.primary[600],
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary[600],
          borderColor: theme.colors.secondary[600],
        };
      case 'outline':
        return {
          backgroundColor: theme.colors.primary[500],
          color: 'white',
        };
      case 'ghost':
        return {
          backgroundColor: theme.colors.primary[50],
        };
      default:
        return {};
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    onMouseLeave?.(e);
  };

  return (
    <button
      style={{
        ...buttonStyles,
        ...getHoverStyles(),
        ...style,
      }}
      disabled={disabled || loading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && leftIcon && leftIcon}
      {children}
      {!loading && rightIcon && rightIcon}
    </button>
  );
};

export default SimpleButton;