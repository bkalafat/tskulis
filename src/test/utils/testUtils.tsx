/**
 * Test Utilities for TS Kulis
 * Comprehensive testing helpers and utilities
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { NewsType } from '../../types/NewsType';
import { CommentType } from '../../types/CommentType';
import { CATEGORY, TYPE } from '../../utils/enum';

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialProps?: any;
}

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
};

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data generators
export const createMockNews = (overrides?: Partial<NewsType>): NewsType => ({
  id: 'test-news-1',
  category: CATEGORY.TRABZONSPOR,
  type: TYPE.NEWS,
  caption: 'Test Haber Başlığı',
  summary: 'Test haber özeti',
  imgPath: '/test-image.jpg',
  imgAlt: 'Test image alt text',
  content: 'Bu bir test haber içeriğidir. Lorem ipsum dolor sit amet...',
  subjects: ['Trabzonspor', 'Test'],
  authors: ['Test Author'],
  createDate: '2025-09-28T10:00:00Z',
  updateDate: '2025-09-28T10:00:00Z',
  expressDate: '2025-09-28T10:00:00Z',
  priority: 1,
  isActive: true,
  isSecondPageNews: false,
  showNotification: true,
  slug: 'test-haber-basligi',
  url: '/trabzonspor/test-haber-basligi',
  keywords: 'trabzonspor, test, haber',
  socialTags: 'trabzonspor,test',
  viewCount: 100,
  ...overrides
});

export const createMockNewsArray = (count: number = 5): NewsType[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockNews({
      id: `test-news-${index + 1}`,
      caption: `Test Haber ${index + 1}`,
      slug: `test-haber-${index + 1}`,
      priority: index + 1,
      viewCount: (index + 1) * 10
    })
  );
};

export const createMockComment = (overrides?: Partial<CommentType>): CommentType => ({
  id: 'test-comment-1',
  newsId: 'test-news-1',
  userName: 'Test User',
  text: 'Bu bir test yorumudur.',
  createDate: '2025-09-28T10:00:00Z',
  updateDate: '2025-09-28T10:00:00Z',
  isActive: true,
  ...overrides
});

export const createMockCommentsArray = (count: number = 3, newsId: string = 'test-news-1'): CommentType[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockComment({
      id: `test-comment-${index + 1}`,
      newsId,
      userName: `Test User ${index + 1}`,
      text: `Bu test yorumu ${index + 1}`,
    })
  );
};

// API mock helpers
export const mockFetch = (response: any, status: number = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
  });
};

export const mockFetchError = (error: string = 'Network Error') => {
  global.fetch = jest.fn().mockRejectedValue(new Error(error));
};

// Local Storage mock
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      key: jest.fn((index: number) => Object.keys(store)[index] || null),
      get length() { return Object.keys(store).length; }
    },
    writable: true
  });
  
  return store;
};

// Session Storage mock
export const mockSessionStorage = () => {
  const store: Record<string, string> = {};
  
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      key: jest.fn((index: number) => Object.keys(store)[index] || null),
      get length() { return Object.keys(store).length; }
    },
    writable: true
  });
  
  return store;
};

// Router mock
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  reload: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  basePath: '',
  isLocaleDomain: true,
  isReady: true,
  isPreview: false,
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  }
};

// Date mock helpers
export const mockDate = (dateString: string) => {
  const mockDate = new Date(dateString);
  const originalDate = Date;
  
  global.Date = jest.fn(() => mockDate) as any;
  global.Date.UTC = originalDate.UTC;
  global.Date.parse = originalDate.parse;
  global.Date.now = jest.fn(() => mockDate.getTime());
  
  return () => {
    global.Date = originalDate;
  };
};

// Window mock helpers
export const mockWindow = (overrides: Partial<Window> = {}) => {
  const originalWindow = window;
  
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
      ...overrides.location
    },
    writable: true
  });
  
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
    ...overrides
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
    ...overrides
  });
  
  return () => {
    Object.defineProperty(window, 'location', {
      value: originalWindow.location,
      writable: true
    });
  };
};

// Image mock
export const mockImage = () => {
  Object.defineProperty(global.Image.prototype, 'onload', {
    get() {
      return this._onload;
    },
    set(fn) {
      this._onload = fn;
      // Simulate image load
      setTimeout(() => fn(), 0);
    }
  });
};

// Intersection Observer mock
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    root: null,
    rootMargin: '',
    thresholds: []
  }));
};

// Resize Observer mock
export const mockResizeObserver = () => {
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }));
};

// Test data categories
export const TEST_CATEGORIES = Object.values(CATEGORY);
export const TEST_TYPES = Object.values(TYPE);

// Test environment helpers
export const isTestEnvironment = () => process.env.NODE_ENV === 'test';

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Component test helpers
export const getByTextContent = (text: string) => {
  return (content: string, element: Element | null) => {
    const hasText = (element: Element | null) => element?.textContent === text;
    const elementHasText = hasText(element);
    const childrenDontHaveText = element ? Array.from(element.children).every(child => !hasText(child)) : true;
    return elementHasText && childrenDontHaveText;
  };
};

// Assert helpers
export const expectToBeInTheDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument();
};

export const expectToHaveClass = (element: HTMLElement, className: string) => {
  expect(element).toHaveClass(className);
};

export const expectToHaveAttribute = (element: HTMLElement, attribute: string, value?: string) => {
  if (value) {
    expect(element).toHaveAttribute(attribute, value);
  } else {
    expect(element).toHaveAttribute(attribute);
  }
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

export default {
  render: customRender,
  createMockNews,
  createMockNewsArray,
  createMockComment,
  createMockCommentsArray,
  mockFetch,
  mockFetchError,
  mockLocalStorage,
  mockSessionStorage,
  mockRouter,
  mockDate,
  mockWindow,
  mockImage,
  mockIntersectionObserver,
  mockResizeObserver,
  waitFor,
  flushPromises,
  getByTextContent,
  expectToBeInTheDocument,
  expectToHaveClass,
  expectToHaveAttribute
};