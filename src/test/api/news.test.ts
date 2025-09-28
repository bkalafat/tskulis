/**
 * API Tests for TS Kulis
 * Testing API endpoints and data operations
 */

import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/news/[...params]';
import { createMockNews, mockDate } from '../utils/testUtils';

// Mock MongoDB connection
jest.mock('../../lib/mongodb', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({
    db: {
      collection: jest.fn().mockReturnValue({
        find: jest.fn(),
        findOne: jest.fn(),
        insertOne: jest.fn(),
        updateOne: jest.fn(),
        deleteOne: jest.fn(),
        aggregate: jest.fn(),
        countDocuments: jest.fn()
      })
    }
  })
}));

describe('/api/news API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/news', () => {
    test('returns list of news', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/news'
      });

      const mockNews = [
        createMockNews({ id: '1' }),
        createMockNews({ id: '2' })
      ];

      // Mock database response
      const { connectToDatabase } = require('../../lib/mongodb');
      const mockDb = await connectToDatabase();
      mockDb.db.collection().find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockNews),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis()
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveLength(2);
      expect(data[0].id).toBe('1');
    });

    test('handles pagination parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/news?page=2&limit=10'
      });

      const { connectToDatabase } = require('../../lib/mongodb');
      const mockDb = await connectToDatabase();
      const mockFind = {
        toArray: jest.fn().mockResolvedValue([]),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis()
      };
      mockDb.db.collection().find.mockReturnValue(mockFind);

      await handler(req, res);

      expect(mockFind.limit).toHaveBeenCalledWith(10);
      expect(mockFind.skip).toHaveBeenCalledWith(10); // (page-1) * limit
    });

    test('filters by category', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/news?category=Trabzonspor'
      });

      const { connectToDatabase } = require('../../lib/mongodb');
      const mockDb = await connectToDatabase();
      const mockFind = {
        toArray: jest.fn().mockResolvedValue([]),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis()
      };
      mockDb.db.collection().find.mockReturnValue(mockFind);

      await handler(req, res);

      expect(mockDb.db.collection().find).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Trabzonspor' })
      );
    });

    test('handles search query', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/news?search=test'
      });

      const { connectToDatabase } = require('../../lib/mongodb');
      const mockDb = await connectToDatabase();
      const mockFind = {
        toArray: jest.fn().mockResolvedValue([]),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis()
      };
      mockDb.db.collection().find.mockReturnValue(mockFind);

      await handler(req, res);

      expect(mockDb.db.collection().find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { caption: { $regex: 'test', $options: 'i' } },
            { content: { $regex: 'test', $options: 'i' } }
          ])
        })
      );
    });
  });

  describe('GET /api/news/[id]', () => {
    test('returns single news item', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/news/test-id-1'
      });

      const mockNews = createMockNews({ id: 'test-id-1' });

      const { connectToDatabase } = require('../../lib/mongodb');
      const mockDb = await connectToDatabase();
      mockDb.db.collection().findOne.mockResolvedValue(mockNews);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.id).toBe('test-id-1');
    });

    test('returns 404 for non-existent news', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/news/non-existent'
      });

      const { connectToDatabase } = require('../../lib/mongodb');
      const mockDb = await connectToDatabase();
      mockDb.db.collection().findOne.mockResolvedValue(null);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.message).toBe('News not found');
    });

    test('increments view count', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/news/test-id-1'
      });

      const mockNews = createMockNews({ id: 'test-id-1', viewCount: 10 });

      const { connectToDatabase } = require('../../lib/mongodb');
      const mockDb = await connectToDatabase();
      mockDb.db.collection().findOne.mockResolvedValue(mockNews);
      mockDb.db.collection().updateOne.mockResolvedValue({ modifiedCount: 1 });

      await handler(req, res);

      expect(mockDb.db.collection().updateOne).toHaveBeenCalledWith(
        { id: 'test-id-1' },
        { $inc: { viewCount: 1 } }
      );
    });
  });

  describe('POST /api/news', () => {
    test('creates new news item', async () => {
      const newNews = {
        caption: 'New Test News',
        content: 'Test content',
        category: 'Trabzonspor'
      };

      const { req, res } = createMocks({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: newNews
      });

      const { connectToDatabase } = require('../../lib/mongodb');
      const mockDb = await connectToDatabase();
      mockDb.db.collection().insertOne.mockResolvedValue({
        insertedId: 'new-id',
        acknowledged: true
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(mockDb.db.collection().insertOne).toHaveBeenCalledWith(
        expect.objectContaining(newNews)
      );
    });

    test('validates required fields', async () => {
      const invalidNews = {
        caption: '', // Empty caption
        content: 'Test content'
      };

      const { req, res } = createMocks({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: invalidNews
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.message).toContain('Caption is required');
    });

    test('generates slug automatically', async () => {
      const newNews = {
        caption: 'Trabzonspor Maçı Kazandı!',
        content: 'Great victory',
        category: 'Trabzonspor'
      };

      const { req, res } = createMocks({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: newNews
      });

      const { connectToDatabase } = require('../../lib/mongodb');
      const mockDb = await connectToDatabase();
      mockDb.db.collection().insertOne.mockResolvedValue({
        insertedId: 'new-id',
        acknowledged: true
      });

      await handler(req, res);

      expect(mockDb.db.collection().insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'trabzonspor-maci-kazandi'
        })
      );
    });
  });

  describe('PUT /api/news/[id]', () => {
    test('updates existing news item', async () => {
      const updatedNews = {
        caption: 'Updated News Title',
        content: 'Updated content'
      };

      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/news/test-id-1',
        headers: { 'Content-Type': 'application/json' },
        body: updatedNews
      });

      const { connectToDatabase } = require('../../lib/mongodb');
      const mockDb = await connectToDatabase();
      mockDb.db.collection().updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockDb.db.collection().updateOne).toHaveBeenCalledWith(
        { id: 'test-id-1' },
        {
          $set: expect.objectContaining({
            ...updatedNews,
            updateDate: expect.any(String)
          })
        }
      );
    });

    test('returns 404 for non-existent news', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/news/non-existent',
        headers: { 'Content-Type': 'application/json' },
        body: { caption: 'Updated' }
      });

      const { connectToDatabase } = require('../../lib/mongodb');
      const mockDb = await connectToDatabase();
      mockDb.db.collection().updateOne.mockResolvedValue({
        matchedCount: 0,
        modifiedCount: 0
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
    });
  });

  describe('DELETE /api/news/[id]', () => {
    test('deletes news item', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/news/test-id-1'
      });

      const { connectToDatabase } = require('../../lib/mongodb');
      const mockDb = await connectToDatabase();
      mockDb.db.collection().deleteOne.mockResolvedValue({
        deletedCount: 1
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockDb.db.collection().deleteOne).toHaveBeenCalledWith({
        id: 'test-id-1'
      });
    });

    test('returns 404 for non-existent news', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/news/non-existent'
      });

      const { connectToDatabase } = require('../../lib/mongodb');
      const mockDb = await connectToDatabase();
      mockDb.db.collection().deleteOne.mockResolvedValue({
        deletedCount: 0
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
    });
  });

  describe('Error Handling', () => {
    test('handles database connection errors', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/news'
      });

      const { connectToDatabase } = require('../../lib/mongodb');
      connectToDatabase.mockRejectedValue(new Error('Database connection failed'));

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.message).toBe('Internal server error');
    });

    test('handles invalid JSON in POST requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    test('handles unsupported HTTP methods', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        url: '/api/news'
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.message).toBe('Method not allowed');
    });
  });

  describe('Performance & Caching', () => {
    test('sets appropriate cache headers for GET requests', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/news'
      });

      const { connectToDatabase } = require('../../lib/mongodb');
      const mockDb = await connectToDatabase();
      mockDb.db.collection().find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis()
      });

      await handler(req, res);

      expect(res.getHeader('Cache-Control')).toBe('public, s-maxage=60, stale-while-revalidate');
    });

    test('implements request rate limiting', async () => {
      // Mock multiple requests in quick succession
      const requests = Array.from({ length: 10 }, (_, i) => {
        const { req, res } = createMocks({
          method: 'GET',
          url: `/api/news/test-${i}`,
          headers: { 'x-forwarded-for': '127.0.0.1' }
        });
        return { req, res };
      });

      const { connectToDatabase } = require('../../lib/mongodb');
      const mockDb = await connectToDatabase();
      mockDb.db.collection().findOne.mockResolvedValue(createMockNews());

      // Execute all requests
      const results = await Promise.all(
        requests.map(({ req, res }) => handler(req, res).then(() => res._getStatusCode()))
      );

      // Some requests should be rate limited (429)
      expect(results.filter(status => status === 429).length).toBeGreaterThan(0);
    });
  });
});