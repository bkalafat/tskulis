import { NextApiRequest, NextApiResponse } from 'next'
import { NewsType } from '../../../types/NewsType'
import { CATEGORY, TYPE } from '../../../utils/enum'

/**
 * Individual News Article Response Interface
 */
export interface NewsArticleResponse {
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

/**
 * Error Response Interface
 */
interface ErrorResponse {
  error: string
  details?: string
}

/**
 * GET /api/news/[id] - Individual News Article Endpoint
 * 
 * TDD GREEN Phase Implementation
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NewsArticleResponse | ErrorResponse>
) {
  const startTime = Date.now()

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    // Validate ID format (MongoDB ObjectId format)
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: 'Invalid ID format',
        details: 'ID must be provided as a string'
      })
    }

    // Validate MongoDB ObjectId format (24 character hex string)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    if (!objectIdRegex.test(id)) {
      return res.status(400).json({
        error: 'Invalid ID format',
        details: 'ID must be a valid MongoDB ObjectId (24 character hex string)'
      })
    }

    // Mock article data for TDD GREEN phase
    const mockArticle: NewsType = {
      id: '66f0e8f5c8b4a1234567890a',
      category: CATEGORY.TRABZONSPOR,
      type: TYPE.NEWS,
      caption: 'Detailed Test News Article for Individual Retrieval',
      summary: 'This is a comprehensive test article to validate individual news retrieval API',
      imgPath: '/images/test-article-detail.jpg',
      imgAlt: 'Test article detail image',
      content: `<p>This is the full content of our test article. It contains multiple paragraphs to demonstrate proper content rendering and reading time calculation.</p>
        <p>The article covers various aspects of news content management and API contract testing. This helps validate our implementation thoroughly.</p>
        <p>Additional content is provided here to ensure we have sufficient text for reading time calculations and word count analysis.</p>`,
      subjects: ['test', 'api', 'contract', 'individual-article'],
      authors: ['Test Author', 'Contract Validator'],
      createDate: '2025-09-28T20:30:00.000Z',
      updateDate: '2025-09-28T20:35:00.000Z',
      expressDate: '2025-09-28T20:30:00.000Z',
      priority: 1,
      isActive: true,
      isSecondPageNews: false,
      showNotification: false,
      slug: 'detailed-test-news-article-individual-retrieval',
      url: '/trabzonspor/detailed-test-news-article-individual-retrieval',
      keywords: 'test,api,contract,individual,article',
      socialTags: 'test news individual article api',
      viewCount: 25
    }

    // Check if the requested ID matches our mock article
    const articleExists = id === mockArticle.id

    if (!articleExists) {
      // Performance tracking for not found
      const queryTimeMs = Date.now() - startTime

      const notFoundResponse = {
        data: null,
        found: false,
        error: 'News article not found',
        cache: {
          expires: new Date(Date.now() + 30000).toISOString(), // 30 seconds cache for 404
          strategy: 'memory' as const
        },
        performance: {
          queryTimeMs,
          cacheHit: false
        }
      }

      // Set cache headers for 404 responses
      res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30')
      res.setHeader('X-API-Cache', 'MISS')
      
      return res.status(404).json(notFoundResponse)
    }

    // Calculate reading time and word count
    const htmlContent = mockArticle.content || ''
    const textContent = htmlContent.replace(/<[^>]*>/g, '') // Strip HTML tags
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length
    const readingTime = Math.max(1, Math.ceil(wordCount / 200)) // Average 200 words per minute
    const readingTimeText = readingTime === 1 ? '1 minute read' : `${readingTime} minutes read`

    // Mock related articles
    const relatedArticles: NewsType[] = [
      {
        ...mockArticle,
        id: '66f0e8f5c8b4a1234567890b',
        caption: 'Related Test Article 1',
        slug: 'related-test-article-1'
      },
      {
        ...mockArticle,
        id: '66f0e8f5c8b4a1234567890c',
        caption: 'Related Test Article 2', 
        category: CATEGORY.TRANSFER,
        slug: 'related-test-article-2'
      }
    ]

    // Performance tracking
    const queryTimeMs = Date.now() - startTime

    // Successful response
    const response: NewsArticleResponse = {
      data: mockArticle,
      found: true,
      cache: {
        expires: new Date(Date.now() + 300000).toISOString(), // 5 minutes cache for articles
        strategy: 'memory'
      },
      performance: {
        queryTimeMs,
        cacheHit: false
      },
      related: relatedArticles.slice(0, 2), // Return 2 related articles
      metadata: {
        readingTime: readingTimeText,
        wordCount,
        lastModified: mockArticle.updateDate
      }
    }

    // Set cache headers for successful responses (longer cache time for articles)
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300')
    res.setHeader('X-API-Cache', 'MISS')
    res.setHeader('Last-Modified', new Date(mockArticle.updateDate).toUTCString())

    return res.status(200).json(response)

  } catch (error) {
    console.error('API Error:', error)
    
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
}