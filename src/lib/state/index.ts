/**
 * State Management Index
 * Central exports for the state management system
 */

// Core state management
export { AppStateProvider, useAppState } from './store';
export type { AppState, AppAction } from './store';

// Domain-specific hooks
export {
  useNews,
  useComments, 
  useUI,
  useUser,
  usePerformance,
  useAsyncState,
  useDebouncedState,
  useStateUtils
} from './hooks';

// Advanced async hooks
export {
  useAsyncData,
  useNewsData,
  useCommentsData,
  useInfiniteData,
  useSearchData
} from './async-hooks';

// State persistence
export { StatePersistence } from './persistence';

// Type definitions for external use
export interface NewsType {
  _id: string;
  caption: string;
  content: string;
  category: string;
  type: string;
  slug: string;
  imgPath?: string;
  createDate: string;
  updateDate?: string;
  expressDate?: string;
  isActive: boolean;
  tags?: string[];
  viewCount?: number;
}

export interface CommentType {
  _id: string;
  newsId: string;
  author: string;
  email?: string;
  content: string;
  createDate: string;
  isApproved: boolean;
  parentId?: string;
  likes?: number;
  dislikes?: number;
}

export interface NotificationType {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
}

export interface UserType {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'user';
  avatar?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    language: 'tr' | 'en';
    notifications: boolean;
    autoSave: boolean;
  };
  lastLogin?: string;
  isActive: boolean;
}

// Utility types
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  [key: string]: any;
}

// Performance monitoring types
export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage: number;
  errorCount: number;
  userInteractions: number;
}

// Hook options
export interface UseAsyncStateOptions<T> {
  immediate?: boolean;
  defaultValue?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  cacheTime?: number;
}

// State management utilities
export const StateUtils = {
  /**
   * Create initial state with default values
   */
  createInitialState: <T>(defaults: Partial<T> = {}): T => {
    return { ...defaults } as T;
  },

  /**
   * Deep merge state objects
   */
  mergeState: <T>(current: T, updates: Partial<T>): T => {
    if (typeof current !== 'object' || current === null) {
      return updates as T;
    }
    
    const result = { ...current };
    
    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        const value = updates[key];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          (result as any)[key] = StateUtils.mergeState((result as any)[key] || {}, value);
        } else {
          (result as any)[key] = value;
        }
      }
    }
    
    return result;
  },

  /**
   * Create action creator
   */
  createAction: <T = any>(type: string) => (payload?: T) => ({
    type,
    payload
  }),

  /**
   * Create async action creators
   */
  createAsyncActions: (type: string) => ({
    request: StateUtils.createAction(`${type}_REQUEST`),
    success: StateUtils.createAction(`${type}_SUCCESS`),
    failure: StateUtils.createAction(`${type}_FAILURE`)
  }),

  /**
   * Debounce function
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Deep clone object
   */
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
    if (Array.isArray(obj)) return obj.map(item => StateUtils.deepClone(item)) as unknown as T;
    
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = StateUtils.deepClone(obj[key]);
      }
    }
    return cloned;
  },

  /**
   * Compare objects for equality
   */
  isEqual: (a: any, b: any): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!StateUtils.isEqual(a[key], b[key])) return false;
      }
      
      return true;
    }
    
    return false;
  }
};

// State management constants
export const STATE_ACTIONS = {
  // News actions
  NEWS_SET: 'NEWS_SET',
  NEWS_ADD: 'NEWS_ADD',
  NEWS_UPDATE: 'NEWS_UPDATE',
  NEWS_DELETE: 'NEWS_DELETE',
  NEWS_SET_LOADING: 'NEWS_SET_LOADING',
  NEWS_SET_ERROR: 'NEWS_SET_ERROR',
  NEWS_CLEAR_ERROR: 'NEWS_CLEAR_ERROR',

  // Comments actions
  COMMENTS_SET: 'COMMENTS_SET',
  COMMENTS_ADD: 'COMMENTS_ADD',
  COMMENTS_UPDATE: 'COMMENTS_UPDATE',
  COMMENTS_DELETE: 'COMMENTS_DELETE',
  COMMENTS_SET_LOADING: 'COMMENTS_SET_LOADING',
  COMMENTS_SET_ERROR: 'COMMENTS_SET_ERROR',

  // UI actions
  UI_SET_THEME: 'UI_SET_THEME',
  UI_SET_LOADING: 'UI_SET_LOADING',
  UI_ADD_NOTIFICATION: 'UI_ADD_NOTIFICATION',
  UI_REMOVE_NOTIFICATION: 'UI_REMOVE_NOTIFICATION',
  UI_SET_MODAL: 'UI_SET_MODAL',
  UI_SET_SIDEBAR: 'UI_SET_SIDEBAR',

  // User actions
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_UPDATE: 'USER_UPDATE',
  USER_SET_PREFERENCES: 'USER_SET_PREFERENCES',

  // Performance actions
  PERFORMANCE_UPDATE_METRICS: 'PERFORMANCE_UPDATE_METRICS',
  PERFORMANCE_ADD_TIMING: 'PERFORMANCE_ADD_TIMING',
  PERFORMANCE_INCREMENT_ERROR: 'PERFORMANCE_INCREMENT_ERROR'
} as const;

export type StateActionType = typeof STATE_ACTIONS[keyof typeof STATE_ACTIONS];