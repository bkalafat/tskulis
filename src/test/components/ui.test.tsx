/**
 * UI Components Test Suite
 * Tests for the component library
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimpleButton } from '../../components/ui/SimpleButton';
import { ThemeProvider } from '../../styles/ThemeProvider';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('SimpleButton', () => {
  it('renders with default props', () => {
    renderWithTheme(<SimpleButton>Click me</SimpleButton>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies different variants correctly', () => {
    const { rerender } = renderWithTheme(<SimpleButton variant="primary">Primary</SimpleButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <SimpleButton variant="secondary">Secondary</SimpleButton>
      </ThemeProvider>
    );
    expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <SimpleButton variant="outline">Outline</SimpleButton>
      </ThemeProvider>
    );
    expect(screen.getByRole('button', { name: 'Outline' })).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <SimpleButton variant="ghost">Ghost</SimpleButton>
      </ThemeProvider>
    );
    expect(screen.getByRole('button', { name: 'Ghost' })).toBeInTheDocument();
  });

  it('applies different sizes correctly', () => {
    const { rerender } = renderWithTheme(<SimpleButton size="sm">Small</SimpleButton>);
    expect(screen.getByRole('button', { name: 'Small' })).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <SimpleButton size="md">Medium</SimpleButton>
      </ThemeProvider>
    );
    expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <SimpleButton size="lg">Large</SimpleButton>
      </ThemeProvider>
    );
    expect(screen.getByRole('button', { name: 'Large' })).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    renderWithTheme(<SimpleButton loading>Loading</SimpleButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.style.opacity).toBe('0.6');
  });

  it('handles disabled state correctly', () => {
    renderWithTheme(<SimpleButton disabled>Disabled</SimpleButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.style.opacity).toBe('0.6');
  });

  it('applies full width correctly', () => {
    renderWithTheme(<SimpleButton fullWidth>Full Width</SimpleButton>);
    const button = screen.getByRole('button');
    expect(button.style.width).toBe('100%');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    renderWithTheme(<SimpleButton onClick={handleClick}>Click me</SimpleButton>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger click when disabled', () => {
    const handleClick = jest.fn();
    renderWithTheme(
      <SimpleButton disabled onClick={handleClick}>
        Disabled
      </SimpleButton>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not trigger click when loading', () => {
    const handleClick = jest.fn();
    renderWithTheme(
      <SimpleButton loading onClick={handleClick}>
        Loading
      </SimpleButton>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with icons correctly', () => {
    const LeftIcon = () => <span data-testid="left-icon">←</span>;
    const RightIcon = () => <span data-testid="right-icon">→</span>;

    renderWithTheme(
      <SimpleButton leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
        With Icons
      </SimpleButton>
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'With Icons' })).toBeInTheDocument();
  });

  it('hides icons when loading', () => {
    const LeftIcon = () => <span data-testid="left-icon">←</span>;
    const RightIcon = () => <span data-testid="right-icon">→</span>;

    renderWithTheme(
      <SimpleButton loading leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
        Loading
      </SimpleButton>
    );

    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
  });

  it('handles mouse events for hover effects', () => {
    const handleMouseEnter = jest.fn();
    const handleMouseLeave = jest.fn();
    
    renderWithTheme(
      <SimpleButton onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        Hover me
      </SimpleButton>
    );

    const button = screen.getByRole('button');
    
    fireEvent.mouseEnter(button);
    expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    
    fireEvent.mouseLeave(button);
    expect(handleMouseLeave).toHaveBeenCalledTimes(1);
  });
});