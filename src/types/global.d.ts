/**
 * Global Type Definitions for TS Kulis
 * Comprehensive type safety across the application
 */

// Environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly NEXT_PUBLIC_API_PATH: string;
    readonly NEXT_PUBLIC_SITE_URL: string;
    readonly MONGODB_URI: string;
    readonly NEXTAUTH_URL: string;
    readonly NEXTAUTH_SECRET: string;
    readonly TWITTER_CLIENT_ID: string;
    readonly TWITTER_CLIENT_SECRET: string;
    readonly NEXT_PUBLIC_GA_TRACKING_ID?: string;
    readonly NEXT_PUBLIC_GTM_ID?: string;
    readonly NEXT_PUBLIC_FB_PIXEL_ID?: string;
    readonly NEXT_PUBLIC_HOTJAR_ID?: string;
    readonly UPLOAD_FILE_PATH: string;
    readonly NEXT_PUBLIC_FB_APP_TOKEN?: string;
  }
}

// Window global extensions
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
    fbq: (...args: unknown[]) => void;
    hj: (...args: unknown[]) => void;
    performance: Performance;
  }

  // Performance Observer types
  interface PerformanceNavigationTiming extends PerformanceEntry {
    domContentLoadedEventEnd: number;
    loadEventEnd: number;
    fetchStart: number;
  }

  interface LayoutShift extends PerformanceEntry {
    value: number;
    hadRecentInput: boolean;
  }

  interface LargestContentfulPaint extends PerformanceEntry {
    renderTime: number;
    loadTime: number;
    size: number;
    id: string;
    url: string;
    element: Element;
  }
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// Database types
export interface DatabaseEntity {
  id: string;
  createDate: string;
  updateDate: string;
  isActive: boolean;
}

// Form types
export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
  required: boolean;
}

// Component props base types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// SEO and Meta types
export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

// Analytics event types
export interface AnalyticsEvent {
  category: 'page_view' | 'click' | 'form' | 'search' | 'share' | 'scroll' | 'error';
  action: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, string | number>;
}

// Search types
export interface SearchQuery {
  query: string;
  category?: string;
  type?: string;
  dateRange?: string;
  sortBy?: 'relevance' | 'date' | 'popularity';
  page?: number;
  limit?: number;
}

export interface SearchResult<T = unknown> {
  items: T[];
  totalCount: number;
  query: string;
  took: number;
  facets?: SearchFacets;
}

export interface SearchFacets {
  categories: Array<{ name: string; count: number }>;
  types: Array<{ name: string; count: number }>;
  dates: Array<{ range: string; count: number }>;
}

// Image types
export interface ImageData {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  placeholder?: string;
  priority?: boolean;
}

export interface OptimizedImage extends ImageData {
  srcSet: string;
  sizes: string;
  blurDataURL?: string;
}

// Social sharing types
export interface SocialShareData {
  url: string;
  title: string;
  description: string;
  image?: string;
  hashtags?: string[];
}

export interface SharePlatform {
  name: string;
  icon: string;
  url: string;
  color: string;
}

// Cache types
export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheConfig {
  ttl: number;
  maxSize: number;
  strategy: 'memory' | 'localStorage' | 'sessionStorage';
}

// Performance types
export interface CoreWebVitals {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export interface PerformanceMetrics extends CoreWebVitals {
  pageLoadTime: number;
  domContentLoadedTime: number;
  resourcesLoadTime: number;
  bundleSize: number;
}

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  light: string;
  dark: string;
  muted: string;
}

export interface Theme {
  colors: ThemeColors;
  breakpoints: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: Record<string, string>;
    fontWeight: Record<string, number>;
    lineHeight: Record<string, number>;
  };
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Function types
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler<T = Record<string, unknown>> = (data: T) => void | Promise<void>;

// API Client types
export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
}

export interface ApiClient {
  get<T>(url: string, config?: Omit<RequestConfig, 'method'>): Promise<T>;
  post<T>(url: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T>;
  put<T>(url: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T>;
  delete<T>(url: string, config?: Omit<RequestConfig, 'method'>): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T>;
}

// Route types
export interface RouteParams {
  [key: string]: string | string[] | undefined;
}

export interface NextPageProps<T = Record<string, unknown>, P = RouteParams> {
  params: P;
  searchParams: T;
}

// Component composition types
export type ComponentWithChildren<P = Record<string, unknown>> = React.FC<P & { children: React.ReactNode }>;
export type ComponentWithOptionalChildren<P = Record<string, unknown>> = React.FC<P & { children?: React.ReactNode }>;

// Error boundary types
export interface ErrorInfo {
  componentStack: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// Feature flag types
export interface FeatureFlags {
  enableAnalytics: boolean;
  enablePushNotifications: boolean;
  enableComments: boolean;
  enableSocialSharing: boolean;
  enableSearch: boolean;
  betaFeatures: boolean;
}

// Monitoring types
export interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

export interface LogEntry {
  level: keyof LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  stack?: string;
}

// Configuration types
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  cache: CacheConfig;
  features: FeatureFlags;
  theme: Theme;
  seo: Partial<SEOConfig>;
  analytics: {
    enabled: boolean;
    providers: string[];
  };
}

export {};