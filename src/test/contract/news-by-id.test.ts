/**
 * Contract Test: GET /api/news/[id] - Individual News Article
 * 
 * TDD GREEN Phase: These tests now call the actual API endpoint
 * and should pass after implementation.
 */

import { createMocks } from 'node-mocks-http'
import handler from '../../pages/api/news/[id]'
import { NewsType } from '../../types/NewsType'

// Individual news article response interface
interface NewsArticleResponse {
  data: NewsType | null
  found: boolean
  cache: {
    expires: string
    strategy: 'memory' | 'redis' | 'none'
  }
  performance: {
    queryTimeMs: number
    cacheHit: boolean
  }
  related?: NewsType[]
  metadata: {
    readingTime: string
    wordCount: number
    lastModified: string
  }
}

describe('Contract Test: GET /api/news/[id] - TDD GREEN Phase', () => {
  
  it('should return complete article for valid ID', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '66f0e8f5c8b4a1234567890a' } // Valid test ID
    })

    await handler(req, res)
    
    const response: NewsArticleResponse = JSON.parse(res._getData())

    const expectedResponse = {
      data: expect.objectContaining({
        id: expect.any(String),
        caption: expect.any(String),
        content: expect.any(String),
        category: expect.stringMatching(/^(Trabzonspor|Transfer|General|Football)$/),
        type: expect.stringMatching(/^(news|headline|subNews)$/),
        slug: expect.any(String),
        imgPath: expect.any(String),
        createDate: expect.any(String),
        isActive: true
      }),
      found: true,
      cache: expect.objectContaining({
        expires: expect.any(String),
        strategy: expect.stringMatching(/^(memory|redis|none)$/)
      }),
      performance: expect.objectContaining({
        queryTimeMs: expect.any(Number),
        cacheHit: expect.any(Boolean)
      }),
      metadata: expect.objectContaining({
        readingTime: expect.any(String),
        wordCount: expect.any(Number),
        lastModified: expect.any(String)
      })
    }

    expect(response).toEqual(expect.objectContaining(expectedResponse))
    expect(res._getStatusCode()).toBe(200)
  })

  it('should return 404 for non-existent ID', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '66f0e8f5c8b4a1234567890b' } // Non-existent ID
    })

    await handler(req, res)
    
    const response = JSON.parse(res._getData())

    expect(response).toMatchObject({
      data: null,
      found: false,
      error: 'News article not found',
      cache: expect.objectContaining({
        expires: expect.any(String),
        strategy: expect.stringMatching(/^(memory|redis|none)$/)
      }),
      performance: expect.objectContaining({
        queryTimeMs: expect.any(Number),
        cacheHit: false
      })
    })

    expect(res._getStatusCode()).toBe(404)
  })

  it('should return 400 for invalid ID format', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: 'invalid-id' } // Invalid format
    })

    await handler(req, res)
    
    const response = JSON.parse(res._getData())

    expect(response).toEqual({
      error: 'Invalid ID format',
      details: 'ID must be a valid MongoDB ObjectId (24 character hex string)'
    })

    expect(res._getStatusCode()).toBe(400)
  })

  it('should include related articles for valid article', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '66f0e8f5c8b4a1234567890a' }
    })

    await handler(req, res)
    
    const response: NewsArticleResponse = JSON.parse(res._getData())

    expect(response.found).toBe(true)
    expect(response.related).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          caption: expect.any(String),
          category: expect.any(String)
        })
      ])
    )
    expect(response.related?.length).toBeGreaterThan(0)
  })

  it('should calculate reading time and word count', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '66f0e8f5c8b4a1234567890a' }
    })

    await handler(req, res)
    
    const response: NewsArticleResponse = JSON.parse(res._getData())

    expect(response.metadata.readingTime).toMatch(/^\d+\s(minute|minutes)\sread$/)
    expect(response.metadata.wordCount).toBeGreaterThan(0)
    expect(response.metadata.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
  })

  it('should handle performance tracking for individual articles', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '66f0e8f5c8b4a1234567890a' }
    })

    await handler(req, res)
    
    const response: NewsArticleResponse = JSON.parse(res._getData())

    expect(response.performance.queryTimeMs).toBeGreaterThanOrEqual(0)
    expect(typeof response.performance.cacheHit).toBe('boolean')
  })

  it('should return 405 for non-GET methods', async () => {
    const { req, res } = createMocks({
      method: 'POST', // Wrong method
      query: { id: '66f0e8f5c8b4a1234567890a' }
    })

    await handler(req, res)
    
    const response = JSON.parse(res._getData())

    expect(response).toEqual({
      error: 'Method not allowed'
    })
    expect(res._getStatusCode()).toBe(405)
  })

  it('should include cache headers for article responses', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '66f0e8f5c8b4a1234567890a' }
    })

    await handler(req, res)

    // Check cache headers are set
    const headers = res._getHeaders()
    expect(headers['cache-control']).toMatch(/public.*max-age=\d+/)
    expect(headers['x-api-cache']).toMatch(/^(HIT|MISS)$/)
  })

  it('should validate MongoDB ObjectId format', async () => {
    const invalidIds = [
      'invalid',
      '123',  
      'not-a-mongo-id',
      '66f0e8f5c8b4a123456789', // too short
      '66f0e8f5c8b4a1234567890a1', // too long
      'ggf0e8f5c8b4a1234567890a' // invalid characters
    ]

    for (const invalidId of invalidIds) {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: invalidId }
      })

      await handler(req, res)
      
      const response = JSON.parse(res._getData())
      
      expect(response.error).toBe('Invalid ID format')
      expect(res._getStatusCode()).toBe(400)
    }
  })

  it('should return appropriate response times for article lookup', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '66f0e8f5c8b4a1234567890a' }
    })

    const startTime = Date.now()
    await handler(req, res)
    const totalTime = Date.now() - startTime

    // Individual article lookup should be fast (under 50ms for mock data)
    expect(totalTime).toBeLessThan(50)
    
    const response: NewsArticleResponse = JSON.parse(res._getData())
    expect(response.performance.queryTimeMs).toBeLessThan(50)
  })
});