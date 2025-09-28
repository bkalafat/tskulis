/**
 * State Management Hooks
 * Custom hooks for state management with persistence and optimization
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppState, AppAction, NewsType, CommentType, Notification, UserPreferences } from './store';

/**
 * News state management hooks
 */
export function useNews() {
  const { state, dispatch } = useAppState();
  const { news } = state;

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: loading ? 'NEWS_FETCH_START' : 'NEWS_FETCH_SUCCESS', payload: news.items });
  }, [dispatch, news.items]);

  const setNews = useCallback((newsItems: NewsType[]) => {
    dispatch({ type: 'NEWS_FETCH_SUCCESS', payload: newsItems });
  }, [dispatch]);

  const setError = useCallback((error: string) => {
    dispatch({ type: 'NEWS_FETCH_ERROR', payload: error });
  }, [dispatch]);

  const addNews = useCallback((newsItem: NewsType) => {
    dispatch({ type: 'NEWS_ADD', payload: newsItem });
  }, [dispatch]);

  const updateNews = useCallback((newsItem: NewsType) => {
    dispatch({ type: 'NEWS_UPDATE', payload: newsItem });
  }, [dispatch]);

  const deleteNews = useCallback((newsId: string) => {
    dispatch({ type: 'NEWS_DELETE', payload: newsId });
  }, [dispatch]);

  const setCurrentNews = useCallback((newsItem: NewsType | null) => {
    dispatch({ type: 'NEWS_SET_CURRENT', payload: newsItem });
  }, [dispatch]);

  const setCategoryNews = useCallback((category: string, newsItems: NewsType[]) => {
    dispatch({ type: 'NEWS_SET_CATEGORY', payload: { category, news: newsItems } });
  }, [dispatch]);

  // Memoized selectors
  const newsByCategory = useMemo(() => {
    return Object.keys(news.categories).reduce((acc, category) => {
      acc[category] = news.categories[category];
      return acc;
    }, {} as Record<string, NewsType[]>);
  }, [news.categories]);

  const isStale = useMemo(() => {
    if (!news.lastFetch) return true;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - news.lastFetch > fiveMinutes;
  }, [news.lastFetch]);

  return {
    // State
    news: news.items,
    currentNews: news.currentNews,
    isLoading: news.isLoading,
    error: news.error,
    lastFetch: news.lastFetch,
    categories: newsByCategory,
    isStale,
    
    // Actions
    setLoading,
    setNews,
    setError,
    addNews,
    updateNews,
    deleteNews,
    setCurrentNews,
    setCategoryNews
  };
}

/**
 * Comments state management hooks
 */
export function useComments() {
  const { state, dispatch } = useAppState();
  const { comments } = state;

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: loading ? 'COMMENTS_FETCH_START' : 'COMMENTS_FETCH_SUCCESS', payload: comments.items });
  }, [dispatch, comments.items]);

  const setComments = useCallback((commentItems: CommentType[]) => {
    dispatch({ type: 'COMMENTS_FETCH_SUCCESS', payload: commentItems });
  }, [dispatch]);

  const setError = useCallback((error: string) => {
    dispatch({ type: 'COMMENTS_FETCH_ERROR', payload: error });
  }, [dispatch]);

  const addComment = useCallback((comment: CommentType) => {
    dispatch({ type: 'COMMENTS_ADD', payload: comment });
  }, [dispatch]);

  const clearComments = useCallback(() => {
    dispatch({ type: 'COMMENTS_CLEAR' });
  }, [dispatch]);

  const commentsByNews = useMemo(() => {
    return (newsId: string) => comments.items.filter(comment => comment.newsId === newsId);
  }, [comments.items]);

  return {
    // State
    comments: comments.items,
    isLoading: comments.isLoading,
    error: comments.error,
    lastFetch: comments.lastFetch,
    
    // Actions
    setLoading,
    setComments,
    setError,
    addComment,
    clearComments,
    
    // Selectors
    commentsByNews
  };
}

/**
 * UI state management hooks
 */
