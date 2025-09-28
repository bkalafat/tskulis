/**
 * Card Component for TS Kulis
 * Reusable card container with consistent styling
 */

import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const StyledCard = styled.div<CardProps>`
  ${theme.components.card.base}
  
  ${(props: CardProps) => props.padding === 'none' && css`
    padding: 0;
  `}
  
  ${(props: CardProps) => props.padding === 'sm' && css`
    padding: ${theme.spacing[3]};
  `}
  
  ${(props: CardProps) => props.padding === 'md' && css`
    padding: ${theme.spacing[6]};
  `}
  
  ${(props: CardProps) => props.padding === 'lg' && css`
    padding: ${theme.spacing[8]};
  `}
  
  ${(props: CardProps) => props.variant === 'elevated' && theme.components.card.variants.elevated}
  ${(props: CardProps) => props.variant === 'interactive' && theme.components.card.variants.interactive}
`;

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  onClick,
  ...props
}) => {
  return (
    <StyledCard
      variant={variant}
      padding={padding}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </StyledCard>
  );
};

export default Card;