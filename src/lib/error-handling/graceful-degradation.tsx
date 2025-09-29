/**
 * Graceful Degradation System
 * Provides fallback mechanisms and progressive enhancement
 */

import React, { Suspense, ComponentType, ReactNode } from 'react';
import { SectionErrorBoundary } from './error-boundary';

// Feature detection utilities
export const FeatureDetector = {
  // Check if JavaScript is enabled (always true in React context, but useful for server-side)
  hasJavaScript: () => typeof window !== 'undefined',
  
  // Check if local storage is available
  hasLocalStorage: () => {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },
  
  // Check if session storage is available
  hasSessionStorage: () => {
    try {
      const test = 'test';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },
  
  // Check if WebP images are supported
  hasWebPSupport: async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  },
  
  // Check if service worker is supported
  hasServiceWorkerSupport: () => {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator;
  },
  
  // Check network connection
  isOnline: () => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },
  
  // Check if device supports touch
  hasTouch: () => {
    return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  },
  
  // Check if device prefers reduced motion
  prefersReducedMotion: () => {
    return typeof window !== 'undefined' && 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  // Check if device is in dark mode
  prefersDarkMode: () => {
    return typeof window !== 'undefined' && 
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
  
  // Check available memory (Chrome only)
  getDeviceMemory: (): number => {
    return typeof navigator !== 'undefined' && 'deviceMemory' in navigator 
      ? (navigator as any).deviceMemory 
      : 4; // Default assumption
  },
  
  // Check network connection type
  getConnectionType: (): string => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }
};

// Progressive enhancement wrapper
interface ProgressiveWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  feature: 'hasJavaScript' | 'hasLocalStorage' | 'hasSessionStorage' | 'hasWebPSupport' | 'hasServiceWorkerSupport' | 'isOnline' | 'hasTouch' | 'prefersReducedMotion' | 'prefersDarkMode';
  gracefulDegradation?: boolean;
}

export const ProgressiveWrapper: React.FC<ProgressiveWrapperProps> = ({
  children,
  fallback,
  feature,
  gracefulDegradation = true
}) => {
  const [isSupported, setIsSupported] = React.useState<boolean | null>(null);
  
  React.useEffect(() => {
    const checkFeature = async () => {
      try {
        const detector = FeatureDetector[feature];
        if (typeof detector === 'function') {
          const result = await detector();
          setIsSupported(typeof result === 'boolean' ? result : Boolean(result));
        }
      } catch (error) {
        console.warn(`Feature detection failed for ${feature}:`, error);
        setIsSupported(false);
      }
    };
    
    checkFeature();
  }, [feature]);
  
  // Show loading state while checking
  if (isSupported === null) {
    return <>{fallback || <div className="feature-loading">Yükleniyor...</div>}</>;
  }
  
  // Show content if supported, fallback if not supported and graceful degradation is enabled
  if (isSupported || !gracefulDegradation) {
    return <>{children}</>;
  }
  
  return <>{fallback || <div className="feature-not-supported">Bu özellik desteklenmiyor.</div>}</>;
};

// Loading fallback components
interface LoadingFallbackProps {
  type?: 'spinner' | 'skeleton' | 'placeholder';
  height?: number;
  width?: number;
  text?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  type = 'spinner',
  height = 100,
  width,
  text = 'Yükleniyor...'
}) => {
  const baseStyles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: `${height}px`,
    width: width ? `${width}px` : '100%'
  };
  
  switch (type) {
    case 'spinner':
      return (
        <div style={baseStyles}>
          <div style={{
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #007bff',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            animation: 'spin 1s linear infinite',
            marginRight: '10px'
          }} />
          <span>{text}</span>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
      
    case 'skeleton':
      return (
        <div style={{
          ...baseStyles,
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
            animation: 'shimmer 1.5s infinite'
          }} />
          <style jsx>{`
            @keyframes shimmer {
              0% { left: -100%; }
              100% { left: 100%; }
            }
          `}</style>
        </div>
      );
      
    case 'placeholder':
    default:
      return (
        <div style={{
          ...baseStyles,
          backgroundColor: '#f8f9fa',
          border: '1px dashed #dee2e6',
          borderRadius: '4px',
          color: '#6c757d'
        }}>
          {text}
        </div>
      );
  }
};

// Adaptive loading based on device capabilities
interface AdaptiveLoadingProps {
  children: ReactNode;
  fallback?: ReactNode;
  lowMemoryFallback?: ReactNode;
  slowConnectionFallback?: ReactNode;
}

export const AdaptiveLoading: React.FC<AdaptiveLoadingProps> = ({
  children,
  fallback,
  lowMemoryFallback,
  slowConnectionFallback
}): JSX.Element => {
  const [loadingStrategy, setLoadingStrategy] = React.useState<'full' | 'reduced' | 'minimal'>('full');
  
  React.useEffect(() => {
    const deviceMemory = FeatureDetector.getDeviceMemory();
    const connectionType = FeatureDetector.getConnectionType();
    
    // Determine loading strategy based on device capabilities
    if (deviceMemory <= 2 || ['slow-2g', '2g'].includes(connectionType)) {
      setLoadingStrategy('minimal');
    } else if (deviceMemory <= 4 || ['3g'].includes(connectionType)) {
      setLoadingStrategy('reduced');
    } else {
      setLoadingStrategy('full');
    }
  }, []);
  
  switch (loadingStrategy) {
    case 'minimal':
      return <>{lowMemoryFallback || fallback || <LoadingFallback text="Optimize edilmiş sürüm yükleniyor..." />}</>;
      
    case 'reduced':
      return <>{slowConnectionFallback || fallback || <LoadingFallback text="Hafif sürüm yükleniyor..." />}</>;
      
    case 'full':
    default:
      return (
        <SectionErrorBoundary>
          <Suspense fallback={fallback || <LoadingFallback />}>
            {children}
          </Suspense>
        </SectionErrorBoundary>
      );
  }
};

