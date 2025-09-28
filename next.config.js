const path = require('path')

/** @type {import('next').NextConfig} */
module.exports = {
  // Image optimization configuration
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'placehold.co',           // Modern placeholder service
      'picsum.photos',          // Lorem Picsum - real photos for demo
    ],
    formats: ['image/webp', 'image/avif'], // Modern image formats
    minimumCacheTTL: 31536000, // 1 year cache for images
    dangerouslyAllowSVG: false, // Security: disable SVG
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Production build optimizations
  experimental: {
    // Modern features for better performance
    scrollRestoration: true,
    optimizeCss: true,
    modularizeImports: {
      'react-bootstrap': {
        transform: 'react-bootstrap/{{member}}',
      },
      '@ckeditor/ckeditor5-react': {
        transform: '@ckeditor/ckeditor5-react/{{member}}',
      }
    },
    // Build performance
    workerThreads: false,
    cpus: 1,
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    
    // React optimizations
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? {
      properties: ['^data-testid$']
    } : false,
  },
  
  // Static page generation
  staticPageGenerationTimeout: 120,
  generateBuildId: async () => {
    // Generate consistent build ID for better caching
    return process.env.BUILD_ID || `build-${Date.now()}`
  },
  
  // Performance optimizations
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
  
  // Production headers for performance
  async headers() {
    if (process.env.NODE_ENV !== 'production') return []
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },
  
  // Advanced webpack configuration
  webpack: (config, { isServer, dev, webpack }) => {
    // Client-side optimizations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    
    // Production optimizations
    if (!dev) {
      // Bundle analyzer (conditional)
      if (process.env.ANALYZE === 'true') {
        const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html'
          })
        )
      }
      
      // Optimize chunks
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              chunks: 'all',
              reuseExistingChunk: true,
            },
            bootstrap: {
              test: /[\\/]node_modules[\\/](react-bootstrap|bootstrap)[\\/]/,
              name: 'bootstrap',
              priority: 20,
              chunks: 'all',
            },
            ckeditor: {
              test: /[\\/]node_modules[\\/]@ckeditor[\\/]/,
              name: 'ckeditor',
              priority: 30,
              chunks: 'all',
            }
          }
        }
      }
      
      // Add webpack plugins for optimization
      config.plugins.push(
        new webpack.DefinePlugin({
          __DEV__: false,
          'process.env.NODE_ENV': JSON.stringify('production')
        })
      )
    }
    
    // Module resolution improvements
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
      '@components': path.join(__dirname, 'src/components'),
      '@utils': path.join(__dirname, 'src/utils'),
      '@types': path.join(__dirname, 'src/types'),
    }
    
    return config
  },
  
  // Environment variables
  env: {
    BUILD_TIME: new Date().toISOString(),
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Trailing slash configuration
  trailingSlash: false,
  
  // Output configuration
  output: 'standalone',
  
  // Disable x-powered-by header
  poweredByHeader: false,
}