export function useUI() {
  const { state, dispatch } = useAppState();
  const { ui } = state;

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    dispatch({ type: 'UI_SET_THEME', payload: theme });
  }, [dispatch]);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'UI_TOGGLE_SIDEBAR' });
  }, [dispatch]);

  const openModal = useCallback((content: React.ComponentType<any>) => {
    dispatch({ type: 'UI_OPEN_MODAL', payload: content });
  }, [dispatch]);

  const closeModal = useCallback(() => {
    dispatch({ type: 'UI_CLOSE_MODAL' });
  }, [dispatch]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const fullNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    };
    dispatch({ type: 'UI_ADD_NOTIFICATION', payload: fullNotification });

    // Auto-remove notification if duration is set
    if (notification.duration && !notification.persistent) {
      setTimeout(() => {
        dispatch({ type: 'UI_REMOVE_NOTIFICATION', payload: fullNotification.id });
      }, notification.duration);
    }
  }, [dispatch]);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'UI_REMOVE_NOTIFICATION', payload: id });
  }, [dispatch]);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'UI_SET_LOADING', payload: loading });
  }, [dispatch]);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'UI_SET_SEARCH_QUERY', payload: query });
  }, [dispatch]);

  const setSearchResults = useCallback((results: NewsType[]) => {
    dispatch({ type: 'UI_SET_SEARCH_RESULTS', payload: results });
  }, [dispatch]);

  const toggleSearch = useCallback(() => {
    dispatch({ type: 'UI_TOGGLE_SEARCH' });
  }, [dispatch]);

  return {
    // State
    theme: ui.theme,
    sidebarOpen: ui.sidebarOpen,
    modalOpen: ui.modalOpen,
    modalContent: ui.modalContent,
    notifications: ui.notifications,
    loading: ui.loading,
    searchQuery: ui.searchQuery,
    searchResults: ui.searchResults,
    searchOpen: ui.searchOpen,
    
    // Actions
    setTheme,
    toggleSidebar,
    openModal,
    closeModal,
    addNotification,
    removeNotification,
    setLoading,
    setSearchQuery,
    setSearchResults,
    toggleSearch
  };
}

/**
 * User state management hooks
 */
export function useUser() {
  const { state, dispatch } = useAppState();
  const { user } = state;

  const setPreferences = useCallback((preferences: Partial<UserPreferences>) => {
    dispatch({ type: 'USER_SET_PREFERENCES', payload: preferences });
  }, [dispatch]);

  const setSession = useCallback((session: any) => {
    dispatch({ type: 'USER_SET_SESSION', payload: session });
  }, [dispatch]);

  const setPermissions = useCallback((permissions: string[]) => {
    dispatch({ type: 'USER_SET_PERMISSIONS', payload: permissions });
  }, [dispatch]);

  const logout = useCallback(() => {
    dispatch({ type: 'USER_LOGOUT' });
  }, [dispatch]);

  const hasPermission = useCallback((permission: string) => {
    return user.permissions.includes(permission) || user.permissions.includes('*');
  }, [user.permissions]);

  const isAdmin = useMemo(() => {
    return hasPermission('admin') || hasPermission('super_admin');
  }, [hasPermission]);

  const canEdit = useMemo(() => {
    return hasPermission('edit') || hasPermission('admin');
  }, [hasPermission]);

  const canDelete = useMemo(() => {
    return hasPermission('delete') || hasPermission('admin');
  }, [hasPermission]);

  const canPublish = useMemo(() => {
    return hasPermission('publish') || hasPermission('admin');
  }, [hasPermission]);

  return {
    // State
    preferences: user.preferences,
    session: user.session,
    isAuthenticated: user.isAuthenticated,
    permissions: user.permissions,
    
    // Actions
    setPreferences,
    setSession,
    setPermissions,
    logout,
    
    // Computed
    hasPermission,
    isAdmin,
    canEdit,
    canDelete,
    canPublish
  };
}

/**
 * Performance monitoring hooks
 */
