# Data Model: Website Modernization

**Date**: 2025-09-28  
**Feature**: Complete Website Modernization & Professional Enhancement

## Overview
This modernization project preserves all existing data structures while enhancing data handling, validation, and performance. The focus is on maintaining backward compatibility while introducing modern TypeScript typing and validation.

## Existing Entities (Preserved)

### NewsType
**Purpose**: Core news article entity - must remain fully compatible
**Attributes**:
- `id`: string - MongoDB ObjectId, unique identifier
- `caption`: string - Article headline/title
- `content`: string - Rich text content from CKEditor
- `category`: CATEGORY enum - Trabzonspor, Transfer, General, Football
- `type`: TYPE enum - news, headline, subNews
- `slug`: string - URL-friendly identifier, auto-generated from caption
- `imgPath`: string - Primary article image URL/path
- `imgAlt`: string - Image alt text for accessibility
- `isActive`: boolean - Publication status
- `createDate`: ISO date string - Article creation timestamp
- `updateDate`: ISO date string - Last modification timestamp
- `expressDate`: ISO date string - Publication/display date

**Relationships**:
- One-to-many with CommentType (news.id → comment.newsId)
- Belongs to CATEGORY enum
- Belongs to TYPE enum

**Constraints**:
- slug must be unique within category
- imgPath required for published articles
- caption max length: 200 characters (SEO optimization)
- content must be valid HTML from CKEditor

### CommentType
**Purpose**: User comments on news articles - preserve existing functionality
**Attributes**:
- `id`: string - MongoDB ObjectId
- `newsId`: string - Reference to parent NewsType
- `userName`: string - Commenter display name
- `userEmail`: string - Commenter email (stored, not displayed)
- `content`: string - Comment text content
- `createDate`: ISO date string - Comment timestamp
- `isActive`: boolean - Comment moderation status

**Relationships**:
- Many-to-one with NewsType (comment.newsId → news.id)

**Constraints**:
- newsId must reference existing news article
- content max length: 1000 characters
- userEmail format validation required

### UserSession (Enhanced)
**Purpose**: Admin authentication and session management
**Attributes**:
- `id`: string - Session identifier
- `userEmail`: string - Admin email address
- `userName`: string - Display name from Twitter auth
- `role`: string - Admin role ("admin" for now, extensible)
- `loginDate`: ISO date string - Session start
- `lastActivity`: ISO date string - Last action timestamp
- `isActive`: boolean - Session validity

**Relationships**:
- Links to admin allowlist via email matching

## Configuration Entities (New/Enhanced)

### SiteConfiguration
**Purpose**: Centralized site settings and feature flags
**Attributes**:
- `version`: string - Application version for cache busting
- `maintenanceMode`: boolean - Site-wide maintenance flag
- `featureFlags`: object - Toggle new features during upgrade
- `performanceSettings`: object - Caching and optimization config
- `socialMedia`: object - Social media profile URLs
- `seoSettings`: object - Default meta tags and site-wide SEO

### UpgradeStatus
**Purpose**: Track modernization progress and component status
**Attributes**:
- `component`: string - Component name being upgraded
- `version`: string - Target version
- `status`: enum - "pending", "in-progress", "completed", "failed"
- `startDate`: ISO date string - Upgrade start time
- `completedDate`: ISO date string - Completion time
- `rollbackPlan`: string - Rollback procedure documentation
- `testsPassed`: boolean - Validation status

## Enhanced Typing (TypeScript)

### News Content Validation
```typescript
interface NewsValidation {
  caption: {
    minLength: 10;
    maxLength: 200;
    required: true;
  };
  content: {
    minLength: 100;
    maxLength: 50000;
    htmlValidation: true;
  };
  slug: {
    pattern: /^[a-z0-9-]+$/;
    uniqueWithinCategory: true;
  };
}
```

### Image Optimization Metadata
```typescript
interface ImageMetadata {
  originalUrl: string;
  optimizedSizes: {
    thumbnail: string;    // 150x100
    medium: string;       // 600x400  
    large: string;        // 1200x800
    original: string;     // As uploaded
  };
  blurHash: string;      // For progressive loading
  altText: string;       // Accessibility
  compressionRatio: number; // Performance tracking
}
```

### Performance Metrics
```typescript
interface PerformanceMetrics {
  pageLoadTime: number;        // Milliseconds
  firstContentfulPaint: number; // Core Web Vitals
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timestamp: ISO date string;
  pageType: "homepage" | "category" | "article";
  userAgent: string;
}
```

## Data Migration Strategy

### Phase 1: Schema Validation
- Validate all existing news articles have required fields
- Check image path accessibility and optimization
- Verify comment relationships integrity
- Audit slug uniqueness within categories

### Phase 2: Enhancement Addition
- Add new optional fields without breaking existing queries
- Implement default values for new configuration settings
- Create indexes for performance optimization
- Add validation rules gradually

### Phase 3: Optimization
- Implement new TypeScript interfaces
- Add performance tracking tables
- Create configuration management system
- Implement feature flag system

## Data Quality Assurance

### Content Integrity Checks
- All published articles must have valid images
- HTML content validation for CKEditor output
- Slug generation consistency verification
- Category and type enum validation

### Performance Data Collection
- Page load times per article and category
- Image loading performance metrics
- Database query performance tracking
- User interaction response times

### Accessibility Data
- Alt text completeness for all images
- Heading structure validation (H1-H6 hierarchy)
- Link text descriptiveness checks
- Color contrast compliance verification

## Monitoring and Alerts

### Data Health Monitoring
- Daily content integrity checks
- Image accessibility validation
- Performance metrics collection
- Error rate tracking per page type

### Upgrade Progress Tracking
- Component-by-component upgrade status
- Test coverage metrics per module
- Performance regression detection
- User experience impact measurement

## Backup and Recovery

### Pre-Upgrade Backup
- Complete MongoDB database backup
- File system backup (images, assets)
- Configuration files backup
- Database schema documentation

### Recovery Procedures
- Point-in-time recovery capability
- Rapid rollback to previous versions
- Data integrity verification tools
- Automated backup validation

This data model ensures complete preservation of existing functionality while providing the foundation for modern enhancements and performance improvements.