/**
 * Layout Components for TS Kulis
 * Flexible layout primitives for consistent spacing and structure
 */

import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';

// Flex Box Component
export interface FlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: keyof typeof theme.spacing;
  fullWidth?: boolean;
  fullHeight?: boolean;
  className?: string;
}

const StyledFlex = styled.div<FlexProps>`
  display: flex;
  
  ${(props: FlexProps) => props.direction && css`
    flex-direction: ${props.direction};
  `}
  
  ${(props: FlexProps) => props.justify && css`
    justify-content: ${props.justify};
  `}
  
  ${(props: FlexProps) => props.align && css`
    align-items: ${props.align};
  `}
  
  ${(props: FlexProps) => props.wrap && css`
    flex-wrap: ${props.wrap};
  `}
  
  ${(props: FlexProps) => props.gap && css`
    gap: ${theme.spacing[props.gap]};
  `}
  
  ${(props: FlexProps) => props.fullWidth && css`
    width: 100%;
  `}
  
  ${(props: FlexProps) => props.fullHeight && css`
    height: 100%;
  `}
`;

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  justify = 'flex-start',
  align = 'stretch',
  wrap = 'nowrap',
  gap,
  fullWidth = false,
  fullHeight = false,
  className,
  ...props
}) => {
  return (
    <StyledFlex
      direction={direction}
      justify={justify}
      align={align}
      wrap={wrap}
      gap={gap}
      fullWidth={fullWidth}
      fullHeight={fullHeight}
      className={className}
      {...props}
    >
      {children}
    </StyledFlex>
  );
};

// Grid Component
export interface GridProps {
  children: React.ReactNode;
  columns?: number | string;
  rows?: number | string;
  gap?: keyof typeof theme.spacing;
  columnGap?: keyof typeof theme.spacing;
  rowGap?: keyof typeof theme.spacing;
  autoFit?: boolean;
  minColumnWidth?: string;
  fullWidth?: boolean;
  fullHeight?: boolean;
  className?: string;
}

const StyledGrid = styled.div<GridProps>`
  display: grid;
  
  ${(props: GridProps) => {
    if (props.autoFit && props.minColumnWidth) {
      return css`
        grid-template-columns: repeat(auto-fit, minmax(${props.minColumnWidth}, 1fr));
      `;
    } else if (props.columns) {
      return css`
        grid-template-columns: ${typeof props.columns === 'number' 
          ? `repeat(${props.columns}, 1fr)` 
          : props.columns};
      `;
    }
    return '';
  }}
  
  ${(props: GridProps) => props.rows && css`
    grid-template-rows: ${typeof props.rows === 'number' 
      ? `repeat(${props.rows}, 1fr)` 
      : props.rows};
  `}
  
  ${(props: GridProps) => props.gap && css`
    gap: ${theme.spacing[props.gap]};
  `}
  
  ${(props: GridProps) => props.columnGap && css`
    column-gap: ${theme.spacing[props.columnGap]};
  `}
  
  ${(props: GridProps) => props.rowGap && css`
    row-gap: ${theme.spacing[props.rowGap]};
  `}
  
  ${(props: GridProps) => props.fullWidth && css`
    width: 100%;
  `}
  
  ${(props: GridProps) => props.fullHeight && css`
    height: 100%;
  `}
`;

export const Grid: React.FC<GridProps> = ({
  children,
  columns,
  rows,
  gap,
  columnGap,
  rowGap,
  autoFit = false,
  minColumnWidth = '250px',
  fullWidth = false,
  fullHeight = false,
  className,
  ...props
}) => {
  return (
    <StyledGrid
      columns={columns}
      rows={rows}
      gap={gap}
      columnGap={columnGap}
      rowGap={rowGap}
      autoFit={autoFit}
      minColumnWidth={minColumnWidth}
      fullWidth={fullWidth}
      fullHeight={fullHeight}
      className={className}
      {...props}
    >
      {children}
    </StyledGrid>
  );
};

// Stack Component (Vertical spacing)
export interface StackProps {
  children: React.ReactNode;
  space?: keyof typeof theme.spacing;
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
  fullWidth?: boolean;
  className?: string;
}

const StyledStack = styled.div<StackProps>`
  display: flex;
  flex-direction: column;
  
  ${(props: StackProps) => props.space && css`
    gap: ${theme.spacing[props.space]};
  `}
  
  ${(props: StackProps) => props.align && css`
    align-items: ${props.align};
  `}
  
  ${(props: StackProps) => props.fullWidth && css`
    width: 100%;
  `}
`;

export const Stack: React.FC<StackProps> = ({
  children,
  space = '4',
  align = 'stretch',
  fullWidth = false,
  className,
  ...props
}) => {
  return (
    <StyledStack
      space={space}
      align={align}
      fullWidth={fullWidth}
      className={className}
      {...props}
    >
      {children}
    </StyledStack>
  );
};

// Container Component
export interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centerContent?: boolean;
  padding?: keyof typeof theme.spacing;
  className?: string;
}

const getMaxWidth = (maxWidth: ContainerProps['maxWidth']) => {
  switch (maxWidth) {
    case 'xs': return '475px';
    case 'sm': return '640px';
    case 'md': return '768px';
    case 'lg': return '1024px';
    case 'xl': return '1280px';
    case '2xl': return '1536px';
    case 'full': return '100%';
    default: return '1280px';
  }
};

const StyledContainer = styled.div<ContainerProps>`
  width: 100%;
  margin: 0 auto;
  
  ${(props: ContainerProps) => css`
    max-width: ${getMaxWidth(props.maxWidth)};
  `}
  
  ${(props: ContainerProps) => props.centerContent && css`
    display: flex;
    flex-direction: column;
    align-items: center;
  `}
  
  ${(props: ContainerProps) => props.padding && css`
    padding: ${theme.spacing[props.padding]};
  `}
  
  ${theme.media.sm} {
    padding-left: ${theme.spacing[6]};
    padding-right: ${theme.spacing[6]};
  }
  
  ${theme.media.lg} {
    padding-left: ${theme.spacing[8]};
    padding-right: ${theme.spacing[8]};
  }
`;

export const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth = 'xl',
  centerContent = false,
  padding,
  className,
  ...props
}) => {
  return (
    <StyledContainer
      maxWidth={maxWidth}
      centerContent={centerContent}
      padding={padding}
      className={className}
      {...props}
    >
      {children}
    </StyledContainer>
  );
};

// Spacer Component
export interface SpacerProps {
  size?: keyof typeof theme.spacing;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

const StyledSpacer = styled.div<SpacerProps>`
  ${(props: SpacerProps) => {
    const size = theme.spacing[props.size || '4'];
    if (props.direction === 'horizontal') {
      return css`
        width: ${size};
        height: 1px;
        display: inline-block;
      `;
    }
    return css`
      height: ${size};
      width: 1px;
    `;
  }}
`;

export const Spacer: React.FC<SpacerProps> = ({
  size = '4',
  direction = 'vertical',
  className,
  ...props
}) => {
  return (
    <StyledSpacer
      size={size}
      direction={direction}
      className={className}
      {...props}
    />
  );
};

export default {
  Flex,
  Grid,
  Stack,
  Container,
  Spacer,
};