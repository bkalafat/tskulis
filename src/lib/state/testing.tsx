/**
 * State Management Testing Utilities
 * Helpers for testing state management components and hooks
 */

import React from 'react';
import { render, renderHook } from '@testing-library/react';
import { AppStateProvider } from './store';
import type { AppState } from './store';
import type { NewsType, CommentType, UserType } from './index';

// Mock data generators
export const createMockNews = (overrides: Partial<NewsType> = {}): NewsType => ({
  _id: `news-${Date.now()}`,
  caption: 'Test News Caption',
  content: 'Test news content goes here...',
  category: 'Trabzonspor',
  type: 'news',
  slug: 'test-news-caption',
  imgPath: '/images/test-news.jpg',
  createDate: new Date().toISOString(),
  updateDate: new Date().toISOString(),
  expressDate: new Date().toISOString(),
  isActive: true,
  tags: ['test', 'mock'],
  viewCount: 0,
  ...overrides
});

export const createMockComment = (overrides: Partial<CommentType> = {}): CommentType => ({
  _id: `comment-${Date.now()}`,
  newsId: 'test-news-id',
  author: 'Test User',
  email: 'test@example.com',
  content: 'Test comment content',
  createDate: new Date().toISOString(),
  isApproved: true,
  parentId: undefined,
  likes: 0,
  dislikes: 0,
  ...overrides
});

export const createMockUser = (overrides: Partial<UserType> = {}): UserType => ({
  _id: `user-${Date.now()}`,
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  avatar: '/images/default-avatar.jpg',
  preferences: {
    theme: 'light',
    language: 'tr',
    notifications: true,
    autoSave: true
  },
  lastLogin: new Date().toISOString(),
  isActive: true,
  ...overrides
});

// Initial state factory
export const createMockInitialState = (overrides: Partial<AppState> = {}): AppState => ({
  news: {
    items: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      hasMore: false,
      loading: false
    },
    filters: {},
    sort: { field: 'createDate', direction: 'desc' },
    selectedCategory: null,
    selectedNews: null
  },
  comments: {
    items: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      hasMore: false,
      loading: false
    },
    selectedNewsId: null
  },
  ui: {
    theme: 'light',
    loading: false,
    notifications: [],
    modals: {},
    sidebar: {
      isOpen: false,
      activeSection: null
    }
  },
  user: {
    currentUser: null,
    isAuthenticated: false,
    loading: false,
    error: null
  },
  performance: {
    metrics: {
      pageLoadTime: 0,
      apiResponseTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      errorCount: 0,
      userInteractions: 0
    },
    timings: {},
    isMonitoring: false
  },
  ...overrides
});

// Test wrapper component
interface TestWrapperProps {
  children: React.ReactNode;
  initialState?: Partial<AppState>;
}

export const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  initialState = {} 
}) => {
  const mockState = createMockInitialState(initialState);
  
  return (
    <AppStateProvider initialState={mockState}>
      {children}
    </AppStateProvider>
  );
};

// Custom render function with state provider
export const renderWithState = (
  ui: React.ReactElement,
  options: {
    initialState?: Partial<AppState>;
    renderOptions?: Parameters<typeof render>[1];
  } = {}
) => {
  const { initialState, renderOptions } = options;
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestWrapper initialState={initialState}>
      {children}
    </TestWrapper>
  );
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Custom renderHook function with state provider
export const renderHookWithState = <TResult, TProps>(
  hook: (props: TProps) => TResult,
  options: {
    initialState?: Partial<AppState>;
    hookOptions?: Parameters<typeof renderHook<TResult, TProps>>[1];
  } = {}
) => {
  const { initialState, hookOptions } = options;
  
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestWrapper initialState={initialState}>
      {children}
    </TestWrapper>
  );
  
  return renderHook(hook, { wrapper, ...hookOptions });
};

// Mock async functions
export const createMockAsyncFunction = function<T>(
  data: T,
  delay = 100,
  shouldFail = false
) {
  return jest.fn().mockImplementation(
    () => new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new Error('Mock async function error'));
        } else {
          resolve(data);
        }
      }, delay);
    })
  );
};

// State assertion helpers
export const expectStateToMatch = (
  actualState: Partial<AppState>,
  expectedState: Partial<AppState>
) => {
  Object.keys(expectedState).forEach(key => {
    const actualValue = actualState[key as keyof AppState];
    const expectedValue = expectedState[key as keyof AppState];
    if (expectedValue !== undefined && actualValue !== undefined) {
      expect(actualValue).toMatchObject(expectedValue);
    }
  });
};

// Action testing helpers
export const createMockAction = (type: string, payload?: any) => ({
  type,
  payload
});

