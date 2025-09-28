# Test Environment Configuration

**Environment**: isolated-testing  
**Purpose**: Safe modernization testing without affecting production data

## Database Configuration
- **Test Database**: `nextauth_test` (isolated from production `nextauth`)
- **Connection**: MongoDB localhost:27017
- **Data**: Seeded with sample news articles for testing

## Environment Variables (.env.test)
```env
NODE_ENV=test
DATABASE_URL=mongodb://localhost:27017/nextauth_test
NEXT_PUBLIC_API_PATH=http://localhost:5001/api/
NEXTAUTH_URL=http://localhost:3001
TWITTER_CLIENT_ID=test_client_id
TWITTER_CLIENT_SECRET=test_client_secret
```

## Firebase Test Configuration
- **Project**: tskulis-test (separate from production)
- **Storage**: Isolated storage bucket for test images
- **Functions**: Test endpoints for image upload/optimization

## Testing Scripts
Added to package.json:
```json
{
  "scripts": {
    "test": "jest --env=jsdom",
    "test:watch": "jest --env=jsdom --watch",
    "test:coverage": "jest --env=jsdom --coverage",
    "test:e2e": "playwright test"
  }
}
```

## Status
✅ **T002 COMPLETED**: Isolated testing environment configured  
✅ **Constitutional Compliance**: Test environment preserves production integrity