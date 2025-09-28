# API Contract: News Service

**Endpoint**: `/api/news`  
**Purpose**: News article retrieval and management during modernization
**Version**: 2.0 (modernized)

## GET /api/news
**Purpose**: Retrieve all news articles with enhanced performance and caching

### Request
```http
GET /api/news?category=trabzonspor&type=news&limit=20&offset=0
Host: localhost:3001
Accept: application/json
Cache-Control: max-age=300
```

### Response (Success - 200)
```json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "caption": "Trabzonspor yeni transferini açıkladı",
      "content": "<p>Trabzonspor, yeni sezon hazırlıkları...</p>",
      "category": "trabzonspor",
      "type": "news",
      "slug": "trabzonspor-yeni-transferini-acikladi",
      "imgPath": "https://optimized-images.cdn.com/news/image.webp",
      "imgAlt": "Trabzonspor transfer haberi",
      "isActive": true,
      "createDate": "2025-09-28T10:00:00.000Z",
      "updateDate": "2025-09-28T10:00:00.000Z",
      "expressDate": "2025-09-28T10:00:00.000Z",
      "_metadata": {
        "imageOptimized": true,
        "seoScore": 95,
        "readingTime": "3 min"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "hasNext": true,
    "hasPrev": false
  },
  "cache": {
    "expires": "2025-09-28T10:05:00.000Z",
    "etag": "W/\"abc123\""
  }
}
```

### Response (Error - 400)
```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid category parameter",
    "details": {
      "category": "Must be one of: trabzonspor, transfer, futbol, gundem"
    }
  }
}
```

### Performance Requirements
- Response time: <100ms for cached content
- Response time: <500ms for database queries
- Cache duration: 5 minutes for published content
- Compression: Gzip enabled, reduces response size by 70%

---

## GET /api/news/:id
**Purpose**: Retrieve single news article with enhanced metadata

### Request
```http
GET /api/news/507f1f77bcf86cd799439011
Host: localhost:3001
Accept: application/json
```

### Response (Success - 200)
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "caption": "Trabzonspor yeni transferini açıkladı",
    "content": "<p>Trabzonspor, yeni sezon hazırlıkları kapsamında...</p>",
    "category": "trabzonspor",
    "type": "news", 
    "slug": "trabzonspor-yeni-transferini-acikladi",
    "imgPath": "https://optimized-images.cdn.com/news/image.webp",
    "imgAlt": "Trabzonspor transfer haberi",
    "isActive": true,
    "createDate": "2025-09-28T10:00:00.000Z",
    "updateDate": "2025-09-28T10:00:00.000Z",
    "expressDate": "2025-09-28T10:00:00.000Z",
    "_metadata": {
      "imageOptimized": true,
      "seoScore": 95,
      "readingTime": "3 min",
      "wordCount": 450,
      "relatedArticles": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
    }
  },
  "cache": {
    "expires": "2025-09-28T10:05:00.000Z",
    "etag": "W/\"xyz789\""
  }
}
```

### Response (Error - 404)
```json
{
  "error": {
    "code": "NEWS_NOT_FOUND",
    "message": "News article not found",
    "details": {
      "id": "507f1f77bcf86cd799439011"
    }
  }
}
```

---

## POST /api/news (Admin Only)
**Purpose**: Create new news article with enhanced validation

### Request
```http
POST /api/news
Host: localhost:3001
Content-Type: application/json
Authorization: Bearer jwt-token
```

```json
{
  "caption": "Trabzonspor yeni transferini açıkladı",
  "content": "<p>Trabzonspor, yeni sezon hazırlıkları...</p>",
  "category": "trabzonspor", 
  "type": "news",
  "imgPath": "temp/uploaded-image.jpg",
  "imgAlt": "Trabzonspor transfer haberi",
  "expressDate": "2025-09-28T10:00:00.000Z"
}
```

### Response (Success - 201)
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439014",
    "slug": "trabzonspor-yeni-transferini-acikladi-2",
    "status": "created",
    "_metadata": {
      "imageProcessed": true,
      "slugGenerated": true,
      "seoValidated": true
    }
  }
}
```

### Response (Error - 422)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid news data",
    "details": {
      "caption": "Caption must be between 10 and 200 characters",
      "content": "Content must be at least 100 characters",
      "imgAlt": "Image alt text is required for accessibility"
    }
  }
}
```

## Backward Compatibility

### Legacy Response Support
- All existing response formats maintained
- New `_metadata` field added (optional, ignored by old clients)
- Existing field names and types preserved exactly
- No breaking changes to existing integrations

### Migration Strategy
- Gradual rollout with feature flags
- A/B testing for performance improvements
- Monitoring of response times and error rates
- Automatic rollback if issues detected

## Security Enhancements

### Authentication
- JWT tokens with shorter expiration times
- Rate limiting: 1000 requests/hour per IP
- CORS headers properly configured
- Input sanitization and validation

### Data Protection
- Sensitive fields never exposed in responses
- Image URLs use signed URLs when possible
- Admin endpoints require proper authentication
- Audit logging for all data modifications

## Testing Requirements

### Contract Tests
- Response schema validation for all endpoints
- Performance requirements verification
- Error response format compliance
- Backward compatibility validation

### Integration Tests  
- End-to-end workflow testing
- Database transaction integrity
- Cache invalidation testing
- Image processing pipeline testing