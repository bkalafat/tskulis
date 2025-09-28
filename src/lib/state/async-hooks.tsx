/**
 * Async State Management Hooks
 * Advanced hooks for handling async operations with caching and optimization
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNews, useComments, useUI } from './hooks';

export interface AsyncStateOptions {
  immediate?: boolean;
  cacheTime?: number;
  staleTime?: number;
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  transformData?: (data: any) => any;
  shouldFetch?: () => boolean;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastFetch: number | null;
  isStale: boolean;
  isFetching: boolean;
}

/**
 * Advanced async state hook with intelligent caching
 */
export function useAsyncData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: AsyncStateOptions = {}
) {
  const {
    immediate = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 60 * 1000, // 1 minute
    retryCount = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    transformData,
    shouldFetch
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
    isStale: true,
    isFetching: false
  });

  const abortControllerRef = useRef<AbortController>();
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Check if data is stale
  const isDataStale = useCallback(() => {
    if (!state.lastFetch) return true;
    return Date.now() - state.lastFetch > staleTime;
  }, [state.lastFetch, staleTime]);

  // Get cached data
  const getCachedData = useCallback(() => {
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }
    return null;
  }, [key, cacheTime]);

  // Execute fetch with retry logic
  const executeFetch = useCallback(async (attempt = 0): Promise<T> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const data = await fetchFn();
      const transformedData = transformData ? transformData(data) : data;

      // Cache the result
      cacheRef.current.set(key, { data: transformedData, timestamp: Date.now() });

      return transformedData;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }

      if (attempt < retryCount) {
        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, retryDelay * Math.pow(2, attempt));
        });
        return executeFetch(attempt + 1);
      }

      throw error;
    }
  }, [fetchFn, transformData, key, retryCount, retryDelay]);

  // Main fetch function
  const fetch = useCallback(async (force = false) => {
    if (!force && shouldFetch && !shouldFetch()) {
      return;
    }

    // Check cache first
    if (!force && !isDataStale()) {
      const cached = getCachedData();
      if (cached) {
        setState(prev => ({ ...prev, data: cached, loading: false, error: null }));
        return cached;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null, isFetching: true }));

    try {
      const data = await executeFetch();
      
      setState(prev => ({
        ...prev,
        data,
        loading: false,
        error: null,
        lastFetch: Date.now(),
        isStale: false,
        isFetching: false
      }));

      if (onSuccess) onSuccess(data);
      return data;
    } catch (error) {
      const err = error as Error;
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: err,
        isFetching: false
      }));

      if (onError) onError(err);
      throw err;
    }
  }, [executeFetch, isDataStale, getCachedData, shouldFetch, onSuccess, onError]);

  // Invalidate cache and refetch
  const invalidate = useCallback(async () => {
    cacheRef.current.delete(key);
    setState(prev => ({ ...prev, isStale: true }));
    return fetch(true);
  }, [key, fetch]);

  // Mutate data optimistically
  const mutate = useCallback((newData: T | ((prev: T | null) => T), shouldRevalidate = true) => {
    const data = typeof newData === 'function' 
      ? (newData as (prev: T | null) => T)(state.data)
      : newData;

    setState(prev => ({ ...prev, data }));
    cacheRef.current.set(key, { data, timestamp: Date.now() });

    if (shouldRevalidate) {
      fetch();
    }
  }, [state.data, key, fetch]);

  // Initial fetch
  useEffect(() => {
    if (immediate) {
      fetch();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [immediate, fetch]);

  // Update stale status
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({ ...prev, isStale: isDataStale() }));
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isDataStale]);

  return {
    ...state,
    fetch,
    refetch: () => fetch(true),
    invalidate,
    mutate
  };
}

/**
 * Hook for managing news data with optimistic updates
 */
export function useNewsData(category?: string) {
  const { news, setNews, setError, addNews, updateNews, deleteNews } = useNews();
  const { addNotification } = useUI();

  const fetchKey = category ? `news-category-${category}` : 'news-all';
  
  const fetchNews = useCallback(async () => {
    // This would integrate with your API
    // For now, return existing news data
    return category ? news.filter(n => n.category === category) : news;
  }, [news, category]);

  const {
    data,
    loading,
    error,
    fetch,
    refetch,
    invalidate,
    mutate
  } = useAsyncData(fetchKey, fetchNews, {
    onError: (error) => {
      setError(error.message);
      addNotification({
        type: 'error',
        title: 'Haber Yükleme Hatası',
        message: error.message,
        duration: 5000
      });
    },
    onSuccess: (data) => {
      setNews(data);
    }
  });

  // Optimistic add
  const addNewsOptimistic = useCallback(async (newsItem: any) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticNews = { ...newsItem, _id: tempId };
    
    // Optimistic update
    mutate(prev => prev ? [optimisticNews, ...prev] : [optimisticNews], false);
    
    try {
      // Actual API call would go here
      const realNews = { ...newsItem, _id: `real-${Date.now()}` };
      addNews(realNews);
      
      // Replace optimistic with real data
      mutate(prev => prev ? prev.map(n => n._id === tempId ? realNews : n) : [realNews]);
      
      addNotification({
        type: 'success',
        title: 'Haber Eklendi',
        message: 'Haber başarıyla eklendi',
        duration: 3000
      });
    } catch (error) {
      // Revert optimistic update
      mutate(prev => prev ? prev.filter(n => n._id !== tempId) : []);
      throw error;
    }
  }, [mutate, addNews, addNotification]);

  // Optimistic update
  const updateNewsOptimistic = useCallback(async (newsId: string, updates: any) => {
    // Optimistic update
    mutate(prev => prev ? prev.map(n => n._id === newsId ? { ...n, ...updates } : n) : [], false);
    
    try {
      // Actual API call would go here
      const updatedNews = { ...updates, _id: newsId };
      updateNews(updatedNews);
      
      addNotification({
        type: 'success',
        title: 'Haber Güncellendi',
        message: 'Haber başarıyla güncellendi',
        duration: 3000
      });
    } catch (error) {
      // Revert optimistic update
      invalidate();
      throw error;
    }
  }, [mutate, updateNews, addNotification, invalidate]);

  // Optimistic delete
  const deleteNewsOptimistic = useCallback(async (newsId: string) => {
    const originalData = data;
    
    // Optimistic update
    mutate(prev => prev ? prev.filter(n => n._id !== newsId) : [], false);
    
    try {
      // Actual API call would go here
      deleteNews(newsId);
      
      addNotification({
        type: 'success',
        title: 'Haber Silindi',
        message: 'Haber başarıyla silindi',
        duration: 3000
      });
    } catch (error) {
      // Revert optimistic update
      mutate(originalData || []);
      throw error;
    }
  }, [data, mutate, deleteNews, addNotification]);

  return {
    news: data || [],
    loading,
    error,
    fetch,
    refetch,
    invalidate,
    addNews: addNewsOptimistic,
    updateNews: updateNewsOptimistic,
    deleteNews: deleteNewsOptimistic
  };
}

