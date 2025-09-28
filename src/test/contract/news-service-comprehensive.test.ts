/**
 * Contract Test: GET /api/news - Comprehensive TDD Validation  
 * 
 * This test demonstrates complete TDD cycle: RED → GREEN → REFACTOR
 * Tests the API contract thoroughly using actual API handler function.
 */

import { createMocks } from 'node-mocks-http'
import handler, { NewsApiResponse } from '../../pages/api/news'

describe('Contract Test: GET /api/news - Comprehensive', () => {
  
  it('should return complete API response structure', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1', limit: '20' }
    })

    await handler(req, res)

    const response: NewsApiResponse = JSON.parse(res._getData())

    // Validate complete response structure
    expect(response).toEqual({
      data: expect.any(Array),
      pagination: {
        total: expect.any(Number),
        page: 1,
        limit: 20,
        hasNext: expect.any(Boolean),
        hasPrev: expect.any(Boolean)
      },
      cache: {
        expires: expect.any(String),
        strategy: expect.stringMatching(/^(memory|redis|none)$/)
      },
      performance: {
        queryTimeMs: expect.any(Number),
        cacheHit: expect.any(Boolean),
        totalItems: expect.any(Number)
      }
    })

    expect(res._getStatusCode()).toBe(200)
  })

  it('should return valid news items with complete structure', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1', limit: '5' }
    })

    await handler(req, res)

    const response: NewsApiResponse = JSON.parse(res._getData())
    
    // Should have news items
    expect(response.data).toHaveLength(1)
    
    // Validate news item structure
    const newsItem = response.data[0]
    expect(newsItem).toMatchObject({
      id: expect.any(String),
      caption: expect.any(String),
      content: expect.any(String),
      category: expect.stringMatching(/^(Trabzonspor|Transfer|General|Football)$/),
      type: expect.stringMatching(/^(news|headline|subNews)$/),
      slug: expect.any(String),
      imgPath: expect.any(String),
      createDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
      expressDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
      isActive: expect.any(Boolean),
      priority: expect.any(Number)
    })
  })

  it('should handle pagination parameters correctly', async () => {
    const { req, res } = createMocks({
      method: 'GET', 
      query: { page: '2', limit: '10' }
    })

    await handler(req, res)

    const response: NewsApiResponse = JSON.parse(res._getData())

    expect(response.pagination).toEqual({
      total: expect.any(Number),
      page: 2,
      limit: 10,
      hasNext: expect.any(Boolean),
      hasPrev: true // Page 2 should have previous
    })
  })

  it('should filter by category when provided', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { category: 'trabzonspor' }
    })

    await handler(req, res)

    const response: NewsApiResponse = JSON.parse(res._getData())
    
    // All returned news should match the category filter
    response.data.forEach(item => {
      expect(item.category.toLowerCase()).toBe('trabzonspor')
    })
  })

  it('should filter by type when provided', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { type: 'news' }
    })

    await handler(req, res)

    const response: NewsApiResponse = JSON.parse(res._getData())
    
    // All returned news should match the type filter
    response.data.forEach(item => {
      expect(item.type.toLowerCase()).toBe('news')
    })
  })

  it('should return 405 for non-GET methods', async () => {
    const { req, res } = createMocks({
      method: 'POST'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    })
  })

  it('should include performance metrics', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1', limit: '20' }
    })

    const startTime = Date.now()
    await handler(req, res)
    const endTime = Date.now()

    const response: NewsApiResponse = JSON.parse(res._getData())

    // Performance should be tracked
    expect(response.performance.queryTimeMs).toBeGreaterThanOrEqual(0)
    expect(response.performance.queryTimeMs).toBeLessThan(endTime - startTime + 100) // Some tolerance
    expect(response.performance.totalItems).toBe(response.data.length)
    expect(typeof response.performance.cacheHit).toBe('boolean')
  })

  it('should include cache information', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1', limit: '20' }
    })

    await handler(req, res)

    const response: NewsApiResponse = JSON.parse(res._getData())

    // Cache info should be present
    expect(response.cache.expires).toBeTruthy()
    expect(new Date(response.cache.expires)).toBeInstanceOf(Date)
    expect(['memory', 'redis', 'none']).toContain(response.cache.strategy)

    // Response should include cache headers
    expect(res._getHeaders()['cache-control']).toBeDefined()
    expect(res._getHeaders()['x-api-cache']).toBeDefined()
  })

  it('should handle default pagination values', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {} // No pagination params
    })

    await handler(req, res)

    const response: NewsApiResponse = JSON.parse(res._getData())

    // Should use default values
    expect(response.pagination.page).toBe(1)
    expect(response.pagination.limit).toBe(20)
  })

  it('should validate response time performance', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1', limit: '20' }
    })

    const startTime = Date.now()
    await handler(req, res)
    const totalTime = Date.now() - startTime

    const response: NewsApiResponse = JSON.parse(res._getData())

    // API should respond quickly (under 100ms for mock data)
    expect(totalTime).toBeLessThan(100)
    expect(response.performance.queryTimeMs).toBeLessThan(100)
  })
});