/**
 * Button Component for TS Kulis
 * Reusable button with consistent styling and variants
 */

import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[2]};
  font-family: ${theme.typography.fontFamily.sans};
  font-weight: ${theme.typography.fontWeight.medium};
  line-height: ${theme.typography.lineHeight.tight};
  letter-spacing: ${theme.typography.letterSpacing.wide};
  text-decoration: none;
  cursor: pointer;
  transition: all ${theme.duration[150]} ${theme.easing.out};
  position: relative;
  overflow: hidden;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${theme.colors.primary[500]}30;
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  ${(props: ButtonProps) => props.fullWidth && css`
    width: 100%;
  `}
  
  ${(props: ButtonProps) => props.loading && css`
    pointer-events: none;
    opacity: 0.8;
  `}
  
  /* Size variants */
  ${(props: ButtonProps) => theme.components.button.sizes[props.size || 'md']}
  
  /* Style variants */
  ${(props: ButtonProps) => theme.components.button.variants[props.variant || 'primary']}
`;

const LoadingSpinner = styled.div`
  width: 1em;
  height: 1em;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      loading={loading}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && leftIcon && leftIcon}
      {children}
      {!loading && rightIcon && rightIcon}
    </StyledButton>
  );
};

export default Button;