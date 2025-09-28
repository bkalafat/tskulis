/**
 * Type Guards for TS Kulis
 * Runtime type checking and validation functions
 */

import { NewsType } from './NewsType';
import { CommentType } from './CommentType';
import { CATEGORY, TYPE } from '../utils/enum';
import { ApiResponse, ApiError } from './global';

// Basic type guards
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isArray = <T = unknown>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function';
};

export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};

export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Enum type guards
export const isCategoryEnum = (value: unknown): value is CATEGORY => {
  return isString(value) && Object.values(CATEGORY).includes(value as CATEGORY);
};

export const isTypeEnum = (value: unknown): value is TYPE => {
  return isString(value) && Object.values(TYPE).includes(value as TYPE);
};

// Date type guards
export const isValidDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

export const isValidDateString = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const date = new Date(value);
  return isValidDate(date);
};

export const isISO8601DateString = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  return iso8601Regex.test(value) && isValidDateString(value);
};

// URL type guards
export const isValidUrl = (value: unknown): value is string => {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const isValidImageUrl = (value: unknown): value is string => {
  if (!isValidUrl(value)) return false;
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i;
  return imageExtensions.test(value);
};

// Email validation
export const isValidEmail = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

// News type guards
export const hasRequiredNewsFields = (value: unknown): value is Partial<NewsType> => {
  if (!isObject(value)) return false;
  
  return (
    'caption' in value &&
    'content' in value &&
    'category' in value
  );
};

export const isValidNewsType = (value: unknown): value is NewsType => {
  if (!isObject(value)) return false;
  
  const news = value as Record<string, unknown>;
  
  return (
    isString(news.id) &&
    isString(news.caption) &&
    isString(news.content) &&
    isString(news.summary) &&
    isCategoryEnum(news.category) &&
    isTypeEnum(news.type) &&
    isString(news.imgPath) &&
    isString(news.imgAlt) &&
    isArray(news.subjects) &&
    news.subjects.every(isString) &&
    isArray(news.authors) &&
    news.authors.every(isString) &&
    isValidDateString(news.createDate) &&
    isValidDateString(news.updateDate) &&
    isValidDateString(news.expressDate) &&
    isNumber(news.priority) &&
    isBoolean(news.isActive) &&
    isBoolean(news.isSecondPageNews) &&
    isBoolean(news.showNotification) &&
    isString(news.slug) &&
    isString(news.url) &&
    isString(news.keywords) &&
    isString(news.socialTags) &&
    (news.viewCount === undefined || isNumber(news.viewCount))
  );
};

export const isPartialNewsType = (value: unknown): value is Partial<NewsType> => {
  if (!isObject(value)) return false;
  
  const news = value as Record<string, unknown>;
  
  // Check only defined properties
  if (news.id !== undefined && !isString(news.id)) return false;
  if (news.caption !== undefined && !isString(news.caption)) return false;
  if (news.content !== undefined && !isString(news.content)) return false;
  if (news.category !== undefined && !isCategoryEnum(news.category)) return false;
  if (news.type !== undefined && !isTypeEnum(news.type)) return false;
  if (news.subjects !== undefined && (!isArray(news.subjects) || !news.subjects.every(isString))) return false;
  if (news.authors !== undefined && (!isArray(news.authors) || !news.authors.every(isString))) return false;
  if (news.priority !== undefined && !isNumber(news.priority)) return false;
  if (news.viewCount !== undefined && !isNumber(news.viewCount)) return false;
  
  return true;
};

// Comment type guards
export const isValidCommentType = (value: unknown): value is CommentType => {
  if (!isObject(value)) return false;
  
  const comment = value as Record<string, unknown>;
  
  return (
    isString(comment.id) &&
    isString(comment.newsId) &&
    isString(comment.userName) &&
    isString(comment.text) &&
    isValidDateString(comment.createDate) &&
    isValidDateString(comment.updateDate) &&
    isBoolean(comment.isActive)
  );
};

export const hasRequiredCommentFields = (value: unknown): value is Pick<CommentType, 'newsId' | 'userName' | 'text'> => {
  if (!isObject(value)) return false;
  
  const comment = value as Record<string, unknown>;
  
  return (
    isString(comment.newsId) &&
    isString(comment.userName) &&
    isString(comment.text) &&
    !isEmpty(comment.userName) &&
    !isEmpty(comment.text)
  );
};

// API response type guards
export const isApiResponse = <T = unknown>(value: unknown): value is ApiResponse<T> => {
  if (!isObject(value)) return false;
  
  const response = value as Record<string, unknown>;
  
  return (
    isBoolean(response.success) &&
    (response.data === undefined || isDefined(response.data)) &&
    (response.message === undefined || isString(response.message)) &&
    (response.error === undefined || isString(response.error))
  );
};

export const isSuccessResponse = <T = unknown>(value: unknown): value is ApiResponse<T> & { success: true; data: T } => {
  return isApiResponse(value) && value.success === true && isDefined(value.data);
};

export const isErrorResponse = (value: unknown): value is ApiResponse & { success: false; error: string } => {
  return isApiResponse(value) && value.success === false && isString(value.error);
};

export const isApiError = (value: unknown): value is ApiError => {
  if (!isObject(value)) return false;
  
  const error = value as Record<string, unknown>;
  
  return (
    isString(error.message) &&
    isString(error.code) &&
    isNumber(error.statusCode)
  );
};

// Browser environment type guards
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

export const isServer = (): boolean => {
  return typeof window === 'undefined';
};

export const hasLocalStorage = (): boolean => {
  try {
    return isBrowser() && typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
};

export const hasSessionStorage = (): boolean => {
  try {
    return isBrowser() && typeof sessionStorage !== 'undefined';
  } catch {
    return false;
  }
};

// Feature detection type guards
export const supportsWebP = (): boolean => {
  if (!isBrowser()) return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

export const supportsIntersectionObserver = (): boolean => {
  return isBrowser() && 'IntersectionObserver' in window;
};

export const supportsWebShare = (): boolean => {
  return isBrowser() && 'share' in navigator;
};

export const supportsServiceWorker = (): boolean => {
  return isBrowser() && 'serviceWorker' in navigator;
};

export const supportsWebPush = (): boolean => {
  return isBrowser() && 'PushManager' in window;
};

// Performance API type guards
export const supportsPerformanceObserver = (): boolean => {
  return isBrowser() && 'PerformanceObserver' in window;
};

export const supportsWebVitals = (): boolean => {
  return supportsPerformanceObserver();
};

// Form validation type guards
export const isValidSlug = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(value);
};

export const isValidPhoneNumber = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const phoneRegex = /^(\+90|0)?[0-9]{10}$/;
  return phoneRegex.test(value.replace(/\s/g, ''));
};

export const hasMinLength = (minLength: number) => (value: unknown): value is string => {
  return isString(value) && value.length >= minLength;
};

export const hasMaxLength = (maxLength: number) => (value: unknown): value is string => {
  return isString(value) && value.length <= maxLength;
};

export const isInRange = (min: number, max: number) => (value: unknown): value is number => {
  return isNumber(value) && value >= min && value <= max;
};

// Search query type guards
export const isValidSearchQuery = (value: unknown): boolean => {
  if (!isString(value)) return false;
  return value.trim().length >= 2 && value.trim().length <= 100;
};

// File type guards
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const isValidImageSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Advanced type predicates with error messages
export const createValidator = <T>(
  predicate: (value: unknown) => value is T,
  errorMessage: string
) => {
  return (value: unknown): { isValid: boolean; value?: T; error?: string } => {
    if (predicate(value)) {
      return { isValid: true, value };
    }
    return { isValid: false, error: errorMessage };
  };
};

// Utility function for runtime type assertion with detailed errors
export const assertType = <T>(
  value: unknown,
  predicate: (value: unknown) => value is T,
  typeName: string
): T => {
  if (predicate(value)) {
    return value;
  }
  
  const actualType = value === null ? 'null' : typeof value;
  throw new TypeError(`Expected ${typeName}, but received ${actualType}`);
};

// Schema validation helpers
export const validateSchema = <T>(
  value: unknown,
  schema: Record<string, (val: unknown) => boolean>
): { isValid: boolean; errors: string[]; data?: T } => {
  const errors: string[] = [];
  
  if (!isObject(value)) {
    return { isValid: false, errors: ['Expected an object'] };
  }
  
  const obj = value as Record<string, unknown>;
  
  for (const [key, validator] of Object.entries(schema)) {
    if (!validator(obj[key])) {
      errors.push(`Invalid value for field: ${key}`);
    }
  }
  
  if (errors.length === 0) {
    return { isValid: true, errors: [], data: value as T };
  }
  
  return { isValid: false, errors };
};