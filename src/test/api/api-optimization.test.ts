/**
 * API Optimization System Tests
 */

import { OptimizedAPIClient } from '../../lib/api/client';
import { NewsAPIClient } from '../../lib/api/integration';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('OptimizedAPIClient', () => {
  let client: OptimizedAPIClient;

  beforeEach(() => {
    client = new OptimizedAPIClient();
    mockFetch.mockClear();
  });

  describe('Basic HTTP Operations', () => {
    it('should make GET requests', async () => {
      const mockData = { message: 'Hello World' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers()
      } as Response);

      const response = await client.get<typeof mockData>('/test');
      
      expect(mockFetch).toHaveBeenCalledWith('/test', expect.objectContaining({
        method: 'GET'
      }));
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
    });

    it('should make POST requests', async () => {
      const postData = { name: 'Test' };
      const responseData = { id: 1, ...postData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => responseData,
        headers: new Headers()
      } as Response);

      const response = await client.post<typeof responseData>('/test', postData);
      
      expect(mockFetch).toHaveBeenCalledWith('/test', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(postData)
      }));
      expect(response.status).toBe(201);
      expect(response.data).toEqual(responseData);
    });

    it('should handle 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not found' }),
        headers: new Headers()
      } as Response);

      const response = await client.get('/nonexistent');
      
      expect(response.status).toBe(404);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await client.get('/test');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Caching', () => {
    it('should cache successful responses', async () => {
      const mockData = { cached: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers()
      } as Response);

      // First request - should hit network
      const response1 = await client.get('/cached');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response1.data).toEqual(mockData);

      // Second request - should hit cache
      const response2 = await client.get('/cached');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1, not 2
      expect(response2.data).toEqual(mockData);
    });

    it('should respect cache TTL', (done) => {
      const mockData = { ttl: true };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers()
      } as Response);

      // First request
      client.get('/ttl').then(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);

        // Wait for TTL to expire (default is very short for testing)
        setTimeout(async () => {
          await client.get('/ttl');
          expect(mockFetch).toHaveBeenCalledTimes(2);
          done();
        }, 100);
      });
    });

    it('should invalidate cache', async () => {
      const mockData = { invalidate: true };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers()
      } as Response);

      // First request - cache miss
      await client.get('/invalidate');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second request - cache hit
      await client.get('/invalidate');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Invalidate cache
      await client.invalidateCache('/invalidate');

      // Third request - cache miss again
      await client.get('/invalidate');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      // Mock first call to fail, second to succeed
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ retry: true }),
          headers: new Headers()
        } as Response);

      const response = await client.get('/retry');
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ retry: true });
    });

    it('should give up after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent error'));

      try {
        await client.get('/fail');
        fail('Should have thrown an error');
      } catch (error) {
        // Should try initial request + 3 retries = 4 total
        expect(mockFetch).toHaveBeenCalledTimes(4);
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Request Deduplication', () => {
    it('should deduplicate identical requests', async () => {
      const mockData = { deduped: true };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers()
      } as Response);

      // Make multiple simultaneous requests
      const promises = [
        client.get('/dedupe'),
        client.get('/dedupe'),
        client.get('/dedupe')
      ];

      const results = await Promise.all(promises);
      
      // Should only make one network request
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // All should have the same data
      results.forEach(result => {
        expect(result.data).toEqual(mockData);
      });
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long requests', async () => {
      // Mock a request that takes too long
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 20000)) // 20 seconds
      );

      try {
        await client.get('/timeout', { timeout: 1000 }); // 1 second timeout
        fail('Should have thrown timeout error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toContain('timeout');
        }
      }
    });
  });
});

