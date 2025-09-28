/**
 * API Integration Utilities
 * Integration helpers for existing API endpoints
 */

import { OptimizedAPIClient } from './client';
import { APIMiddleware } from './middleware';

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

/**
 * Enhanced API Client with News-specific methods
 */
export class NewsAPIClient extends OptimizedAPIClient {
  private static instance: NewsAPIClient;

  public static getInstance(): NewsAPIClient {
    if (!NewsAPIClient.instance) {
      NewsAPIClient.instance = new NewsAPIClient();
    }
    return NewsAPIClient.instance;
  }

  constructor() {
    super();
  }

  /**
   * Get all news with optimization
   */
  async getAllNews(): Promise<NewsType[]> {
    const response = await this.get<NewsType[]>('/news');
    return response.data;
  }

  /**
   * Get news by category with optimization
   */
  async getNewsByCategory(category: string): Promise<NewsType[]> {
    const response = await this.get<NewsType[]>(`/news/category/${category}`);
    return response.data;
  }

  /**
   * Get single news by ID with optimization
   */
  async getNewsById(id: string): Promise<NewsType> {
    const response = await this.get<NewsType>(`/news/${id}`);
    return response.data;
  }

  /**
   * Get news by slug with optimization
   */
  async getNewsBySlug(slug: string): Promise<NewsType> {
    const response = await this.get<NewsType>(`/news/slug/${slug}`);
    return response.data;
  }

  /**
   * Create news with cache invalidation
   */
  async createNews(news: Partial<NewsType>): Promise<NewsType> {
    const response = await this.post<NewsType>('/news', news);
    
    // Invalidate related caches
    await this.invalidateCache('all-news');
    if (news.category) {
      await this.invalidateCache(`news-category-${news.category}`);
    }
    
    return response.data;
  }

  /**
   * Update news with cache invalidation
   */
  async updateNews(id: string, news: Partial<NewsType>): Promise<NewsType> {
    const response = await this.put<NewsType>(`/news/${id}`, news);
    
    // Invalidate related caches
    await this.invalidateCache('all-news');
    await this.invalidateCache(`news-${id}`);
    if (news.slug) {
      await this.invalidateCache(`news-slug-${news.slug}`);
    }
    if (news.category) {
      await this.invalidateCache(`news-category-${news.category}`);
    }
    
    return response.data;
  }

  /**
   * Delete news with cache invalidation
   */
  async deleteNews(id: string, category?: string): Promise<void> {
    await this.delete(`/news/${id}`);
    
    // Invalidate related caches
    await this.invalidateCache('all-news');
    await this.invalidateCache(`news-${id}`);
    if (category) {
      await this.invalidateCache(`news-category-${category}`);
    }
  }

  /**
   * Get comments for news with optimization
   */
  async getComments(newsId: string): Promise<CommentType[]> {
    const response = await this.get<CommentType[]>(`/comments/${newsId}`);
    return response.data;
  }

  /**
   * Add comment with cache invalidation
   */
  async addComment(comment: Partial<CommentType>): Promise<CommentType> {
    const response = await this.post<CommentType>('/comments', comment);
    
    // Invalidate comments cache
    if (comment.newsId) {
      await this.invalidateCache(`comments-${comment.newsId}`);
    }
    
    return response.data;
  }

  /**
   * Search news with optimization
   */
  async searchNews(query: string, category?: string): Promise<NewsType[]> {
    const params = new URLSearchParams({ q: query });
    if (category) {
      params.append('category', category);
    }

    const response = await this.get<NewsType[]>(`/news/search?${params.toString()}`);
    return response.data;
  }

  /**
   * Get popular news with optimization
   */
  async getPopularNews(limit = 10): Promise<NewsType[]> {
    const response = await this.get<NewsType[]>(`/news/popular?limit=${limit}`);
    return response.data;
  }

  /**
   * Get related news with optimization
   */
  async getRelatedNews(newsId: string, limit = 5): Promise<NewsType[]> {
    const response = await this.get<NewsType[]>(`/news/${newsId}/related?limit=${limit}`);
    return response.data;
  }

  /**
   * Upload file with optimization
   */
  async uploadFile(file: File, type: 'image' | 'document' = 'image'): Promise<{ url: string; path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await this.post<{ url: string; path: string }>('/upload', formData, {
      timeout: 30000 // 30 seconds for file upload
    });
    return response.data;
  }

