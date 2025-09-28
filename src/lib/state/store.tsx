/**
 * Global State Store
 * Centralized state management using Context API with persistence
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Temporary types - will be replaced with actual types from the project
interface NewsType {
  _id?: string;
  caption?: string;
  content?: string;
  category?: string;
  type?: string;
  slug?: string;
  imgPath?: string;
  createDate?: string;
  updateDate?: string;
  expressDate?: string;
}

interface CommentType {
  _id?: string;
  newsId?: string;
  name?: string;
  comment?: string;
  createDate?: string;
}

// State interfaces
export interface AppState {
  // News state
  news: {
    items: NewsType[];
    currentNews: NewsType | null;
    isLoading: boolean;
    error: string | null;
    lastFetch: number | null;
    categories: Record<string, NewsType[]>;
  };
  
  // Comments state
  comments: {
    items: CommentType[];
    isLoading: boolean;
    error: string | null;
    lastFetch: number | null;
  };
  
  // UI state
  ui: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    modalOpen: boolean;
    modalContent: React.ComponentType<any> | null;
    notifications: Notification[];
    loading: boolean;
    searchQuery: string;
    searchResults: NewsType[];
    searchOpen: boolean;
  };
  
  // User state
  user: {
    preferences: UserPreferences;
    session: any | null;
    isAuthenticated: boolean;
    permissions: string[];
  };
  
  // Performance state
  performance: {
    metrics: PerformanceMetrics;
    cacheStats: CacheStats;
    networkStatus: 'online' | 'offline';
    connectionType: string | null;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'tr' | 'en';
  notifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  compactView: boolean;
  showImages: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  errorRate: number;
  lastUpdated: number;
}

export interface CacheStats {
  size: number;
  hitRate: number;
  missCount: number;
  evictions: number;
  memoryUsage: number;
}

// Action types
export type AppAction =
  // News actions
  | { type: 'NEWS_FETCH_START' }
  | { type: 'NEWS_FETCH_SUCCESS'; payload: NewsType[] }
  | { type: 'NEWS_FETCH_ERROR'; payload: string }
  | { type: 'NEWS_SET_CURRENT'; payload: NewsType | null }
  | { type: 'NEWS_ADD'; payload: NewsType }
  | { type: 'NEWS_UPDATE'; payload: NewsType }
  | { type: 'NEWS_DELETE'; payload: string }
  | { type: 'NEWS_SET_CATEGORY'; payload: { category: string; news: NewsType[] } }
  
  // Comments actions
  | { type: 'COMMENTS_FETCH_START' }
  | { type: 'COMMENTS_FETCH_SUCCESS'; payload: CommentType[] }
  | { type: 'COMMENTS_FETCH_ERROR'; payload: string }
  | { type: 'COMMENTS_ADD'; payload: CommentType }
  | { type: 'COMMENTS_CLEAR' }
  
  // UI actions
  | { type: 'UI_SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'UI_TOGGLE_SIDEBAR' }
  | { type: 'UI_OPEN_MODAL'; payload: React.ComponentType<any> }
  | { type: 'UI_CLOSE_MODAL' }
  | { type: 'UI_ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UI_REMOVE_NOTIFICATION'; payload: string }
  | { type: 'UI_SET_LOADING'; payload: boolean }
  | { type: 'UI_SET_SEARCH_QUERY'; payload: string }
  | { type: 'UI_SET_SEARCH_RESULTS'; payload: NewsType[] }
  | { type: 'UI_TOGGLE_SEARCH' }
  
  // User actions
  | { type: 'USER_SET_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'USER_SET_SESSION'; payload: any }
  | { type: 'USER_SET_PERMISSIONS'; payload: string[] }
  | { type: 'USER_LOGOUT' }
  
  // Performance actions
  | { type: 'PERFORMANCE_UPDATE_METRICS'; payload: Partial<PerformanceMetrics> }
  | { type: 'PERFORMANCE_UPDATE_CACHE_STATS'; payload: CacheStats }
  | { type: 'PERFORMANCE_SET_NETWORK_STATUS'; payload: 'online' | 'offline' }
  | { type: 'PERFORMANCE_SET_CONNECTION_TYPE'; payload: string | null }
  
  // Global actions
  | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
  | { type: 'RESET_STATE' }
  | { type: 'CLEAR_CACHE' };

// Initial state
const getInitialUserPreferences = (): UserPreferences => ({
  theme: 'auto',
  language: 'tr',
  notifications: true,
  autoRefresh: true,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  compactView: false,
  showImages: true,
  fontSize: 'medium'
});

const initialState: AppState = {
  news: {
    items: [],
    currentNews: null,
    isLoading: false,
    error: null,
    lastFetch: null,
    categories: {}
  },
  comments: {
    items: [],
    isLoading: false,
    error: null,
    lastFetch: null
  },
  ui: {
    theme: 'light',
    sidebarOpen: false,
    modalOpen: false,
    modalContent: null,
    notifications: [],
    loading: false,
    searchQuery: '',
    searchResults: [],
    searchOpen: false
  },
  user: {
    preferences: getInitialUserPreferences(),
    session: null,
    isAuthenticated: false,
    permissions: []
  },
  performance: {
    metrics: {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      networkLatency: 0,
      cacheHitRate: 0,
      errorRate: 0,
      lastUpdated: Date.now()
    },
    cacheStats: {
      size: 0,
      hitRate: 0,
      missCount: 0,
      evictions: 0,
      memoryUsage: 0
    },
    networkStatus: 'online',
    connectionType: null
  }
};

// Reducer
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // News reducers
    case 'NEWS_FETCH_START':
      return {
        ...state,
        news: { ...state.news, isLoading: true, error: null }
      };
    
    case 'NEWS_FETCH_SUCCESS':
      return {
        ...state,
        news: {
          ...state.news,
          items: action.payload,
          isLoading: false,
          error: null,
          lastFetch: Date.now()
        }
      };
    
    case 'NEWS_FETCH_ERROR':
      return {
        ...state,
        news: { ...state.news, isLoading: false, error: action.payload }
      };
    
    case 'NEWS_SET_CURRENT':
      return {
        ...state,
        news: { ...state.news, currentNews: action.payload }
      };
    
    case 'NEWS_ADD':
      return {
        ...state,
        news: {
          ...state.news,
          items: [action.payload, ...state.news.items]
        }
      };
    
    case 'NEWS_UPDATE':
      return {
        ...state,
        news: {
          ...state.news,
          items: state.news.items.map(item =>
            item._id === action.payload._id ? action.payload : item
          ),
          currentNews: state.news.currentNews?._id === action.payload._id
            ? action.payload
            : state.news.currentNews
        }
      };
    
    case 'NEWS_DELETE':
      return {
        ...state,
        news: {
          ...state.news,
          items: state.news.items.filter(item => item._id !== action.payload),
          currentNews: state.news.currentNews?._id === action.payload
            ? null
            : state.news.currentNews
        }
      };
    
    case 'NEWS_SET_CATEGORY':
      return {
        ...state,
        news: {
          ...state.news,
          categories: {
            ...state.news.categories,
            [action.payload.category]: action.payload.news
          }
        }
      };
    
    // Comments reducers
    case 'COMMENTS_FETCH_START':
      return {
        ...state,
        comments: { ...state.comments, isLoading: true, error: null }
      };
    
    case 'COMMENTS_FETCH_SUCCESS':
      return {
        ...state,
        comments: {
          ...state.comments,
          items: action.payload,
          isLoading: false,
          error: null,
          lastFetch: Date.now()
        }
      };
    
    case 'COMMENTS_FETCH_ERROR':
      return {
        ...state,
        comments: { ...state.comments, isLoading: false, error: action.payload }
      };
    
    case 'COMMENTS_ADD':
      return {
        ...state,
        comments: {
          ...state.comments,
          items: [...state.comments.items, action.payload]
        }
      };
    
    case 'COMMENTS_CLEAR':
      return {
        ...state,
        comments: { ...state.comments, items: [] }
      };
    
    // UI reducers
    case 'UI_SET_THEME':
      return {
        ...state,
        ui: { ...state.ui, theme: action.payload }
      };
    
    case 'UI_TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
      };
    
    case 'UI_OPEN_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modalOpen: true,
          modalContent: action.payload
        }
      };
    
    case 'UI_CLOSE_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modalOpen: false,
          modalContent: null
        }
      };
    
    case 'UI_ADD_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [...state.ui.notifications, action.payload]
        }
      };
    
    case 'UI_REMOVE_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== action.payload)
        }
      };
    
    case 'UI_SET_LOADING':
      return {
        ...state,
        ui: { ...state.ui, loading: action.payload }
      };
    
    case 'UI_SET_SEARCH_QUERY':
      return {
        ...state,
        ui: { ...state.ui, searchQuery: action.payload }
      };
    
    case 'UI_SET_SEARCH_RESULTS':
      return {
        ...state,
        ui: { ...state.ui, searchResults: action.payload }
      };
    
    case 'UI_TOGGLE_SEARCH':
      return {
        ...state,
        ui: { ...state.ui, searchOpen: !state.ui.searchOpen }
      };
    
    // User reducers
    case 'USER_SET_PREFERENCES':
      return {
        ...state,
        user: {
          ...state.user,
          preferences: { ...state.user.preferences, ...action.payload }
        }
      };
    
    case 'USER_SET_SESSION':
      return {
        ...state,
        user: {
          ...state.user,
          session: action.payload,
          isAuthenticated: !!action.payload
        }
      };
    
    case 'USER_SET_PERMISSIONS':
      return {
        ...state,
        user: { ...state.user, permissions: action.payload }
      };
    
    case 'USER_LOGOUT':
      return {
        ...state,
        user: {
          ...state.user,
          session: null,
          isAuthenticated: false,
          permissions: []
        }
      };
    
    // Performance reducers
    case 'PERFORMANCE_UPDATE_METRICS':
      return {
        ...state,
        performance: {
          ...state.performance,
          metrics: { ...state.performance.metrics, ...action.payload }
        }
      };
    
    case 'PERFORMANCE_UPDATE_CACHE_STATS':
      return {
        ...state,
        performance: { ...state.performance, cacheStats: action.payload }
      };
    
    case 'PERFORMANCE_SET_NETWORK_STATUS':
      return {
        ...state,
        performance: { ...state.performance, networkStatus: action.payload }
      };
    
    case 'PERFORMANCE_SET_CONNECTION_TYPE':
      return {
        ...state,
        performance: { ...state.performance, connectionType: action.payload }
      };
    
    // Global reducers
    case 'HYDRATE_STATE':
      return { ...state, ...action.payload };
    
    case 'RESET_STATE':
      return initialState;
    
    case 'CLEAR_CACHE':
      return {
        ...state,
        news: { ...state.news, categories: {} },
        performance: {
          ...state.performance,
          cacheStats: {
            size: 0,
            hitRate: 0,
            missCount: 0,
            evictions: 0,
            memoryUsage: 0
          }
        }
      };
    
    default:
      return state;
  }
}

// Context
export const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

// Provider component
interface AppStateProviderProps {
  children: ReactNode;
  initialState?: Partial<AppState>;
}

export function AppStateProvider({ children, initialState: customInitialState }: AppStateProviderProps) {
  const [state, dispatch] = useReducer(
    appReducer,
    customInitialState ? { ...initialState, ...customInitialState } : initialState
  );

  // Persist state to localStorage
  useEffect(() => {
    const persistedState = {
      user: {
        preferences: state.user.preferences
      },
      ui: {
        theme: state.ui.theme,
        sidebarOpen: state.ui.sidebarOpen
      }
    };
    
    try {
      localStorage.setItem('tskulis_state', JSON.stringify(persistedState));
    } catch (error) {
      console.warn('Failed to persist state:', error);
    }
  }, [state.user.preferences, state.ui.theme, state.ui.sidebarOpen]);

  // Load persisted state on mount
  useEffect(() => {
    try {
      const persistedStateJson = localStorage.getItem('tskulis_state');
      if (persistedStateJson) {
        const persistedState = JSON.parse(persistedStateJson);
        dispatch({ type: 'HYDRATE_STATE', payload: persistedState });
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }, []);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

// Hook to use app state
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}