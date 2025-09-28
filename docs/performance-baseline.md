# Performance Baseline Report

**Date**: 2025-09-28 20:08  
**Build**: Next.js production build analysis  
**Purpose**: Pre-modernization performance baseline

## Bundle Size Analysis

### Page-Level Breakdown
| **Route** | **Size** | **First Load JS** | **Type** | **Notes** |
|-----------|----------|-------------------|----------|-----------|
| `/` (Homepage) | 2.64 kB | 198 kB | Static | Core landing page |
| `/[category]` | 1.78 kB | 197 kB | Static | Category listing |
| `/[category]/[slug]` | 9.49 kB | 188 kB | Static | Article detail page |
| `/adminpanel` | 34.2 kB | 144 kB | ISR (60s) | Admin interface |
| `/editor/[id]` | **268 kB** | **376 kB** | Static | **CKEditor heavy** |
| Other pages | <5 kB | <165 kB | Static | Legal/info pages |

### Shared Bundles (121 kB Total)
- **framework-4556c45dd113b893.js**: 45.3 kB (Next.js framework)
- **main-f7ebbd44069326a3.js**: 30.8 kB (Application main)
- **pages/_app-8878c2137f1929ff.js**: 12.7 kB (App wrapper)
- **css/64ebf62ec26be0db.css**: 31.2 kB (Global styles)
- **webpack-434fefa8f39d8fbc.js**: 896 B (Webpack runtime)

## Performance Metrics (Current State)

### Critical Issues Identified
1. **Editor Page**: 376 kB first load (CKEditor bundle)
2. **Homepage**: 198 kB first load (target: <150 kB)
3. **Category Pages**: 197 kB first load
4. **CSS Bundle**: 31.2 kB global styles

### Build Warnings (Accessibility)
- Missing alt props in SliderCard, SubNewsCard, SubSliderCard
- Image accessibility issues in article pages
- **Impact**: WCAG 2.1 Level A compliance failures

## Technology Stack Assessment

### Outdated Dependencies
- **Browserslist**: caniuse-lite outdated
- **Node.js**: v22.20.0 (newer than required)
- **Next.js**: 12.x (target: 14.x for modernization)

### Security Issues  
- **NODE_TLS_REJECT_UNAUTHORIZED**: Set to '0' (insecure)
- **Dependencies**: 66 vulnerabilities from audit

## Performance Targets for Modernization

### Bundle Size Targets
- **Homepage**: 198 kB → 150 kB (25% reduction)
- **Category Pages**: 197 kB → 150 kB (24% reduction)
- **Article Pages**: 188 kB → 140 kB (26% reduction)
- **Editor Page**: 376 kB → 250 kB (33% reduction via code splitting)

### Loading Performance Targets  
- **Homepage Load**: <3s on broadband (25+ Mbps) - Current: Unknown
- **Interactive Response**: <100ms - Current: Unknown
- **Core Web Vitals**: All green scores required

## Optimization Opportunities

### 1. Code Splitting
- **CKEditor**: Lazy load in admin panel only
- **Admin Components**: Separate bundle from public pages
- **Image Libraries**: Dynamic imports for optimization

### 2. CSS Optimization
- **Bootstrap**: 4.6.2 → 5.x (smaller bundle)
- **Unused CSS**: Tree-shake unused styles
- **CSS-in-JS**: Consider styled-components optimization

### 3. Framework Updates
- **Next.js 14**: Better bundling and tree-shaking
- **React 18**: Automatic batching and concurrent features
- **Image Optimization**: Next.js 14 image enhancements

### 4. Asset Optimization
- **Images**: WebP/AVIF conversion pipeline
- **Fonts**: Self-host Google Fonts
- **Icons**: SVG sprite optimization

## Constitutional Compliance

✅ **Modern Stack Maintenance**: Performance baseline established  
✅ **Backward Compatibility**: Current metrics preserved for comparison  
✅ **Test-Driven Upgrades**: Performance tests planned in T017, T066-T067  
✅ **Content Management Integrity**: Editor performance will be improved  
✅ **Performance-First Architecture**: Optimization targets set  

## Next Steps

1. **T005-T010**: Complete configuration and tooling setup
2. **T017**: Implement performance testing with current baseline  
3. **T063-T067**: Bundle optimization and Core Web Vitals improvements
4. **T071**: Performance monitoring with Lighthouse CI

**Status**: T004 COMPLETED ✅  
**Baseline**: 198 kB homepage, 376 kB editor, 121 kB shared bundles  
**Target**: 25-35% bundle size reduction across all pages