/**
 * Image utilities for TS Kulis
 * Handles placeholder images, blur effects, and fallbacks
 */

// Default blur placeholder data URL
export const DEFAULT_BLUR_DATA_URL = 
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
      <defs>
        <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' style='stop-color:#E5E7EB;stop-opacity:1' />
          <stop offset='100%' style='stop-color:#F3F4F6;stop-opacity:1' />
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' fill='url(#grad)'/>
      <text x='50%' y='50%' text-anchor='middle' dy='0.3em' fill='#9CA3AF' font-family='Arial, sans-serif' font-size='24' font-weight='bold'>TS Kulis</text>
    </svg>
  `);

/**
 * Gets optimized image URL based on content and category
 */
export function getOptimizedImageUrl(originalUrl: string, category?: string, caption?: string): string {
  // If already optimized, return as is
  if (!originalUrl?.includes('via.placeholder.com')) {
    return originalUrl;
  }

  // Extract text from via.placeholder.com URL
  const textMatch = originalUrl.match(/text=([^&]+)/);
  const text = textMatch ? decodeURIComponent(textMatch[1].replace(/\+/g, ' ')) : 'TS Kulis';

  // Map categories to theme colors
  const categoryThemes: Record<string, { bg: string; fg: string }> = {
    'Trabzonspor': { bg: '8b1538', fg: 'ffffff' }, // Bordo-mavi
    'Transfer': { bg: '1f2937', fg: 'f59e0b' },    // Dark + amber
    'Football': { bg: 'dc2626', fg: 'ffffff' },    // Red for national team
    'General': { bg: '059669', fg: 'ffffff' },     // Green for general sports
  };

  // Get theme or default
  const theme = categoryThemes[category || ''] || { bg: 'e2e8f0', fg: '64748b' };

  // Use placehold.co with proper text encoding
  const encodedText = encodeURIComponent(text);
  return `https://placehold.co/800x450/${theme.bg}/${theme.fg}?text=${encodedText}`;
}

/**
 * Gets local placeholder path based on aspect ratio
 */
export function getLocalPlaceholder(aspectRatio: '16x9' | '4x3' | 'square' = '16x9'): string {
  return `/placeholder-${aspectRatio}.svg`;
}

/**
 * Creates blur placeholder for Next.js Image component
 */
export function createBlurPlaceholder(width = 16, height = 9): string {
  return (
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>
        <rect width='100%' height='100%' fill='#E5E7EB'/>
      </svg>
    `)
  );
}

/**
 * Image props for Next.js Image component with optimizations
 */
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  category?: string;
  caption?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Gets complete image props with fallbacks and optimizations
 */
export function getImageProps(props: OptimizedImageProps) {
  const { src, alt, width, height, category, caption, className, priority } = props;
  
  return {
    src: getOptimizedImageUrl(src, category, caption),
    alt: alt || 'TS Kulis Haber Görseli',
    width,
    height,
    className,
    priority: priority || false,
    placeholder: 'blur' as const,
    blurDataURL: createBlurPlaceholder(Math.round(width / 50), Math.round(height / 50)),
    // Error fallback
    onError: (e: any) => {
      e.currentTarget.src = getLocalPlaceholder();
    }
  };
}