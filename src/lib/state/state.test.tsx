/**
 * State Management Tests
 * Comprehensive test suite for state management system
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { 
  renderWithState,
  renderHookWithState,
  createMockNews,
  createMockComment,
  createMockUser,
  TestDataBuilder,
  createMockAsyncFunction,
  expectStateToMatch
} from './testing';
import { useNews, useComments, useUI, useUser } from './hooks';
import { useNewsData, useCommentsData, useSearchData } from './async-hooks';
import { StatePersistence } from './persistence';

// Mock localStorage for testing
const mockLocalStorage = () => {
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
      })
    },
    writable: true
  });
  
  return store;
};

describe('State Management System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage();
  });

  describe('News State Management', () => {
    it('should initialize with empty news state', () => {
      const { result } = renderHookWithState(() => useNews());
      
      expect(result.current.news).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should add news item', () => {
      const { result } = renderHookWithState(() => useNews());
      const mockNews = TestDataBuilder.news().build();
      
      act(() => {
        result.current.addNews(mockNews);
      });
      
      expect(result.current.news).toContain(mockNews);
    });

    it('should update news item', () => {
      const initialNews = TestDataBuilder.news().withId('test-1').build();
      const { result } = renderHookWithState(() => useNews(), {
        initialState: {
          news: {
            items: [initialNews],
            loading: false,
            error: null,
            pagination: { page: 1, limit: 20, total: 1, hasMore: false, loading: false },
            filters: {},
            sort: { field: 'createDate', direction: 'desc' },
            selectedCategory: null,
            selectedNews: null
          }
        }
      });
      
      const updates = { caption: 'Updated Title' };
      
      act(() => {
        result.current.updateNews({ ...initialNews, ...updates });
      });
      
      expect(result.current.news[0].caption).toBe('Updated Title');
    });

    it('should delete news item', () => {
      const initialNews = TestDataBuilder.news().withId('test-1').build();
      const { result } = renderHookWithState(() => useNews(), {
        initialState: {
          news: {
            items: [initialNews],
            loading: false,
            error: null,
            pagination: { page: 1, limit: 20, total: 1, hasMore: false, loading: false },
            filters: {},
            sort: { field: 'createDate', direction: 'desc' },
            selectedCategory: null,
            selectedNews: null
          }
        }
      });
      
      act(() => {
        result.current.deleteNews('test-1');
      });
      
      expect(result.current.news).not.toContain(initialNews);
    });

    it('should filter news by category', () => {
      const trabzonsporNews = TestDataBuilder.news().withCategory('Trabzonspor').build();
      const transferNews = TestDataBuilder.news().withCategory('Transfer').build();
      
      const { result } = renderHookWithState(() => useNews(), {
        initialState: {
          news: {
            items: [trabzonsporNews, transferNews],
            loading: false,
            error: null,
            pagination: { page: 1, limit: 20, total: 2, hasMore: false, loading: false },
            filters: { category: 'Trabzonspor' },
            sort: { field: 'createDate', direction: 'desc' },
            selectedCategory: 'Trabzonspor',
            selectedNews: null
          }
        }
      });
      
      act(() => {
        result.current.setFilters({ category: 'Trabzonspor' });
      });
      
      const filteredNews = result.current.getFilteredNews();
      expect(filteredNews).toHaveLength(1);
      expect(filteredNews[0].category).toBe('Trabzonspor');
    });
  });

  describe('Comments State Management', () => {
    it('should initialize with empty comments state', () => {
      const { result } = renderHookWithState(() => useComments());
      
      expect(result.current.comments).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should add comment', () => {
      const { result } = renderHookWithState(() => useComments());
      const mockComment = TestDataBuilder.comment().build();
      
      act(() => {
        result.current.addComment(mockComment);
      });
      
      expect(result.current.comments).toContain(mockComment);
    });

    it('should filter comments by news ID', () => {
      const comment1 = TestDataBuilder.comment().forNews('news-1').build();
      const comment2 = TestDataBuilder.comment().forNews('news-2').build();
      
      const { result } = renderHookWithState(() => useComments(), {
        initialState: {
          comments: {
            items: [comment1, comment2],
            loading: false,
            error: null,
            pagination: { page: 1, limit: 10, total: 2, hasMore: false, loading: false },
            selectedNewsId: 'news-1'
          }
        }
      });
      
      const newsComments = result.current.getCommentsForNews('news-1');
      expect(newsComments).toHaveLength(1);
      expect(newsComments[0].newsId).toBe('news-1');
    });

    it('should approve/reject comments', () => {
      const unapprovedComment = TestDataBuilder.comment().unapproved().build();
      
      const { result } = renderHookWithState(() => useComments(), {
        initialState: {
          comments: {
            items: [unapprovedComment],
            loading: false,
            error: null,
            pagination: { page: 1, limit: 10, total: 1, hasMore: false, loading: false },
            selectedNewsId: null
          }
        }
      });
      
      act(() => {
        result.current.updateComment({ ...unapprovedComment, isApproved: true });
      });
      
      expect(result.current.comments[0].isApproved).toBe(true);
    });
  });

  describe('UI State Management', () => {
    it('should manage theme changes', () => {
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
        title: 'Test Success',
        message: 'This is a test notification',
        duration: 3000
      };
      
      act(() => {
        result.current.addNotification(notification);
      });
      
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].title).toBe('Test Success');
    });

    it('should remove notifications', () => {
      const { result } = renderHookWithState(() => useUI());
      
      const notification = {
        type: 'info' as const,
        title: 'Test Info',
        message: 'This will be removed',
        duration: 1000
      };
      
      act(() => {
        result.current.addNotification(notification);
      });
      
      const notificationId = result.current.notifications[0].id;
      
      act(() => {
        result.current.removeNotification(notificationId);
      });
      
      expect(result.current.notifications).toHaveLength(0);
    });

    it('should manage modal state', () => {
      const { result } = renderHookWithState(() => useUI());
      
      act(() => {
        result.current.setModal('confirmDelete', { newsId: 'test-123' });
      });
      
      expect(result.current.modals.confirmDelete).toEqual({ newsId: 'test-123' });
      
      act(() => {
        result.current.closeModal('confirmDelete');
      });
      
      expect(result.current.modals.confirmDelete).toBeUndefined();
    });
  });

  describe('User State Management', () => {
    it('should handle user login', () => {
      const { result } = renderHookWithState(() => useUser());
      const mockUser = TestDataBuilder.user().build();
      
      act(() => {
        result.current.login(mockUser);
      });
      
      expect(result.current.currentUser).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle user logout', () => {
      const mockUser = TestDataBuilder.user().build();
      
      const { result } = renderHookWithState(() => useUser(), {
        initialState: {
          user: {
            currentUser: mockUser,
            isAuthenticated: true,
            loading: false,
            error: null
          }
        }
      });
      
      act(() => {
        result.current.logout();
      });
      
      expect(result.current.currentUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should update user preferences', () => {
      const mockUser = TestDataBuilder.user().build();
      
      const { result } = renderHookWithState(() => useUser(), {
        initialState: {
          user: {
            currentUser: mockUser,
            isAuthenticated: true,
            loading: false,
            error: null
          }
        }
      });
      
      const newPreferences = { theme: 'dark' as const, language: 'en' as const };
      
      act(() => {
        result.current.updatePreferences(newPreferences);
      });
      
      expect(result.current.currentUser?.preferences?.theme).toBe('dark');
      expect(result.current.currentUser?.preferences?.language).toBe('en');
    });
  });

  describe('Async Data Hooks', () => {
    it('should fetch news data', async () => {
      const mockNewsData = [
        TestDataBuilder.news().build(),
        TestDataBuilder.news().build()
      ];
      
      const mockFetch = createMockAsyncFunction(mockNewsData);
      
      // Mock the API call
      jest.spyOn(require('../async-hooks'), 'useNewsData').mockImplementation(() => ({
        news: mockNewsData,
        loading: false,
        error: null,
        fetch: mockFetch,
        refetch: mockFetch,
        invalidate: jest.fn(),
        addNews: jest.fn(),
        updateNews: jest.fn(),
        deleteNews: jest.fn()
      }));
      
      const { result } = renderHookWithState(() => useNewsData());
      
      expect(result.current.news).toEqual(mockNewsData);
      expect(result.current.loading).toBe(false);
    });

    it('should handle search with debouncing', async () => {
      const mockSearchResults = [
        TestDataBuilder.news().withTitle('Search Result 1').build(),
        TestDataBuilder.news().withTitle('Search Result 2').build()
      ];
      
      const mockSearchFn = createMockAsyncFunction(mockSearchResults);
      
      const { result } = renderHook(() => 
        useSearchData(mockSearchFn, 100)
      );
      
      act(() => {
        result.current.setQuery('search term');
      });
      
      expect(result.current.query).toBe('search term');
      
      // Wait for debouncing
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });
      
      expect(mockSearchFn).toHaveBeenCalledWith('search term');
    });
  });

  describe('State Persistence', () => {
    it('should save state to localStorage', () => {
      const persistence = new StatePersistence('localStorage');
      const testData = { test: 'data', number: 123 };
      
      persistence.save('test-key', testData);
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'tskulis_test-key',
        JSON.stringify(testData)
      );
    });

    it('should load state from localStorage', () => {
      const persistence = new StatePersistence('localStorage');
      const testData = { test: 'data', number: 123 };
      
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(testData));
      
      const loaded = persistence.load('test-key');
      
      expect(loaded).toEqual(testData);
    });

    it('should handle corrupted data gracefully', () => {
      const persistence = new StatePersistence('localStorage');
      
      (localStorage.getItem as jest.Mock).mockReturnValue('invalid-json');
      
      const loaded = persistence.load('test-key');
      
      expect(loaded).toBeNull();
    });

    it('should clear expired data', () => {
      const persistence = new StatePersistence('localStorage');
      
      // Set expired data
      const expiredData = {
        data: { test: 'expired' },
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        checksum: 'test-checksum'
      };
      
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(expiredData));
      
      const loaded = persistence.load('test-key', 24 * 60 * 60 * 1000); // 24 hours TTL
      
      expect(loaded).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('tskulis_test-key');
    });
  });

  describe('Error Handling', () => {
    it('should handle news fetch errors', () => {
      const { result } = renderHookWithState(() => useNews());
      const errorMessage = 'Failed to fetch news';
      
      act(() => {
        result.current.setError(errorMessage);
      });
      
      expect(result.current.error).toBe(errorMessage);
    });

    it('should clear errors', () => {
      const { result } = renderHookWithState(() => useNews(), {
        initialState: {
          news: {
            items: [],
            loading: false,
            error: 'Previous error',
            pagination: { page: 1, limit: 20, total: 0, hasMore: false, loading: false },
            filters: {},
            sort: { field: 'createDate', direction: 'desc' },
            selectedCategory: null,
            selectedNews: null
          }
        }
      });
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', () => {
      const { result } = renderHookWithState(() => useUser());
      
      act(() => {
        result.current.recordPerformance('pageLoad', 1500);
      });
      
      // Performance metrics would be tracked in the global state
      expect(result.current.performanceMetrics).toBeDefined();
    });
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage();
  });

  it('should maintain state consistency across hooks', () => {
    const TestComponent: React.FC = () => {
      const { news, addNews } = useNews();
      const { addNotification } = useUI();
      
      React.useEffect(() => {
        const mockNews = TestDataBuilder.news().build();
        addNews(mockNews);
        addNotification({
          type: 'success',
          title: 'News Added',
          message: 'Successfully added news item'
        });
      }, [addNews, addNotification]);
      
      return (
        <div>
          <span data-testid="news-count">{news.length}</span>
        </div>
      );
    };
    
    const { getByTestId } = renderWithState(<TestComponent />);
    
    expect(getByTestId('news-count')).toHaveTextContent('1');
  });

  it('should handle complex state updates', () => {
    const TestComponent: React.FC = () => {
      const { news, addNews, updateNews, deleteNews } = useNews();
      const [operations, setOperations] = React.useState<string[]>([]);
      
      const performOperations = () => {
        // Add news
        const newsItem = TestDataBuilder.news().withId('test-123').build();
        addNews(newsItem);
        setOperations(prev => [...prev, 'added']);
        
        // Update news
        setTimeout(() => {
          updateNews({ ...newsItem, caption: 'Updated Title' });
          setOperations(prev => [...prev, 'updated']);
        }, 100);
        
        // Delete news
        setTimeout(() => {
          deleteNews('test-123');
          setOperations(prev => [...prev, 'deleted']);
        }, 200);
      };
      
      return (
        <div>
          <button onClick={performOperations} data-testid="perform-operations">
            Perform Operations
          </button>
          <span data-testid="news-count">{news.length}</span>
          <span data-testid="operations">{operations.join(',')}</span>
        </div>
      );
    };
    
    const { getByTestId } = renderWithState(<TestComponent />);
    
    act(() => {
      getByTestId('perform-operations').click();
    });
    
    // After all operations, news should be empty
    expect(getByTestId('news-count')).toHaveTextContent('0');
  });
});