describe('NewsAPIClient', () => {
  let client: NewsAPIClient;

  beforeEach(() => {
    client = NewsAPIClient.getInstance();
    mockFetch.mockClear();
  });

  describe('News Operations', () => {
    it('should get all news', async () => {
      const mockNews = [
        { _id: '1', caption: 'News 1', category: 'trabzonspor' },
        { _id: '2', caption: 'News 2', category: 'transfer' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockNews,
        headers: new Headers()
      } as Response);

      const news = await client.getAllNews();
      
      expect(mockFetch).toHaveBeenCalledWith('/news', expect.any(Object));
      expect(news).toEqual(mockNews);
    });

    it('should get news by category', async () => {
      const category = 'trabzonspor';
      const mockNews = [
        { _id: '1', caption: 'News 1', category }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockNews,
        headers: new Headers()
      } as Response);

      const news = await client.getNewsByCategory(category);
      
      expect(mockFetch).toHaveBeenCalledWith(`/news/category/${category}`, expect.any(Object));
      expect(news).toEqual(mockNews);
    });

    it('should create news', async () => {
      const newsData = { caption: 'New News', category: 'trabzonspor' };
      const createdNews = { _id: '123', ...newsData };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => createdNews,
        headers: new Headers()
      } as Response);

      const news = await client.createNews(newsData);
      
      expect(mockFetch).toHaveBeenCalledWith('/news', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newsData)
      }));
      expect(news).toEqual(createdNews);
    });

    it('should update news', async () => {
      const id = '123';
      const updateData = { caption: 'Updated News' };
      const updatedNews = { _id: id, ...updateData };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updatedNews,
        headers: new Headers()
      } as Response);

      const news = await client.updateNews(id, updateData);
      
      expect(mockFetch).toHaveBeenCalledWith(`/news/${id}`, expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updateData)
      }));
      expect(news).toEqual(updatedNews);
    });

    it('should delete news', async () => {
      const id = '123';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
        headers: new Headers()
      } as Response);

      await client.deleteNews(id);
      
      expect(mockFetch).toHaveBeenCalledWith(`/news/${id}`, expect.objectContaining({
        method: 'DELETE'
      }));
    });
  });

  describe('Comment Operations', () => {
    it('should get comments for news', async () => {
      const newsId = '123';
      const mockComments = [
        { _id: '1', newsId, comment: 'Great news!' },
        { _id: '2', newsId, comment: 'Amazing!' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockComments,
        headers: new Headers()
      } as Response);

      const comments = await client.getComments(newsId);
      
      expect(mockFetch).toHaveBeenCalledWith(`/comments/${newsId}`, expect.any(Object));
      expect(comments).toEqual(mockComments);
    });

    it('should add comment', async () => {
      const commentData = { newsId: '123', comment: 'Test comment' };
      const createdComment = { _id: '456', ...commentData };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => createdComment,
        headers: new Headers()
      } as Response);

      const comment = await client.addComment(commentData);
      
      expect(mockFetch).toHaveBeenCalledWith('/comments', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(commentData)
      }));
      expect(comment).toEqual(createdComment);
    });
  });

  describe('Search and Discovery', () => {
    it('should search news', async () => {
      const query = 'Trabzonspor';
      const mockResults = [
        { _id: '1', caption: 'Trabzonspor News' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResults,
        headers: new Headers()
      } as Response);

      const results = await client.searchNews(query);
      
      expect(mockFetch).toHaveBeenCalledWith(`/news/search?q=${query}`, expect.any(Object));
      expect(results).toEqual(mockResults);
    });

    it('should get popular news', async () => {
      const limit = 5;
      const mockPopular = [
        { _id: '1', caption: 'Popular News 1' },
        { _id: '2', caption: 'Popular News 2' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPopular,
        headers: new Headers()
      } as Response);

      const popular = await client.getPopularNews(limit);
      
      expect(mockFetch).toHaveBeenCalledWith(`/news/popular?limit=${limit}`, expect.any(Object));
      expect(popular).toEqual(mockPopular);
    });
  });

  describe('File Upload', () => {
    it('should upload file', async () => {
      // Create a mock File object
      const fileContent = 'test image content';
      const file = new File([fileContent], 'test.jpg', { type: 'image/jpeg' });
      const uploadResult = { url: 'https://example.com/test.jpg', path: '/uploads/test.jpg' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => uploadResult,
        headers: new Headers()
      } as Response);

      const result = await client.uploadFile(file);
      
      expect(mockFetch).toHaveBeenCalledWith('/upload', expect.objectContaining({
        method: 'POST'
        // FormData body will be checked differently
      }));
      expect(result).toEqual(uploadResult);
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch updates', async () => {
      const updates = [
        { id: '1', data: { caption: 'Updated 1' } },
        { id: '2', data: { caption: 'Updated 2' } }
      ];

      // Mock successful responses for both updates
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ _id: '1', caption: 'Updated 1' }),
          headers: new Headers()
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ _id: '2', caption: 'Updated 2' }),
          headers: new Headers()
        } as Response);

      const results = await client.batchUpdateNews(updates);
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
    });

    it('should handle partial failures in batch operations', async () => {
      const updates = [
        { id: '1', data: { caption: 'Updated 1' } },
        { id: '2', data: { caption: 'Updated 2' } }
      ];

      // Mock one success, one failure
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ _id: '1', caption: 'Updated 1' }),
          headers: new Headers()
        } as Response)
        .mockRejectedValueOnce(new Error('Update failed'));

      const results = await client.batchUpdateNews(updates);
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(1); // Only successful update
    });
  });

  describe('Cache Integration', () => {
    it('should invalidate related caches on update', async () => {
      const id = '123';
      const category = 'trabzonspor';
      const updateData = { caption: 'Updated News', category };
      const updatedNews = { _id: id, ...updateData };

      // Mock cache response first (to populate cache)
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => updatedNews,
        headers: new Headers()
      } as Response);

      // Get news to populate cache
      await client.getNewsById(id);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Update news - should invalidate cache
      await client.updateNews(id, updateData);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Get news again - should hit network (cache invalidated)
      await client.getNewsById(id);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should invalidate cache on delete', async () => {
      const id = '123';

      // Mock responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ _id: id, caption: 'News' }),
          headers: new Headers()
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
          json: async () => ({}),
          headers: new Headers()
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ _id: id, caption: 'News' }),
          headers: new Headers()
        } as Response);

      // Get news to populate cache
      await client.getNewsById(id);
      
      // Delete news - should invalidate cache
      await client.deleteNews(id);
      
      // Get news again - should hit network (cache invalidated)
      await client.getNewsById(id);
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});