// Network-aware component loading
interface NetworkAwareProps {
  children: ReactNode;
  offlineFallback?: ReactNode;
  onlineOnly?: boolean;
}

export const NetworkAware: React.FC<NetworkAwareProps> = ({
  children,
  offlineFallback,
  onlineOnly = false
}): JSX.Element => {
  const [isOnline, setIsOnline] = React.useState(FeatureDetector.isOnline());
  
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!isOnline && onlineOnly) {
    return <>{offlineFallback || (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        margin: '10px 0'
      }}>
        <span style={{ fontSize: '24px', marginRight: '8px' }}>📶</span>
        <strong>İnternet Bağlantısı Gerekli</strong>
        <p style={{ margin: '8px 0 0', color: '#856404' }}>
          Bu içeriği görüntülemek için internet bağlantısı gereklidir. 
          Lütfen bağlantınızı kontrol edin ve tekrar deneyin.
        </p>
      </div>
    )}</>;
  }
  
  if (!isOnline) {
    return (
      <>
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          fontSize: '14px',
          textAlign: 'center',
          marginBottom: '10px'
        }}>
          🔌 Çevrimdışı modda çalışıyorsunuz. Bazı özellikler sınırlı olabilir.
        </div>
        {children}
      </>
    );
  }
  
  return <>{children}</>;
};

// HOC for graceful degradation
export function withGracefulDegradation<P extends object>(
  WrappedComponent: ComponentType<P>,
  fallbackComponent?: ComponentType<P>
) {
  const WithGracefulDegradation = (props: P): JSX.Element => {
    return (
      <SectionErrorBoundary
        {...(fallbackComponent && {
          fallback: () => React.createElement(fallbackComponent, props)
        })}
      >
        <Suspense fallback={<LoadingFallback />}>
          <WrappedComponent {...props} />
        </Suspense>
      </SectionErrorBoundary>
    );
  };
  
  WithGracefulDegradation.displayName = `withGracefulDegradation(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithGracefulDegradation;
}

// Safe storage utilities with fallbacks
export const SafeStorage = {
  // Local storage with fallback to memory
  local: {
    getItem: (key: string, defaultValue: string | null = null): string | null => {
      if (!FeatureDetector.hasLocalStorage()) {
        return defaultValue;
      }
      
      try {
        return localStorage.getItem(key) || defaultValue;
      } catch {
        return defaultValue;
      }
    },
    
    setItem: (key: string, value: string): boolean => {
      if (!FeatureDetector.hasLocalStorage()) {
        return false;
      }
      
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    
    removeItem: (key: string): boolean => {
      if (!FeatureDetector.hasLocalStorage()) {
        return false;
      }
      
      try {
        localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }
  },
  
  // Session storage with fallback to memory
  session: {
    getItem: (key: string, defaultValue: string | null = null): string | null => {
      if (!FeatureDetector.hasSessionStorage()) {
        return defaultValue;
      }
      
      try {
        return sessionStorage.getItem(key) || defaultValue;
      } catch {
        return defaultValue;
      }
    },
    
    setItem: (key: string, value: string): boolean => {
      if (!FeatureDetector.hasSessionStorage()) {
        return false;
      }
      
      try {
        sessionStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    
    removeItem: (key: string): boolean => {
      if (!FeatureDetector.hasSessionStorage()) {
        return false;
      }
      
      try {
        sessionStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }
  }
};

// Image with graceful degradation
interface GracefulImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  webpSrc?: string;
  lowQualitySrc?: string;
  alt: string;
  onLoadError?: () => void;
}

export const GracefulImage: React.FC<GracefulImageProps> = ({
  src,
  fallbackSrc,
  webpSrc,
  lowQualitySrc,
  alt,
  onLoadError,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = React.useState(src);
  const [hasError, setHasError] = React.useState(false);
  const [supportsWebP, setSupportsWebP] = React.useState<boolean | null>(null);
  
  // Check WebP support
  React.useEffect(() => {
    FeatureDetector.hasWebPSupport().then(setSupportsWebP);
  }, []);
  
  // Determine best source
  React.useEffect(() => {
    const deviceMemory = FeatureDetector.getDeviceMemory();
    const connectionType = FeatureDetector.getConnectionType();
    
    if (hasError) {
      setCurrentSrc(fallbackSrc || src);
      return;
    }
    
    // Use low quality for limited resources
    if ((deviceMemory <= 2 || ['slow-2g', '2g'].includes(connectionType)) && lowQualitySrc) {
      setCurrentSrc(lowQualitySrc);
      return;
    }
    
    // Use WebP if supported and available
    if (supportsWebP && webpSrc) {
      setCurrentSrc(webpSrc);
      return;
    }
    
    setCurrentSrc(src);
  }, [src, fallbackSrc, webpSrc, lowQualitySrc, hasError, supportsWebP]);
  
  const handleError = () => {
    setHasError(true);
    
    if (onLoadError) {
      onLoadError();
    }
    
    // Try fallback if not already tried
    if (currentSrc !== fallbackSrc && fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };
  
  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      onError={handleError}
      loading="lazy" // Native lazy loading fallback
    />
  );
};

export default {
  FeatureDetector,
  ProgressiveWrapper,
  LoadingFallback,
  AdaptiveLoading,
  NetworkAware,
  withGracefulDegradation,
  SafeStorage,
  GracefulImage
};