  /**
   * Batch operations for bulk updates
   */
  async batchUpdateNews(updates: Array<{ id: string; data: Partial<NewsType> }>): Promise<NewsType[]> {
    const results = await Promise.allSettled(
      updates.map(({ id, data }) => this.updateNews(id, data))
    );

    const successful = results
      .filter((result): result is PromiseFulfilledResult<NewsType> => result.status === 'fulfilled')
      .map(result => result.value);

    // Log failed updates
    const failed = results.filter(result => result.status === 'rejected');
    if (failed.length > 0) {
      console.warn(`${failed.length} batch updates failed:`, failed);
    }

    return successful;
  }

  /**
   * Preload news for faster navigation
   */
  async preloadNews(newsIds: string[]): Promise<void> {
    // Use lower priority for preloading
    const preloadPromises = newsIds.map(id =>
      this.getNewsById(id).catch(error => {
        console.warn(`Failed to preload news ${id}:`, error);
      })
    );

    await Promise.allSettled(preloadPromises);
  }
}

/**
 * API Hooks Integration
 */
export function useOptimizedAPI() {
  const client = NewsAPIClient.getInstance();

  return {
    client,
    getAllNews: () => client.getAllNews(),
    getNewsByCategory: (category: string) => client.getNewsByCategory(category),
    getNewsById: (id: string) => client.getNewsById(id),
    getNewsBySlug: (slug: string) => client.getNewsBySlug(slug),
    createNews: (news: Partial<NewsType>) => client.createNews(news),
    updateNews: (id: string, news: Partial<NewsType>) => client.updateNews(id, news),
    deleteNews: (id: string, category?: string) => client.deleteNews(id, category),
    getComments: (newsId: string) => client.getComments(newsId),
    addComment: (comment: Partial<CommentType>) => client.addComment(comment),
    searchNews: (query: string, category?: string) => client.searchNews(query, category),
    getPopularNews: (limit?: number) => client.getPopularNews(limit),
    getRelatedNews: (newsId: string, limit?: number) => client.getRelatedNews(newsId, limit),
    uploadFile: (file: File, type?: 'image' | 'document') => client.uploadFile(file, type),
    batchUpdateNews: (updates: Array<{ id: string; data: Partial<NewsType> }>) => client.batchUpdateNews(updates),
    preloadNews: (newsIds: string[]) => client.preloadNews(newsIds),
    
    // Cache management
    invalidateCache: (key: string) => client.invalidateCache(key)
  };
}

/**
 * Middleware setup for API routes
 */
export function setupAPIMiddleware() {
  const middleware = new APIMiddleware();
  return middleware;
}

/**
 * Legacy API compatibility wrapper
 */
export class LegacyAPIWrapper {
  private client: NewsAPIClient;

  constructor() {
    this.client = NewsAPIClient.getInstance();
  }

  /**
   * Original getAllNews function with optimization
   */
  getAllNews = () => this.client.getAllNews();

  /**
   * Original insertNews function with optimization
   */
  insertNews = (news: Partial<NewsType>) => this.client.createNews(news);

  /**
   * Original updateNews function with optimization
   */
  updateNews = (news: Partial<NewsType>) => {
    if (!news._id) throw new Error('News ID is required for update');
    return this.client.updateNews(news._id, news);
  };

  /**
   * Original deleteNews function with optimization
   */
  deleteNews = (id: string) => this.client.deleteNews(id);

  /**
   * Original upsertNews function with optimization
   */
  upsertNews = async (news: Partial<NewsType>) => {
    if (news._id) {
      return this.updateNews(news);
    } else {
      return this.insertNews(news);
    }
  };

  /**
   * Original getNewsByCategory function with optimization
   */
  getNewsByCategory = (category: string) => this.client.getNewsByCategory(category);

  /**
   * Original getNewsById function with optimization
   */
  getNewsById = (id: string) => this.client.getNewsById(id);

  /**
   * Original insertComment function with optimization
   */
  insertComment = (comment: Partial<CommentType>) => this.client.addComment(comment);

  /**
   * Original getCommentsByNewsId function with optimization
   */
  getCommentsByNewsId = (newsId: string) => this.client.getComments(newsId);
}

/**
 * Export optimized API client instance
 */
export const optimizedAPI = NewsAPIClient.getInstance();

/**
 * Export legacy wrapper for backward compatibility
 */
export const legacyAPI = new LegacyAPIWrapper();

/**
 * Default export
 */
export default {
  NewsAPIClient,
  optimizedAPI,
  legacyAPI,
  useOptimizedAPI,
  setupAPIMiddleware
};