/**
 * Hook for managing comments with real-time updates
 */
export function useCommentsData(newsId: string) {
  const { comments, addComment } = useComments();
  const { addNotification } = useUI();

  const fetchComments = useCallback(async () => {
    // Filter comments for specific news
    return comments.filter(c => c.newsId === newsId);
  }, [comments, newsId]);

  const {
    data,
    loading,
    error,
    fetch,
    refetch,
    mutate
  } = useAsyncData(`comments-${newsId}`, fetchComments, {
    staleTime: 30 * 1000, // 30 seconds - comments need fresher data
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Yorum Yükleme Hatası',
        message: error.message,
        duration: 5000
      });
    }
  });

  // Add comment with optimistic update
  const addCommentOptimistic = useCallback(async (commentData: any) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = { 
      ...commentData, 
      _id: tempId, 
      newsId,
      createDate: new Date().toISOString()
    };
    
    // Optimistic update
    mutate(prev => prev ? [...prev, optimisticComment] : [optimisticComment], false);
    
    try {
      // Actual API call would go here
      const realComment = { ...commentData, _id: `real-${Date.now()}`, newsId };
      addComment(realComment);
      
      // Replace optimistic with real data
      mutate(prev => prev ? prev.map(c => c._id === tempId ? realComment : c) : [realComment]);
      
      addNotification({
        type: 'success',
        title: 'Yorum Eklendi',
        message: 'Yorumunuz başarıyla eklendi',
        duration: 3000
      });
    } catch (error) {
      // Revert optimistic update
      mutate(prev => prev ? prev.filter(c => c._id !== tempId) : []);
      throw error;
    }
  }, [mutate, addComment, newsId, addNotification]);

  // Auto-refresh comments every 30 seconds for active discussions
  useEffect(() => {
    if (data && data.length > 0) {
      const interval = setInterval(() => {
        fetch();
      }, 30000);
      
      return () => clearInterval(interval);
    }
    return undefined; // Return undefined for consistency
  }, [data, fetch]);

  return {
    comments: data || [],
    loading,
    error,
    refetch,
    addComment: addCommentOptimistic
  };
}

/**
 * Hook for infinite scroll pagination
 */
export function useInfiniteData<T>(
  _baseKey: string,
  fetchPage: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean; total?: number }>,
  pageSize = 20
) {
  const [state, setState] = useState({
    pages: [] as T[][],
    loading: false,
    error: null as Error | null,
    hasMore: true,
    currentPage: 0,
    total: 0
  });

  const { addNotification } = useUI();

  const fetchNextPage = useCallback(async () => {
    if (state.loading || !state.hasMore) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await fetchPage(state.currentPage, pageSize);
      
      setState(prev => ({
        ...prev,
        pages: [...prev.pages, result.data],
        loading: false,
        hasMore: result.hasMore,
        currentPage: prev.currentPage + 1,
        total: result.total || prev.total
      }));
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, loading: false, error: err }));
      
      addNotification({
        type: 'error',
        title: 'Yükleme Hatası',
        message: err.message,
        duration: 5000
      });
    }
  }, [state.loading, state.hasMore, state.currentPage, fetchPage, pageSize, addNotification]);

  const reset = useCallback(() => {
    setState({
      pages: [],
      loading: false,
      error: null,
      hasMore: true,
      currentPage: 0,
      total: 0
    });
  }, []);

  const flatData = useMemo(() => {
    return state.pages.flat();
  }, [state.pages]);

  return {
    data: flatData,
    pages: state.pages,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    total: state.total,
    fetchNextPage,
    reset
  };
}

/**
 * Hook for search with debouncing and caching
 */
export function useSearchData<T>(
  searchFn: (query: string) => Promise<T[]>,
  debounceMs = 300
) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounce query
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, debounceMs]);

  const {
    data,
    loading,
    error,
    fetch
  } = useAsyncData(
    `search-${debouncedQuery}`,
    () => searchFn(debouncedQuery),
    {
      immediate: false,
      staleTime: 2 * 60 * 1000, // 2 minutes
      shouldFetch: () => debouncedQuery.length >= 2
    }
  );

  // Fetch when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetch();
    }
  }, [debouncedQuery, fetch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  return {
    query,
    setQuery,
    results: data || [],
    loading,
    error,
    clearSearch
  };
}