export function usePerformance() {
  const { state, dispatch } = useAppState();
  const { performance } = state;

  const updateMetrics = useCallback((metrics: Partial<typeof performance.metrics>) => {
    dispatch({ type: 'PERFORMANCE_UPDATE_METRICS', payload: metrics });
  }, [dispatch]);

  const updateCacheStats = useCallback((stats: typeof performance.cacheStats) => {
    dispatch({ type: 'PERFORMANCE_UPDATE_CACHE_STATS', payload: stats });
  }, [dispatch]);

  const setNetworkStatus = useCallback((status: 'online' | 'offline') => {
    dispatch({ type: 'PERFORMANCE_SET_NETWORK_STATUS', payload: status });
  }, [dispatch]);

  const setConnectionType = useCallback((type: string | null) => {
    dispatch({ type: 'PERFORMANCE_SET_CONNECTION_TYPE', payload: type });
  }, [dispatch]);

  // Performance monitoring utilities
  const measurePerformance = useCallback(function<T>(name: string, fn: () => T | Promise<T>) {
    const start = window.performance.now();
    const result = fn();
    
    if (result instanceof Promise) {
      return result.then((res) => {
        const end = window.performance.now();
        updateMetrics({ [name]: end - start });
        return res;
      });
    } else {
      const end = window.performance.now();
      updateMetrics({ [name]: end - start });
      return result;
    }
  }, [updateMetrics]);

  return {
    // State
    metrics: performance.metrics,
    cacheStats: performance.cacheStats,
    networkStatus: performance.networkStatus,
    connectionType: performance.connectionType,
    
    // Actions
    updateMetrics,
    updateCacheStats,
    setNetworkStatus,
    setConnectionType,
    
    // Utils
    measurePerformance
  };
}

/**
 * Async state management hook with caching and error handling
 */
export function useAsyncState<T>(
  key: string,
  asyncFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    cacheTime?: number;
    retryCount?: number;
    retryDelay?: number;
    fallback?: T;
  } = {}
) {
  const { addNotification } = useUI();
  const cache = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const requestCache = useRef<Map<string, Promise<T>>>(new Map());
  
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes
    retryCount = 3,
    retryDelay = 1000,
    fallback
  } = options;

  const execute = useCallback(async (): Promise<T> => {
    // Check cache first
    const cached = cache.current.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }

    // Check if request is already in flight
    const existingRequest = requestCache.current.get(key);
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request with retry logic
    const request = (async () => {
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          const data = await asyncFunction();
          
          // Cache the result
          cache.current.set(key, { data, timestamp: Date.now() });
          
          // Clear request from cache
          requestCache.current.delete(key);
          
          return data;
        } catch (error) {
          lastError = error as Error;
          
          if (attempt < retryCount) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          }
        }
      }
      
      // Clear request from cache on failure
      requestCache.current.delete(key);
      
      // Show error notification
      addNotification({
        type: 'error',
        title: 'İstek Başarısız',
        message: lastError?.message || 'Bilinmeyen bir hata oluştu',
        duration: 5000
      });
      
      if (fallback !== undefined) {
        return fallback;
      }
      
      throw lastError;
    })();

    // Cache the request promise
    requestCache.current.set(key, request);
    
    return request;
  }, [key, asyncFunction, cacheTime, retryCount, retryDelay, fallback, addNotification, ...dependencies]);

  const invalidateCache = useCallback((cacheKey?: string) => {
    if (cacheKey) {
      cache.current.delete(cacheKey);
    } else {
      cache.current.clear();
    }
    requestCache.current.clear();
  }, []);

  const getCacheSize = useCallback(() => {
    return cache.current.size;
  }, []);

  const clearExpiredCache = useCallback(() => {
    const now = Date.now();
    for (const [key, value] of cache.current.entries()) {
      if (now - value.timestamp > cacheTime) {
        cache.current.delete(key);
      }
    }
  }, [cacheTime]);

  // Clear expired cache periodically
  useEffect(() => {
    const interval = setInterval(clearExpiredCache, 60000); // Every minute
    return () => clearInterval(interval);
  }, [clearExpiredCache]);

  return {
    execute,
    invalidateCache,
    getCacheSize,
    clearExpiredCache
  };
}

/**
 * Debounced state hook for search and input handling
 */
export function useDebouncedState<T>(initialValue: T, delay: number = 300) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setValue = useCallback((_value: T | ((prev: T) => T)) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      // This would need to be connected to a specific state slice
      // For now, we'll just return the utility functions
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { setValue, initialValue };
}

/**
 * Global state management utilities
 */
export function useStateUtils() {
  const { dispatch } = useAppState();

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, [dispatch]);

  const clearCache = useCallback(() => {
    dispatch({ type: 'CLEAR_CACHE' });
  }, [dispatch]);

  const hydrateState = useCallback((state: any) => {
    dispatch({ type: 'HYDRATE_STATE', payload: state });
  }, [dispatch]);

  return {
    resetState,
    clearCache,
    hydrateState
  };
}