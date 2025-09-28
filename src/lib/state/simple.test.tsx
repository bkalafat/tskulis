/**
 * Basic State Management Tests
 * Simple test examples for state management system
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { renderWithState, renderHookWithState, TestDataBuilder } from './testing';
import { useNews, useUI } from './hooks';

// Mock localStorage
const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: jest.fn((key: string) => { delete store[key]; }),
      clear: jest.fn(() => { Object.keys(store).forEach(key => delete store[key]); })
    },
    writable: true
  });
  return store;
};

describe('State Management Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage();
  });

  describe('News Hook', () => {
    it('should initialize with empty news', () => {
      const { result } = renderHookWithState(() => useNews());
      expect(result.current.news).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should add news item', () => {
      const { result } = renderHookWithState(() => useNews());
      const newsItem = TestDataBuilder.news().build();
      
      act(() => {
        result.current.addNews(newsItem);
      });
      
      expect(result.current.news).toContain(newsItem);
    });
  });

  describe('UI Hook', () => {
    it('should change theme', () => {
      const { result } = renderHookWithState(() => useUI());
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(result.current.theme).toBe('dark');
    });

    it('should manage notifications', () => {
      const { result } = renderHookWithState(() => useUI());
      
      const notification = {
        type: 'success' as const,
        title: 'Test',
        message: 'Test message'
      };
      
      act(() => {
        result.current.addNotification(notification);
      });
      
      expect(result.current.notifications.length).toBeGreaterThan(0);
    });
  });

  describe('Integration', () => {
    it('should work with component', () => {
      const TestComponent: React.FC = () => {
        const { news, addNews } = useNews();
        
        React.useEffect(() => {
          const mockNews = TestDataBuilder.news().build();
          addNews(mockNews);
        }, [addNews]);
        
        return <div data-testid="news-count">{news.length}</div>;
      };
      
      const { getByTestId } = renderWithState(<TestComponent />);
      expect(getByTestId('news-count')).toHaveTextContent('1');
    });
  });
});