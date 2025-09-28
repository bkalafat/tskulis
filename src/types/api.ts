/**
 * API Type Definitions for TS Kulis
 * Type-safe API contracts and interfaces
 */

import { NewsType } from './NewsType';
import { CommentType } from './CommentType';
import { CATEGORY, TYPE } from '../utils/enum';
import { ApiResponse, PaginationInfo } from './global';

// Base API types
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  cache?: 'force-cache' | 'no-cache' | 'reload' | 'no-store';
}

export interface ApiSuccessResponse<T = unknown> extends ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  pagination?: PaginationInfo;
}

export interface ApiErrorResponse extends ApiResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export type ApiResponseType<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// News API types
export namespace NewsApi {
  // Request types
  export interface GetNewsListQuery {
    page?: number;
    limit?: number;
    category?: CATEGORY | string;
    type?: TYPE | string;
    search?: string;
    sortBy?: 'createDate' | 'updateDate' | 'priority' | 'viewCount';
    sortOrder?: 'asc' | 'desc';
    author?: string;
    dateFrom?: string;
    dateTo?: string;
    isActive?: boolean;
    priority?: number;
  }

  export interface GetNewsQuery {
    includeInactive?: boolean;
    incrementView?: boolean;
  }

  export interface CreateNewsRequest {
    caption: string;
    content: string;
    summary?: string;
    category: CATEGORY | string;
    type: TYPE | string;
    imgPath?: string;
    imgAlt?: string;
    subjects?: string[];
    authors?: string[];
    priority?: number;
    isSecondPageNews?: boolean;
    showNotification?: boolean;
    keywords?: string;
    socialTags?: string;
    expressDate?: string;
  }

  export interface UpdateNewsRequest extends Partial<Omit<CreateNewsRequest, 'category' | 'type'>> {
    category?: CATEGORY | string;
    type?: TYPE | string;
    isActive?: boolean;
  }

  export interface BulkUpdateRequest {
    ids: string[];
    updates: UpdateNewsRequest;
  }

  export interface BulkDeleteRequest {
    ids: string[];
    reason?: string;
  }

  export interface SearchNewsQuery extends GetNewsListQuery {
    query: string;
    fields?: ('caption' | 'content' | 'summary' | 'keywords')[];
    fuzzy?: boolean;
    boost?: Record<string, number>;
  }

  // Response types
  export type GetNewsListResponse = ApiSuccessResponse<{
    items: NewsType[];
    pagination: PaginationInfo;
    facets?: {
      categories: Array<{ name: string; count: number }>;
      types: Array<{ name: string; count: number }>;
      authors: Array<{ name: string; count: number }>;
    };
  }>;

  export type GetNewsResponse = ApiSuccessResponse<NewsType>;
  export type CreateNewsResponse = ApiSuccessResponse<{ id: string; slug: string }>;
  export type UpdateNewsResponse = ApiSuccessResponse<{ updated: boolean }>;
  export type DeleteNewsResponse = ApiSuccessResponse<{ deleted: boolean }>;
  
  export type BulkUpdateResponse = ApiSuccessResponse<{
    updated: number;
    failed: Array<{ id: string; error: string }>;
  }>;

  export type SearchNewsResponse = ApiSuccessResponse<{
    items: Array<NewsType & { score: number; highlights: Record<string, string> }>;
    totalCount: number;
    query: string;
    took: number;
    facets?: Record<string, Array<{ value: string; count: number }>>;
  }>;

  export type GetPopularNewsResponse = ApiSuccessResponse<NewsType[]>;
  export type GetRelatedNewsResponse = ApiSuccessResponse<NewsType[]>;
  export type GetNewsStatsResponse = ApiSuccessResponse<{
    totalNews: number;
    publishedToday: number;
    totalViews: number;
    categoryCounts: Record<string, number>;
  }>;
}

// Comments API types
export namespace CommentsApi {
  // Request types
  export interface GetCommentsQuery {
    newsId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createDate' | 'updateDate';
    sortOrder?: 'asc' | 'desc';
    isActive?: boolean;
  }

  export interface CreateCommentRequest {
    newsId: string;
    userName: string;
    text: string;
    parentId?: string;
  }

  export interface UpdateCommentRequest {
    text?: string;
    isActive?: boolean;
  }

  export interface BulkModerationRequest {
    commentIds: string[];
    action: 'approve' | 'reject' | 'delete';
    reason?: string;
  }

  // Response types
  export type GetCommentsResponse = ApiSuccessResponse<{
    items: CommentType[];
    pagination: PaginationInfo;
  }>;

  export type CreateCommentResponse = ApiSuccessResponse<{ id: string }>;
  export type UpdateCommentResponse = ApiSuccessResponse<{ updated: boolean }>;
  export type DeleteCommentResponse = ApiSuccessResponse<{ deleted: boolean }>;
  
