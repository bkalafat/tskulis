/**
 * TypeScript Utility Types for TS Kulis
 * Advanced type utilities and helpers
 */

import { NewsType } from './NewsType';
import { CommentType } from './CommentType';

// Advanced utility types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Pick by type
export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

export type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

// String manipulation types
export type Capitalize<T extends string> = T extends `${infer F}${infer R}` 
  ? `${Uppercase<F>}${R}` 
  : T;

export type Uncapitalize<T extends string> = T extends `${infer F}${infer R}` 
  ? `${Lowercase<F>}${R}` 
  : T;

export type CamelCase<T extends string> = T extends `${infer F}_${infer R}`
  ? `${F}${Capitalize<CamelCase<R>>}`
  : T;

export type KebabCase<T extends string> = T extends `${infer F}${infer R}`
  ? F extends Uppercase<F>
    ? `${Lowercase<F>}${KebabCase<R>}`
    : `${F}${KebabCase<R>}`
  : T;

// Array utilities
export type Head<T extends readonly unknown[]> = T extends readonly [infer H, ...unknown[]] ? H : never;
export type Tail<T extends readonly unknown[]> = T extends readonly [unknown, ...infer Rest] ? Rest : never;
export type Last<T extends readonly unknown[]> = T extends readonly [...unknown[], infer L] ? L : never;
export type Length<T extends readonly unknown[]> = T['length'];

// Object utilities
export type ValueOf<T> = T[keyof T];
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// Function utilities
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R> ? R : any;

export type Awaited<T> = T extends Promise<infer U> ? U : T;

// Conditional types
export type NonNullable<T> = T extends null | undefined ? never : T;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export type If<C extends boolean, T, F> = C extends true ? T : F;
export type Not<C extends boolean> = C extends true ? false : true;
export type And<A extends boolean, B extends boolean> = A extends true ? B : false;
export type Or<A extends boolean, B extends boolean> = A extends true ? true : B;

// Union utilities
export type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never;
export type UnionToTuple<T> = UnionToIntersection<T extends any ? () => T : never> extends () => infer R ? [R] : never;

