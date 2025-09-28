# API Contract: Image Service

**Endpoint**: `/api/images`  
**Purpose**: Image upload, optimization, and delivery during modernization
**Version**: 2.0 (modernized with advanced optimization)

## POST /api/images/upload (Admin Only)
**Purpose**: Upload and optimize images with modern compression and responsive variants

### Request
```http
POST /api/images/upload
Host: localhost:3001
Content-Type: multipart/form-data
Authorization: Bearer jwt-token
```

```
Content-Disposition: form-data; name="image"; filename="news-image.jpg"
Content-Type: image/jpeg

[Binary image data]

Content-Disposition: form-data; name="alt"
Trabzonspor antrenman fotoğrafı

Content-Disposition: form-data; name="category"
trabzonspor
```

### Response (Success - 201)
```json
{
  "data": {
    "id": "img_507f1f77bcf86cd799439015",
    "originalUrl": "https://cdn.tskulis.com/original/2025/09/28/news-image-abc123.jpg",
    "optimizedSizes": {
      "thumbnail": "https://cdn.tskulis.com/thumb/news-image-abc123.webp",
      "small": "https://cdn.tskulis.com/small/news-image-abc123.webp", 
      "medium": "https://cdn.tskulis.com/medium/news-image-abc123.webp",
      "large": "https://cdn.tskulis.com/large/news-image-abc123.webp"
    },
    "metadata": {
      "width": 1920,
      "height": 1080,
      "format": "webp",
      "fileSize": 156789,
      "compressionRatio": 0.73,
      "blurHash": "L6Pj0^jE.AyE_3t7t7R**0o#DgR4",
      "altText": "Trabzonspor antrenman fotoğrafı",
      "uploadedAt": "2025-09-28T10:00:00.000Z"
    },
    "performance": {
      "processedInMs": 1250,
      "sizesGenerated": 4,
      "totalSavings": "27%"
    }
  }
}
```

### Response (Error - 413)
```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Image file size exceeds maximum limit",
    "details": {
      "maxSize": "5MB",
      "receivedSize": "8.2MB",
      "supportedFormats": ["jpg", "jpeg", "png", "webp"]
    }
  }
}
```

### Response (Error - 422)
```json
{
  "error": {
    "code": "INVALID_IMAGE",
    "message": "Invalid image format or corrupted file",
    "details": {
      "supportedFormats": ["jpg", "jpeg", "png", "webp"],
      "minDimensions": "300x200",
      "maxDimensions": "4000x3000"
    }
  }
}
```

---

## GET /api/images/:id
**Purpose**: Retrieve image metadata and URLs

### Request
```http
GET /api/images/img_507f1f77bcf86cd799439015
Host: localhost:3001
Accept: application/json
```

### Response (Success - 200)
```json
{
  "data": {
    "id": "img_507f1f77bcf86cd799439015",
    "originalUrl": "https://cdn.tskulis.com/original/2025/09/28/news-image-abc123.jpg",
    "optimizedSizes": {
      "thumbnail": "https://cdn.tskulis.com/thumb/news-image-abc123.webp",
      "small": "https://cdn.tskulis.com/small/news-image-abc123.webp",
      "medium": "https://cdn.tskulis.com/medium/news-image-abc123.webp", 
      "large": "https://cdn.tskulis.com/large/news-image-abc123.webp"
    },
    "metadata": {
      "width": 1920,
      "height": 1080,
      "format": "webp",
      "altText": "Trabzonspor antrenman fotoğrafı",
      "blurHash": "L6Pj0^jE.AyE_3t7t7R**0o#DgR4"
    }
  },
  "cache": {
    "expires": "2025-09-29T10:00:00.000Z",
    "etag": "W/\"img-abc123\""
  }
}
```

---

## DELETE /api/images/:id (Admin Only)
**Purpose**: Delete image and all its variants

### Request
```http
DELETE /api/images/img_507f1f77bcf86cd799439015
Host: localhost:3001
Authorization: Bearer jwt-token
```

### Response (Success - 200)
```json
{
  "data": {
    "id": "img_507f1f77bcf86cd799439015",
    "status": "deleted",
    "filesRemoved": [
      "original/news-image-abc123.jpg",
      "thumb/news-image-abc123.webp",
      "small/news-image-abc123.webp", 
      "medium/news-image-abc123.webp",
      "large/news-image-abc123.webp"
    ],
    "deletedAt": "2025-09-28T10:05:00.000Z"
  }
}
```

### Response (Error - 409)
```json
{
  "error": {
    "code": "IMAGE_IN_USE", 
    "message": "Cannot delete image that is referenced by published articles",
    "details": {
      "referencedBy": [
        {
          "newsId": "507f1f77bcf86cd799439011",
          "title": "Trabzonspor yeni transferini açıkladı"
        }
      ]
    }
  }
}
```

## Image Optimization Features

### Modern Format Support
- **WebP**: Primary format for modern browsers (85% smaller than JPEG)
- **AVIF**: Next-gen format for supported browsers (50% smaller than WebP)
- **Fallback**: JPEG/PNG for legacy browser support
- **Progressive JPEG**: For better perceived loading performance

### Responsive Image Sizes
- **Thumbnail**: 150x100px (for lists, previews)
- **Small**: 400x267px (for mobile devices)
- **Medium**: 800x533px (for tablets, small desktops)
- **Large**: 1200x800px (for large screens)
- **Original**: Preserved for archive purposes

### Advanced Optimization
- **Smart Compression**: AI-based quality optimization per image
- **BlurHash**: Instant placeholder while loading
- **Lazy Loading**: Built-in lazy loading support
- **CDN Integration**: Global edge delivery
- **Cache Headers**: Optimal browser and CDN caching

## Performance Requirements

### Upload Performance
- Image processing: <2 seconds for files up to 5MB
- Multiple size generation: Parallel processing
- Upload progress: Real-time progress reporting
- Error handling: Graceful degradation

### Delivery Performance  
- CDN response time: <50ms global average
- Cache hit ratio: >95% for processed images
- Bandwidth savings: >30% compared to unoptimized
- Browser compatibility: 99.5% of users supported

## Security Features

### Upload Security
- File type validation: Magic number checking
- Virus scanning: All uploads scanned
- Size limits: 5MB maximum per file
- Rate limiting: 10 uploads per minute per user
- Access control: Admin-only upload capability

### Delivery Security
- Signed URLs: Optional for sensitive content
- Hotlink protection: Prevent unauthorized embedding
- Access logs: Complete audit trail
- Content validation: Ensure files haven't been tampered

## Backward Compatibility

### Legacy URL Support
- Old image URLs continue to work
- Automatic redirection to optimized versions
- Gradual migration of existing images
- No broken links during transition

### Migration Strategy
- Background processing of existing images
- Progressive enhancement of image delivery
- A/B testing of new vs old image serving
- Performance monitoring throughout migration

## Testing Requirements

### Integration Tests
- File upload and processing pipeline
- Multiple size generation verification
- CDN integration and cache invalidation
- Error handling for various failure scenarios

### Performance Tests
- Upload speed under various file sizes
- Concurrent upload handling
- CDN response time verification
- Compression ratio validation