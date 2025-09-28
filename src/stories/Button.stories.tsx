/**
 * Button Component Stories
 * Storybook stories for design system components
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SimpleButton } from '../../components/ui/SimpleButton';
import { ThemeProvider } from '../../styles/ThemeProvider';

const meta: Meta<typeof SimpleButton> = {
  title: 'UI/SimpleButton',
  component: SimpleButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and states.',
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost'],
      description: 'The visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'The size of the button',
    },
    fullWidth: {
      control: { type: 'boolean' },
      description: 'Whether the button should take full width of its container',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Whether the button is in loading state',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
    children: {
      control: { type: 'text' },
      description: 'The content of the button',
    },
  },
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
    fullWidth: false,
    loading: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

// Sizes
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

// States
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading Button',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Full Width Button',
  },
  parameters: {
    layout: 'padded',
  },
};

// With icons
export const WithIcons: Story = {
  args: {
    leftIcon: <span>👈</span>,
    rightIcon: <span>👉</span>,
    children: 'With Icons',
  },
};

export const WithLeftIcon: Story = {
  args: {
    leftIcon: <span>🚀</span>,
    children: 'Launch',
  },
};

export const WithRightIcon: Story = {
  args: {
    rightIcon: <span>→</span>,
    children: 'Continue',
  },
};

// Interactive examples
export const Interactive: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <SimpleButton {...args} variant="primary">
        Primary
      </SimpleButton>
      <SimpleButton {...args} variant="secondary">
        Secondary
      </SimpleButton>
      <SimpleButton {...args} variant="outline">
        Outline
      </SimpleButton>
      <SimpleButton {...args} variant="ghost">
        Ghost
      </SimpleButton>
    </div>
  ),
  parameters: {
    controls: { exclude: ['variant', 'children'] },
  },
};

export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <SimpleButton {...args} size="sm">
        Small
      </SimpleButton>
      <SimpleButton {...args} size="md">
        Medium
      </SimpleButton>
      <SimpleButton {...args} size="lg">
        Large
      </SimpleButton>
    </div>
  ),
  parameters: {
    controls: { exclude: ['size', 'children'] },
  },
};

export const AllStates: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <SimpleButton {...args}>Normal</SimpleButton>
      <SimpleButton {...args} loading>
        Loading
      </SimpleButton>
      <SimpleButton {...args} disabled>
        Disabled
      </SimpleButton>
    </div>
  ),
  parameters: {
    controls: { exclude: ['loading', 'disabled', 'children'] },
  },
};