// Performance testing helpers
export const mockPerformanceAPI = () => {
  const mockNow = jest.fn(() => Date.now());
  const mockMark = jest.fn();
  const mockMeasure = jest.fn(() => ({
    name: 'test-measure',
    startTime: 0,
    duration: 100
  }));
  
  Object.defineProperty(window, 'performance', {
    value: {
      now: mockNow,
      mark: mockMark,
      measure: mockMeasure,
      getEntriesByName: jest.fn(() => []),
      clearMarks: jest.fn(),
      clearMeasures: jest.fn()
    },
    writable: true
  });
  
  return {
    mockNow,
    mockMark,
    mockMeasure
  };
};

// Local storage mock
export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};
  
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
      length: 0,
      key: jest.fn()
    },
    writable: true
  });
  
  return store;
};

// Session storage mock
export const mockSessionStorage = () => {
  const store: { [key: string]: string } = {};
  
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
      length: 0,
      key: jest.fn()
    },
    writable: true
  });
  
  return store;
};

// IndexedDB mock (simplified)
export const mockIndexedDB = () => {
  const databases: { [name: string]: { [store: string]: { [key: string]: any } } } = {};
  
  const mockTransaction = {
    objectStore: jest.fn((storeName: string) => ({
      get: jest.fn((key: string) => Promise.resolve(databases['test']?.[storeName]?.[key])),
      put: jest.fn((value: any, key: string) => {
        if (!databases['test']) databases['test'] = {};
        if (!databases['test'][storeName]) databases['test'][storeName] = {};
        databases['test'][storeName][key] = value;
        return Promise.resolve();
      }),
      delete: jest.fn((key: string) => {
        if (databases['test']?.[storeName]) {
          delete databases['test'][storeName][key];
        }
        return Promise.resolve();
      })
    })),
    oncomplete: null,
    onerror: null
  };
  
  const mockDatabase = {
    transaction: jest.fn(() => mockTransaction),
    close: jest.fn()
  };
  
  const mockRequest = {
    result: mockDatabase,
    onsuccess: null,
    onerror: null
  };
  
  Object.defineProperty(window, 'indexedDB', {
    value: {
      open: jest.fn(() => mockRequest),
      deleteDatabase: jest.fn()
    },
    writable: true
  });
  
  return {
    databases,
    mockTransaction,
    mockDatabase,
    mockRequest
  };
};

// Test data builders
export class TestDataBuilder {
  static news() {
    return {
      withId: (id: string) => createMockNews({ _id: id }),
      withCategory: (category: string) => createMockNews({ category }),
      withTitle: (caption: string) => createMockNews({ caption }),
      inactive: () => createMockNews({ isActive: false }),
      withTags: (tags: string[]) => createMockNews({ tags }),
      build: (overrides?: Partial<NewsType>) => createMockNews(overrides)
    };
  }
  
  static comment() {
    return {
      withId: (id: string) => createMockComment({ _id: id }),
      forNews: (newsId: string) => createMockComment({ newsId }),
      withAuthor: (author: string) => createMockComment({ author }),
      unapproved: () => createMockComment({ isApproved: false }),
      withParent: (parentId: string) => createMockComment({ parentId }),
      build: (overrides?: Partial<CommentType>) => createMockComment(overrides)
    };
  }
  
  static user() {
    return {
      withId: (id: string) => createMockUser({ _id: id }),
      withRole: (role: 'admin' | 'editor' | 'user') => createMockUser({ role }),
      withEmail: (email: string) => createMockUser({ email }),
      inactive: () => createMockUser({ isActive: false }),
      build: (overrides?: Partial<UserType>) => createMockUser(overrides)
    };
  }
}

// Async testing utilities
export const waitForStateUpdate = (callback: () => boolean, timeout = 1000) => {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();
    
    const checkCondition = () => {
      if (callback()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('State update timeout'));
      } else {
        setTimeout(checkCondition, 10);
      }
    };
    
    checkCondition();
  });
};

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

export const measureAsyncOperation = async function<T>(operation: () => Promise<T>) {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();
  return {
    result,
    duration: end - start
  };
};

// Cleanup utilities
export const cleanup = () => {
  // Clear all timers
  jest.clearAllTimers();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset modules
  jest.resetModules();
};

export default {
  createMockNews,
  createMockComment,
  createMockUser,
  createMockInitialState,
  TestWrapper,
  renderWithState,
  renderHookWithState,
  createMockAsyncFunction,
  expectStateToMatch,
  mockPerformanceAPI,
  mockLocalStorage,
  mockSessionStorage,
  mockIndexedDB,
  TestDataBuilder,
  waitForStateUpdate,
  measureRenderTime,
  measureAsyncOperation,
  cleanup
};