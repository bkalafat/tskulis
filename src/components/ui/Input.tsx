/**
 * Input Component for TS Kulis
 * Reusable input with consistent styling and validation states
 */

import React, { forwardRef } from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error' | 'success';
  inputSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
  label?: string;
  required?: boolean;
}

const InputWrapper = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[1]};
  
  ${(props: { fullWidth?: boolean }) => props.fullWidth && css`
    width: 100%;
  `}
`;

const Label = styled.label<{ required?: boolean }>`
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  
  ${(props: { required?: boolean }) => props.required && css`
    &::after {
      content: ' *';
      color: ${theme.colors.error[500]};
    }
  `}
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input<InputProps>`
  ${theme.components.input.base}
  
  ${(props: InputProps) => props.leftIcon && css`
    padding-left: ${theme.spacing[10]};
  `}
  
  ${(props: InputProps) => props.rightIcon && css`
    padding-right: ${theme.spacing[10]};
  `}
  
  ${(props: InputProps) => props.fullWidth && css`
    width: 100%;
  `}
  
  /* Size variants */
  ${(props: InputProps) => props.inputSize === 'sm' && theme.components.input.sizes.sm}
  ${(props: InputProps) => props.inputSize === 'lg' && theme.components.input.sizes.lg}
  
  /* Variant styles */
  ${(props: InputProps) => props.variant === 'error' && theme.components.input.variants.error}
  ${(props: InputProps) => props.variant === 'success' && theme.components.input.variants.success}
`;

const IconWrapper = styled.div<{ position: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${theme.spacing[6]};
  height: ${theme.spacing[6]};
  color: ${theme.colors.text.secondary};
  pointer-events: none;
  
  ${(props: { position: 'left' | 'right' }) => props.position === 'left' ? css`
    left: ${theme.spacing[2]};
  ` : css`
    right: ${theme.spacing[2]};
  `}
`;

const HelperText = styled.div<{ variant?: 'default' | 'error' | 'success' }>`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  
  ${(props: { variant?: 'default' | 'error' | 'success' }) => {
    if (props.variant === 'error') return css`color: ${theme.colors.error[500]};`;
    if (props.variant === 'success') return css`color: ${theme.colors.success[500]};`;
    return '';
  }}
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  variant = 'default',
  inputSize = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  helperText,
  label,
  required = false,
  className,
  ...props
}, ref) => {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <InputWrapper fullWidth={fullWidth} className={className}>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      
      <InputContainer>
        {leftIcon && (
          <IconWrapper position="left">
            {leftIcon}
          </IconWrapper>
        )}
        
        <StyledInput
          ref={ref}
          id={inputId}
          variant={variant}
          inputSize={inputSize}
          fullWidth={fullWidth}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          {...props}
        />
        
        {rightIcon && (
          <IconWrapper position="right">
            {rightIcon}
          </IconWrapper>
        )}
      </InputContainer>
      
      {helperText && (
        <HelperText variant={variant}>
          {helperText}
        </HelperText>
      )}
    </InputWrapper>
  );
});

Input.displayName = 'Input';

export default Input;