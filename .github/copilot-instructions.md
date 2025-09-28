# AI Coding Guidelines for TS Kulis

## Project Overview
TS Kulis is a Next.js-based news website focused on Trabzonspor football content. It uses MongoDB for data storage, NextAuth for Twitter-based admin authentication, and static site generation with ISR.

## Architecture Patterns

### Data Models
- **NewsType**: Core content model with fields like `caption`, `content`, `category`, `type`, `slug`, `imgPath`
- **CommentType**: User comments linked to news articles
- **Enums**: `CATEGORY` (Trabzonspor, Transfer, General, Football), `TYPE` (news, headline, subNews)

### API Patterns
- **Server-side**: Use `getStaticProps` with `revalidate: 60` for ISR on category pages
- **Client-side**: SWR for data fetching with `dedupingInterval: 1000000`
- **External API**: RESTful endpoints at `process.env.NEXT_PUBLIC_API_PATH` using fetch
- **File uploads**: Firebase Cloud Functions at `UPLOAD_FILE_PATH`

### Authentication
- NextAuth with Twitter provider for admin access
- Session-based auth with `useSession()` hook
- Admin role checking via `getAdmins()` helper
- Redirects authenticated users to `/adminpanel`

### Content Management
- **CKEditor**: Rich text editing with custom `UploadAdapter` for images
- **Slug generation**: Automatic slug creation from captions using `slugify`
- **Image handling**: Resize with `react-image-file-resizer`, upload to Firebase
- **Default values**: Use `setDefaultValues()` and `setDefaultCommentValues()` for new content

### Routing & Navigation
- **Dynamic routes**: `/[category]` for category pages, `/[category]/[slug]` for articles
- **Admin routes**: `/adminpanel` for content management, `/editor/[id]` for editing
- **URL structure**: SEO-friendly with category-based paths and slugs

### Development Workflows

#### Build & Run
```bash
npm run dev        # Development server
npm run build      # Production build with sitemap generation
npm run start      # Production server
npm run debug      # Debug mode with inspector
npm run test       # Jest tests
npm run ts-coverage # TypeScript coverage report
```

#### Backend API (News API)
```bash
# Run from anywhere in console
cd c:\dev\news-api; dotnet run --project newsApi\newsApi.csproj

# Or step by step
cd c:\dev\news-api
dotnet run --project newsApi\newsApi.csproj
```
- Runs on ports 5000 (HTTP) and 5001 (HTTPS)
- MongoDB required for data storage
- Swagger documentation at http://localhost:5000/swagger

#### Testing
- Jest with `@testing-library/react` and `jest-dom`
- Setup file: `jest.setup.ts` imports `@testing-library/jest-dom`
- Test files in `src/test/` directory

### Code Conventions

#### TypeScript
- `strict: false` in tsconfig - be cautious with type safety
- Interface definitions in `src/types/`
- Enum definitions in `src/utils/enum.ts`

#### Styling
- Bootstrap 4 with custom CSS in `src/index.css` and `src/content-styles.css`
- Styled-components for component-specific styles
- Slick carousel for news sliders

#### Data Operations
- **Create/Update**: Use `upsertNews()` which calls `insertNews()` or `updateNews()`
- **Delete**: Direct fetch calls to DELETE endpoints
- **Fetch**: Prefer SWR for client-side, static props for server-side

#### Component Patterns
- Functional components with hooks
- Props interfaces for type safety
- Error boundaries with loading states ("Yükleniyor...", "Haber bulunamadı")

### Key Files & Directories
- `lib/mongodb.ts`: Database connection with global promise caching
- `src/utils/api.ts`: All API calls and data operations
- `src/utils/helper.ts`: Utility functions for URLs, slugs, defaults
- `src/components/`: Reusable UI components (Layout, News, CategoryNews)
- `src/pages/api/auth/[...nextauth].ts`: Authentication configuration

### Common Patterns
- **Environment URLs**: Use `getEnvironmentUrl()` for API base URLs
- **Date handling**: ISO strings for `createDate`, `updateDate`, `expressDate`
- **Image optimization**: Next.js Image component with Firebase storage domains
- **SEO**: Meta tags in Head components with Turkish content
- **Admin checks**: `getAdmins().includes(session?.user?.email)` for authorization

### Deployment Notes
- Static export with `next export` (see `npm run export`)
- Sitemap generation via `next-sitemap` post-build
- Service worker for caching (workbox files in public/)
- PWA manifest and icons configured</content>
<parameter name="filePath">c:\dev\tskulis\.github\copilot-instructions.md