// Brand types for stronger type safety
export type Brand<T, B> = T & { __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type NewsId = Brand<string, 'NewsId'>;
export type CommentId = Brand<string, 'CommentId'>;
export type Slug = Brand<string, 'Slug'>;
export type Url = Brand<string, 'Url'>;
export type Email = Brand<string, 'Email'>;
export type ISODate = Brand<string, 'ISODate'>;
export type SafeHtml = Brand<string, 'SafeHtml'>;

// Builder pattern types
export type Builder<T> = {
  [K in keyof T]: (value: T[K]) => Builder<T>;
} & {
  build(): T;
};

// State machine types
export type StateMachine<S extends string, E extends string> = {
  state: S;
  transitions: Record<S, Partial<Record<E, S>>>;
};

export type StateTransition<T extends StateMachine<any, any>> = 
  T extends StateMachine<infer S, infer E> ? {
    from: S;
    event: E;
    to: S;
  } : never;

// API types
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type ApiEndpoint<TResponse = unknown, TRequest = unknown> = {
  method: ApiMethod;
  path: string;
  request?: TRequest;
  response: TResponse;
};

// Form types
export type FormState<T> = {
  [K in keyof T]: {
    value: T[K];
    error?: string;
    touched: boolean;
    dirty: boolean;
  };
};

export type FormErrors<T> = Partial<Record<keyof T, string>>;
export type FormTouched<T> = Partial<Record<keyof T, boolean>>;

// Event handler types
export type EventMap = {
  click: MouseEvent;
  change: Event;
  input: InputEvent;
  submit: SubmitEvent;
  focus: FocusEvent;
  blur: FocusEvent;
  keydown: KeyboardEvent;
  keyup: KeyboardEvent;
  scroll: Event;
  resize: Event;
  load: Event;
  error: ErrorEvent;
};

export type EventHandler<T extends keyof EventMap> = (event: EventMap[T]) => void;
export type AsyncEventHandler<T extends keyof EventMap> = (event: EventMap[T]) => Promise<void>;

// Component prop types
export type ComponentProps<T extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[T];
export type ReactRef<T = HTMLElement> = React.RefObject<T> | React.MutableRefObject<T>;

export type PropsWithRef<P, T = HTMLElement> = P & {
  ref?: ReactRef<T>;
};

export type PropsWithClassName<P> = P & {
  className?: string;
};

export type PropsWithChildren<P = {}> = P & {
  children?: React.ReactNode;
};

export type PropsWithTestId<P = {}> = P & {
  testId?: string;
  'data-testid'?: string;
};

// Domain-specific types for TS Kulis

// Enhanced News types
export type NewsPreview = Pick<NewsType, 'id' | 'caption' | 'summary' | 'imgPath' | 'imgAlt' | 'category' | 'createDate' | 'slug'>;
export type NewsCard = Pick<NewsType, 'id' | 'caption' | 'summary' | 'imgPath' | 'imgAlt' | 'category' | 'createDate' | 'slug' | 'viewCount'>;
export type NewsListItem = Pick<NewsType, 'id' | 'caption' | 'category' | 'createDate' | 'priority' | 'slug'>;

export type NewsCreateInput = Pick<NewsType, 'caption' | 'content' | 'summary' | 'category' | 'type' | 'imgPath' | 'imgAlt'> & {
  subjects?: string[];
  authors?: string[];
  priority?: number;
  showNotification?: boolean;
};

export type NewsUpdateInput = Partial<Omit<NewsType, 'id' | 'createDate' | 'slug'>> & {
  updateDate: string;
};

// Enhanced Comment types
export type CommentPreview = Pick<CommentType, 'id' | 'userName' | 'text' | 'createDate'>;
export type CommentCreateInput = Pick<CommentType, 'newsId' | 'userName' | 'text'>;

// Search result types
export type NewsSearchResult = NewsPreview & {
  relevanceScore: number;
  highlightedCaption: string;
  highlightedContent: string;
};

export type SearchFacet = {
  name: string;
  value: string;
  count: number;
  selected: boolean;
};

// Analytics types
export type AnalyticsEvent = {
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
  pageUrl: string;
  userAgent: string;
};

export type PageView = {
  url: string;
  title: string;
  referrer?: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  loadTime?: number;
};

// Cache types
export type CacheKey = string;
export type CacheTTL = number;
export type CacheStrategy = 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';

export type CacheEntry<T = unknown> = {
  key: CacheKey;
  value: T;
  timestamp: number;
  ttl: CacheTTL;
  strategy: CacheStrategy;
};

// Theme types
export type ColorScheme = 'light' | 'dark' | 'auto';
export type ThemeVariant = 'default' | 'trabzonspor' | 'minimal';

export type ResponsiveValue<T> = T | {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
};

// Feature flag types
export type FeatureFlag = 'comments' | 'socialShare' | 'analytics' | 'pushNotifications' | 'betaFeatures';
export type FeatureFlagValue = boolean | string | number;
export type FeatureFlagConfig = Record<FeatureFlag, FeatureFlagValue>;

// Performance monitoring types
export type PerformanceMetric = 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB';
export type PerformanceEntry = {
  metric: PerformanceMetric;
  value: number;
  timestamp: number;
  url: string;
  connection?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
};

// Error tracking types
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'javascript' | 'network' | 'render' | 'security' | 'performance';

export type ErrorReport = {
  id: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: number;
  url: string;
  userId?: string;
  userAgent: string;
  additionalData?: Record<string, unknown>;
};

// Route types
export type RoutePathname = string;
export type RouteParams = Record<string, string | string[]>;
export type RouteQuery = Record<string, string | string[] | undefined>;

export type AppRoute = {
  pathname: RoutePathname;
  params?: RouteParams;
  query?: RouteQuery;
};

// Validation types
export type ValidationRule<T = unknown> = (value: T) => boolean | string;
export type ValidationRules<T> = Partial<Record<keyof T, ValidationRule<T[keyof T]>[]>>;

export type ValidatedField<T = unknown> = {
  value: T;
  isValid: boolean;
  error?: string;
  touched: boolean;
  dirty: boolean;
};

export type ValidatedForm<T> = {
  [K in keyof T]: ValidatedField<T[K]>;
};

// Database query types
export type SortDirection = 'asc' | 'desc';
export type SortField<T> = keyof T;
export type SortOptions<T> = {
  field: SortField<T>;
  direction: SortDirection;
};

export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex' | 'exists';
export type FilterCondition<T> = {
  field: keyof T;
  operator: FilterOperator;
  value: unknown;
};

export type QueryOptions<T> = {
  filter?: FilterCondition<T>[];
  sort?: SortOptions<T>[];
  limit?: number;
  offset?: number;
  select?: (keyof T)[];
};

// Server-side types
export type NextApiHandler<T = unknown> = (
  req: NextApiRequest,
  res: NextApiResponse<T>
) => void | Promise<void>;

export type NextApiRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
  query: Record<string, string | string[]>;
  cookies: Record<string, string>;
};

export type NextApiResponse<T = unknown> = {
  status(code: number): NextApiResponse<T>;
  json(data: T): void;
  send(data: string): void;
  end(): void;
  setHeader(name: string, value: string): void;
};