  export type BulkModerationResponse = ApiSuccessResponse<{
    processed: number;
    failed: Array<{ id: string; error: string }>;
  }>;

  export type GetCommentStatsResponse = ApiSuccessResponse<{
    totalComments: number;
    pendingModeration: number;
    approvedToday: number;
  }>;
}

// Upload API types
export namespace UploadApi {
  export interface UploadFileRequest {
    file: File;
    category?: 'news' | 'profile' | 'general';
    resize?: {
      width?: number;
      height?: number;
      quality?: number;
    };
  }

  export interface UploadMultipleRequest {
    files: File[];
    category?: string;
    resize?: {
      width?: number;
      height?: number;
      quality?: number;
    };
  }

  export interface DeleteFileRequest {
    url: string;
  }

  // Response types
  export type UploadFileResponse = ApiSuccessResponse<{
    url: string;
    fileName: string;
    size: number;
    type: string;
    dimensions?: {
      width: number;
      height: number;
    };
  }>;

  export type UploadMultipleResponse = ApiSuccessResponse<{
    files: Array<{
      url: string;
      fileName: string;
      size: number;
      type: string;
    }>;
    failed: Array<{
      fileName: string;
      error: string;
    }>;
  }>;

  export type DeleteFileResponse = ApiSuccessResponse<{ deleted: boolean }>;
}

// Analytics API types
export namespace AnalyticsApi {
  export interface TrackEventRequest {
    event: string;
    category: string;
    action: string;
    label?: string;
    value?: number;
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
  }

  export interface TrackPageViewRequest {
    url: string;
    title: string;
    referrer?: string;
    userId?: string;
    sessionId?: string;
    loadTime?: number;
  }

  export interface GetAnalyticsQuery {
    startDate: string;
    endDate: string;
    metrics?: ('pageViews' | 'uniqueVisitors' | 'bounceRate' | 'avgSessionDuration')[];
    dimensions?: ('page' | 'source' | 'device' | 'location')[];
    filters?: Record<string, string>;
  }

  // Response types
  export type TrackEventResponse = ApiSuccessResponse<{ tracked: boolean }>;
  export type TrackPageViewResponse = ApiSuccessResponse<{ tracked: boolean }>;
  
  export type GetAnalyticsResponse = ApiSuccessResponse<{
    metrics: Record<string, number>;
    data: Array<Record<string, string | number>>;
    totalRows: number;
    dateRange: { start: string; end: string };
  }>;
}

// Search API types
export namespace SearchApi {
  export interface SearchQuery {
    q: string;
    type?: 'news' | 'comments' | 'all';
    category?: CATEGORY | string;
    limit?: number;
    offset?: number;
    sortBy?: 'relevance' | 'date' | 'popularity';
    filters?: Record<string, unknown>;
    highlight?: boolean;
    facets?: string[];
  }

  export interface SearchSuggestionsQuery {
    q: string;
    limit?: number;
    type?: 'news' | 'categories' | 'all';
  }

  // Response types
  export type SearchResponse = ApiSuccessResponse<{
    results: Array<{
      id: string;
      type: 'news' | 'comment';
      title: string;
      excerpt: string;
      url: string;
      score: number;
      highlights?: Record<string, string[]>;
      metadata: Record<string, unknown>;
    }>;
    totalCount: number;
    took: number;
    facets?: Record<string, Array<{ value: string; count: number }>>;
  }>;

  export type SearchSuggestionsResponse = ApiSuccessResponse<{
    suggestions: Array<{
      text: string;
      type: 'query' | 'category' | 'news';
      count?: number;
    }>;
  }>;
}

// Admin API types
export namespace AdminApi {
  export interface GetUsersQuery {
    page?: number;
    limit?: number;
    role?: 'admin' | 'editor' | 'user';
    isActive?: boolean;
    search?: string;
  }

  export interface UpdateUserRequest {
    role?: 'admin' | 'editor' | 'user';
    isActive?: boolean;
    permissions?: string[];
  }

  export interface GetSystemStatsQuery {
    period?: 'day' | 'week' | 'month' | 'year';
  }

  // Response types
  export type GetUsersResponse = ApiSuccessResponse<{
    users: Array<{
      id: string;
      email: string;
      name?: string;
      role: string;
      isActive: boolean;
      lastLogin?: string;
      permissions: string[];
    }>;
    pagination: PaginationInfo;
  }>;

  export type GetSystemStatsResponse = ApiSuccessResponse<{
    stats: {
      totalUsers: number;
      totalNews: number;
      totalComments: number;
      totalViews: number;
      storageUsed: number;
      serverHealth: {
        cpu: number;
        memory: number;
        disk: number;
        uptime: number;
      };
    };
    trends: Record<string, Array<{ date: string; value: number }>>;
  }>;
}

