/**
 * Typography Components for TS Kulis
 * Consistent text styling across the application
 */

import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';

export interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';
  color?: 'primary' | 'secondary' | 'disabled' | 'error' | 'success' | 'warning';
  align?: 'left' | 'center' | 'right' | 'justify';
  weight?: 'light' | 'normal' | 'medium' | 'semiBold' | 'bold';
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

const getVariantStyles = (variant: TypographyProps['variant']) => {
  switch (variant) {
    case 'h1':
      return css`
        font-size: ${theme.typography.fontSize['5xl']};
        font-weight: ${theme.typography.fontWeight.bold};
        line-height: ${theme.typography.lineHeight.tight};
        letter-spacing: ${theme.typography.letterSpacing.tight};
      `;
    case 'h2':
      return css`
        font-size: ${theme.typography.fontSize['4xl']};
        font-weight: ${theme.typography.fontWeight.bold};
        line-height: ${theme.typography.lineHeight.tight};
        letter-spacing: ${theme.typography.letterSpacing.tight};
      `;
    case 'h3':
      return css`
        font-size: ${theme.typography.fontSize['3xl']};
        font-weight: ${theme.typography.fontWeight.semiBold};
        line-height: ${theme.typography.lineHeight.snug};
      `;
    case 'h4':
      return css`
        font-size: ${theme.typography.fontSize['2xl']};
        font-weight: ${theme.typography.fontWeight.semiBold};
        line-height: ${theme.typography.lineHeight.snug};
      `;
    case 'h5':
      return css`
        font-size: ${theme.typography.fontSize.xl};
        font-weight: ${theme.typography.fontWeight.medium};
        line-height: ${theme.typography.lineHeight.snug};
      `;
    case 'h6':
      return css`
        font-size: ${theme.typography.fontSize.lg};
        font-weight: ${theme.typography.fontWeight.medium};
        line-height: ${theme.typography.lineHeight.normal};
      `;
    case 'body1':
      return css`
        font-size: ${theme.typography.fontSize.base};
        font-weight: ${theme.typography.fontWeight.normal};
        line-height: ${theme.typography.lineHeight.normal};
      `;
    case 'body2':
      return css`
        font-size: ${theme.typography.fontSize.sm};
        font-weight: ${theme.typography.fontWeight.normal};
        line-height: ${theme.typography.lineHeight.normal};
      `;
    case 'caption':
      return css`
        font-size: ${theme.typography.fontSize.xs};
        font-weight: ${theme.typography.fontWeight.normal};
        line-height: ${theme.typography.lineHeight.tight};
        color: ${theme.colors.text.secondary};
      `;
    case 'overline':
      return css`
        font-size: ${theme.typography.fontSize.xs};
        font-weight: ${theme.typography.fontWeight.semiBold};
        line-height: ${theme.typography.lineHeight.tight};
        letter-spacing: ${theme.typography.letterSpacing.wider};
        text-transform: uppercase;
        color: ${theme.colors.text.secondary};
      `;
    default:
      return css`
        font-size: ${theme.typography.fontSize.base};
        font-weight: ${theme.typography.fontWeight.normal};
        line-height: ${theme.typography.lineHeight.normal};
      `;
  }
};

const getColorStyles = (color: TypographyProps['color']) => {
  switch (color) {
    case 'primary':
      return css`color: ${theme.colors.text.primary};`;
    case 'secondary':
      return css`color: ${theme.colors.text.secondary};`;
    case 'disabled':
      return css`color: ${theme.colors.text.disabled};`;
    case 'error':
      return css`color: ${theme.colors.error[500]};`;
    case 'success':
      return css`color: ${theme.colors.success[500]};`;
    case 'warning':
      return css`color: ${theme.colors.warning[500]};`;
    default:
      return '';
  }
};

const StyledTypography = styled.div<TypographyProps>`
  font-family: ${theme.typography.fontFamily.sans};
  margin: 0;
  
  ${(props: TypographyProps) => getVariantStyles(props.variant)}
  ${(props: TypographyProps) => getColorStyles(props.color)}
  
  ${(props: TypographyProps) => props.align && css`
    text-align: ${props.align};
  `}
  
  ${(props: TypographyProps) => props.weight && css`
    font-weight: ${theme.typography.fontWeight[props.weight]};
  `}
`;

const getDefaultElement = (variant: TypographyProps['variant']): keyof JSX.IntrinsicElements => {
  switch (variant) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return variant;
    case 'body1':
    case 'body2':
      return 'p';
    case 'caption':
    case 'overline':
      return 'span';
    default:
      return 'div';
  }
};

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body1',
  color = 'primary',
  align,
  weight,
  className,
  as,
  ...props
}) => {
  const component = as || getDefaultElement(variant);
  
  return (
    <StyledTypography
      as={component}
      variant={variant}
      color={color}
      align={align}
      weight={weight}
      className={className}
      {...props}
    >
      {children}
    </StyledTypography>
  );
};

// Convenience components
export const Heading1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" {...props} />
);

export const Heading2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h2" {...props} />
);

export const Heading3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h3" {...props} />
);

export const Heading4: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h4" {...props} />
);

export const Heading5: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h5" {...props} />
);

export const Heading6: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h6" {...props} />
);

export const Body1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body1" {...props} />
);

export const Body2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body2" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
);

export const Overline: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="overline" {...props} />
);

export default Typography;