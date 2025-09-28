/**
 * Webpack Optimization Configuration
 * 
 * This module provides advanced webpack optimizations for production builds
 */

const path = require('path');

const webpackOptimizations = {
  // Optimize chunk splitting
  getSplitChunksConfig: (isServer = false) => ({
    chunks: 'all',
    minSize: 20000,
    maxSize: 244000,
    minChunks: 1,
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
    enforceSizeThreshold: 50000,
    cacheGroups: {
      // React and React-DOM
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
        name: 'react',
        priority: 40,
        chunks: 'all',
        enforce: true,
      },
      
      // Bootstrap and UI components
      bootstrap: {
        test: /[\\/]node_modules[\\/](react-bootstrap|bootstrap|@popperjs)[\\/]/,
        name: 'bootstrap',
        priority: 35,
        chunks: 'all',
      },
      
      // CKEditor (large dependency)
      ckeditor: {
        test: /[\\/]node_modules[\\/]@ckeditor[\\/]/,
        name: 'ckeditor',
        priority: 30,
        chunks: 'all',
      },
      
      // Next.js and routing
      nextjs: {
        test: /[\\/]node_modules[\\/](next|next-auth)[\\/]/,
        name: 'nextjs',
        priority: 25,
        chunks: 'all',
      },
      
      // Utilities and helpers
      utils: {
        test: /[\\/]node_modules[\\/](axios|swr|slugify|styled-components)[\\/]/,
        name: 'utils',
        priority: 20,
        chunks: 'all',
      },
      
      // Media and image processing
      media: {
        test: /[\\/]node_modules[\\/](react-image-file-resizer|watermarkjs|react-slick|slick-carousel)[\\/]/,
        name: 'media',
        priority: 15,
        chunks: 'all',
      },
      
      // Common vendor packages
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendor',
        priority: 10,
        chunks: 'all',
        minChunks: 2,
      },
      
      // Common application code
      common: {
        name: 'common',
        minChunks: 2,
        priority: 5,
        chunks: 'all',
        reuseExistingChunk: true,
      },
    },
  }),

  // Production optimizations
  getProductionOptimizations: (webpack) => ({
    // Minimize bundle size
    minimize: true,
    
    // Remove dead code
    usedExports: true,
    sideEffects: false,
    
    // Module concatenation
    concatenateModules: true,
    
    // Split chunks configuration
    splitChunks: webpackOptimizations.getSplitChunksConfig(),
    
    // Runtime chunk optimization
    runtimeChunk: {
      name: 'runtime',
    },
    
    // Module IDs optimization
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
  }),

  // Resolve configuration
  getResolveConfig: (rootDir) => ({
    alias: {
      '@': path.join(rootDir, 'src'),
      '@components': path.join(rootDir, 'src/components'),
      '@utils': path.join(rootDir, 'src/utils'),
      '@types': path.join(rootDir, 'src/types'),
      '@pages': path.join(rootDir, 'src/pages'),
      '@styles': path.join(rootDir, 'src/styles'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    modules: ['node_modules'],
  }),

  // Performance hints
  getPerformanceConfig: () => ({
    hints: 'warning',
    maxEntrypointSize: 512000, // 500KB
    maxAssetSize: 300000,      // 300KB
    assetFilter: function(assetFilename) {
      // Only check JavaScript and CSS files
      return /\.(js|css)$/.test(assetFilename);
    },
  }),

  // Development optimizations
  getDevelopmentOptimizations: () => ({
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  }),

  // Loader optimizations
  getLoaderOptimizations: () => ({
    // Babel loader optimization
    babel: {
      cacheDirectory: true,
      cacheCompression: false,
      compact: true,
    },
    
    // CSS loader optimization
    css: {
      modules: {
        localIdentName: '[hash:base64:5]',
      },
    },
  }),

  // Plugin configurations
  getPluginConfigurations: (webpack, isDev) => {
    const plugins = [];
    
    if (!isDev) {
      // Production plugins
      plugins.push(
        // Define plugin for environment variables
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('production'),
          '__DEV__': false,
        }),
        
        // Module concatenation plugin
        new webpack.optimize.ModuleConcatenationPlugin(),
        
        // Ignore moment.js locales (if using moment)
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/locale$/,
          contextRegExp: /moment$/,
        })
      );
    }
    
    return plugins;
  },

  // Asset optimization
  getAssetOptimizations: () => ({
    // Image optimization
    images: {
      test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/images/[name].[hash][ext]',
      },
    },
    
    // Font optimization
    fonts: {
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name].[hash][ext]',
      },
    },
  }),
};

module.exports = webpackOptimizations;