// Sitemap API types
export namespace SitemapApi {
  export interface GenerateSitemapRequest {
    types?: ('news' | 'categories' | 'static')[];
    includeImages?: boolean;
    compress?: boolean;
  }

  export type GenerateSitemapResponse = ApiSuccessResponse<{
    files: string[];
    totalUrls: number;
    generatedAt: string;
  }>;
}

// Health Check API types
export namespace HealthApi {
  export type HealthCheckResponse = ApiSuccessResponse<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    checks: Record<string, {
      status: 'pass' | 'fail';
      time?: string;
      message?: string;
    }>;
  }>;
}

// Generic API client interface
export interface ApiClient {
  // News endpoints
  getNewsList(query?: NewsApi.GetNewsListQuery): Promise<NewsApi.GetNewsListResponse>;
  getNews(id: string, query?: NewsApi.GetNewsQuery): Promise<NewsApi.GetNewsResponse>;
  createNews(data: NewsApi.CreateNewsRequest): Promise<NewsApi.CreateNewsResponse>;
  updateNews(id: string, data: NewsApi.UpdateNewsRequest): Promise<NewsApi.UpdateNewsResponse>;
  deleteNews(id: string): Promise<NewsApi.DeleteNewsResponse>;
  searchNews(query: NewsApi.SearchNewsQuery): Promise<NewsApi.SearchNewsResponse>;
  
  // Comments endpoints
  getComments(query?: CommentsApi.GetCommentsQuery): Promise<CommentsApi.GetCommentsResponse>;
  createComment(data: CommentsApi.CreateCommentRequest): Promise<CommentsApi.CreateCommentResponse>;
  updateComment(id: string, data: CommentsApi.UpdateCommentRequest): Promise<CommentsApi.UpdateCommentResponse>;
  deleteComment(id: string): Promise<CommentsApi.DeleteCommentResponse>;
  
  // Upload endpoints
  uploadFile(data: UploadApi.UploadFileRequest): Promise<UploadApi.UploadFileResponse>;
  uploadMultiple(data: UploadApi.UploadMultipleRequest): Promise<UploadApi.UploadMultipleResponse>;
  deleteFile(data: UploadApi.DeleteFileRequest): Promise<UploadApi.DeleteFileResponse>;
  
  // Analytics endpoints
  trackEvent(data: AnalyticsApi.TrackEventRequest): Promise<AnalyticsApi.TrackEventResponse>;
  trackPageView(data: AnalyticsApi.TrackPageViewRequest): Promise<AnalyticsApi.TrackPageViewResponse>;
  getAnalytics(query: AnalyticsApi.GetAnalyticsQuery): Promise<AnalyticsApi.GetAnalyticsResponse>;
  
  // Search endpoints
  search(query: SearchApi.SearchQuery): Promise<SearchApi.SearchResponse>;
  getSearchSuggestions(query: SearchApi.SearchSuggestionsQuery): Promise<SearchApi.SearchSuggestionsResponse>;
  
  // Health check
  healthCheck(): Promise<HealthApi.HealthCheckResponse>;
}

// API Error types
export interface ApiValidationError extends Omit<ApiErrorResponse, 'details'> {
  code: 'VALIDATION_ERROR';
  details: {
    field: string;
    message: string;
  }[];
}

export interface ApiNotFoundError extends ApiErrorResponse {
  code: 'NOT_FOUND';
  resource: string;
  id: string;
}

export interface ApiAuthError extends ApiErrorResponse {
  code: 'UNAUTHORIZED' | 'FORBIDDEN';
  required_permissions?: string[];
}

export interface ApiRateLimitError extends ApiErrorResponse {
  code: 'RATE_LIMIT_EXCEEDED';
  details: {
    limit: number;
    remaining: number;
    resetTime: number;
  };
}

// Type guards for API responses
export const isApiSuccessResponse = <T>(response: ApiResponseType<T>): response is ApiSuccessResponse<T> => {
  return response.success === true;
};

export const isApiErrorResponse = (response: ApiResponseType): response is ApiErrorResponse => {
  return response.success === false;
};

export const isValidationError = (response: ApiResponseType): response is ApiValidationError => {
  return isApiErrorResponse(response) && response.code === 'VALIDATION_ERROR' && Array.isArray((response as any).details);
};

export const isNotFoundError = (response: ApiResponseType): response is ApiNotFoundError => {
  return isApiErrorResponse(response) && response.code === 'NOT_FOUND';
};

export const isAuthError = (response: ApiResponseType): response is ApiAuthError => {
  return isApiErrorResponse(response) && (response.code === 'UNAUTHORIZED' || response.code === 'FORBIDDEN');
};

export const isRateLimitError = (response: ApiResponseType): response is ApiRateLimitError => {
  return isApiErrorResponse(response) && response.code === 'RATE_LIMIT_EXCEEDED';
};