/**
 * Advanced Webpack Build Optimizations
 * Provides comprehensive webpack optimization strategies
 */

interface BuildMetrics {
  buildTime: number;
  bundleSize: number;
  chunkCount: number;
  moduleCount: number;
  optimizationSavings: number;
  timestamp: number;
}

interface OptimizationConfig {
  splitChunks: {
    chunks: 'all' | 'async' | 'initial';
    cacheGroups: { [key: string]: any };
  };
  minimize: boolean;
  usedExports: boolean;
  sideEffects: boolean | string[];
  concatenateModules: boolean;
}

export class WebpackOptimizer {
  private buildMetrics: BuildMetrics[] = [];

  // Generate optimized webpack configuration
  generateOptimizedConfig(isProduction: boolean = process.env.NODE_ENV === 'production') {
    const config: any = {
      mode: isProduction ? 'production' : 'development',
      
      // Optimization configuration
      optimization: this.getOptimizationConfig(isProduction),
      
      // Performance budgets
      performance: {
        maxAssetSize: 250000,
        maxEntrypointSize: 250000,
        hints: isProduction ? 'error' : 'warning'
      },
      
      // Resolve optimizations
      resolve: {
        modules: ['node_modules'],
        extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: this.getAliasConfig(),
        mainFields: ['es2015', 'module', 'main']
      },
      
      // Module rules for optimization
      module: {
        rules: this.getModuleRules(isProduction)
      },
      
      // Plugins
      plugins: this.getOptimizationPlugins(isProduction)
    };
    
    if (isProduction) {
      // Production-only optimizations
      config.devtool = 'source-map';
      config.stats = 'minimal';
    } else {
      // Development optimizations
      config.devtool = 'eval-cheap-module-source-map';
      config.cache = { type: 'filesystem' };
    }
    
    return config;
  }

  private getOptimizationConfig(isProduction: boolean): OptimizationConfig & any {
    const baseConfig: OptimizationConfig & any = {
      // Tree shaking
      usedExports: true,
      sideEffects: false,
      
      // Module concatenation
      concatenateModules: isProduction,
      
      // Minimize
      minimize: isProduction,
      
      // Chunk splitting strategy
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Framework chunks
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
            name: 'react-vendor',
            chunks: 'all',
            priority: 40,
            reuseExistingChunk: true
          },
          
          // UI Library chunks
          ui: {
            test: /[\\/]node_modules[\\/](react-bootstrap|bootstrap)[\\/]/,
            name: 'ui-vendor',
            chunks: 'all',
            priority: 35,
            reuseExistingChunk: true
          },
          
          // Editor chunks (heavy)
          editor: {
            test: /[\\/]node_modules[\\/]@ckeditor[\\/]/,
            name: 'editor-vendor',
            chunks: 'all',
            priority: 50,
            reuseExistingChunk: true
          },
          
          // Utilities
          utils: {
            test: /[\\/]node_modules[\\/](lodash|moment|date-fns|dayjs)[\\/]/,
            name: 'utils-vendor',
            chunks: 'all',
            priority: 30,
            reuseExistingChunk: true
          },
          
          // Common vendor
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            minChunks: 2
          },
          
          // Common application code
          common: {
            name: 'common',
            chunks: 'all',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      }
    };

    if (isProduction) {
      // Production-only optimizations
      baseConfig.minimizer = this.getMinimizerConfig();
      baseConfig.mangleExports = 'size';
      baseConfig.removeAvailableModules = true;
      baseConfig.removeEmptyChunks = true;
      baseConfig.mergeDuplicateChunks = true;
      baseConfig.flagIncludedChunks = true;
      baseConfig.nodeEnv = 'production';
    }

    return baseConfig;
  }

  private getAliasConfig() {
    return {
      // Performance optimizations
      'react': require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
      
      // Size optimizations
      'moment': 'dayjs',
      'lodash': 'lodash-es',
      
      // Development convenience
      '@': require('path').join(process.cwd(), 'src'),
      '@components': require('path').join(process.cwd(), 'src/components'),
      '@utils': require('path').join(process.cwd(), 'src/utils'),
      '@lib': require('path').join(process.cwd(), 'src/lib'),
      '@types': require('path').join(process.cwd(), 'src/types')
    };
  }

  private getModuleRules(isProduction: boolean) {
    return [
      // TypeScript/JavaScript optimization
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  modules: false,
                  targets: {
                    browsers: ['last 2 versions', 'not dead', '> 0.5%']
                  }
                }],
                '@babel/preset-typescript',
                ['@babel/preset-react', { runtime: 'automatic' }]
              ],
              plugins: [
                // Import optimizations
                ['babel-plugin-import', {
                  libraryName: 'react-bootstrap',
                  libraryDirectory: '',
                  camel2DashComponentName: false
                }],
                
                // Development optimizations
                ...(isProduction ? [] : ['react-refresh/babel'])
              ]
            }
          }
        ]
      },
      
      // CSS optimization
      {
        test: /\.css$/,
        use: [
          isProduction ? 'mini-css-extract-plugin' : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: true,
                localIdentName: isProduction ? '[hash:base64:8]' : '[name]__[local]__[hash:base64:5]'
              }
            }
          },
          'postcss-loader'
        ]
      },
      
      // Image optimization
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp|avif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: isProduction ? '[contenthash:8].[ext]' : '[name].[ext]',
              outputPath: 'static/images/'
            }
          },
          ...(isProduction ? [{
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: { progressive: true, quality: 80 },
              optipng: { enabled: false },
              pngquant: { quality: [0.65, 0.8], speed: 4 },
              gifsicle: { interlaced: false },
              webp: { quality: 80 }
            }
          }] : [])
        ]
      }
    ];
  }

  private getMinimizerConfig() {
    return [
      // JavaScript minification
      new (require('terser-webpack-plugin'))({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info'],
            passes: 2
          },
          mangle: {
            safari10: true
          },
          output: {
            comments: false,
            ascii_only: true
          }
        },
        extractComments: false,
        parallel: true
      }),
      
      // CSS minification
      new (require('css-minimizer-webpack-plugin'))({
        minimizerOptions: {
          preset: ['default', {
            discardComments: { removeAll: true },
            normalizeUnicode: false
          }]
        }
      })
    ];
  }

  private getOptimizationPlugins(isProduction: boolean) {
    const plugins = [];

    if (isProduction) {
      // Production plugins
      plugins.push(
        // Bundle analyzer (conditional)
        ...(process.env.ANALYZE ? [
          new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: 'bundle-analysis.html'
          })
        ] : []),
        
        // Compression
        new (require('compression-webpack-plugin'))({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 1024,
          minRatio: 0.8
        }),
        
        // Brotli compression
        new (require('compression-webpack-plugin'))({
          filename: '[path][base].br',
          algorithm: 'brotliCompress',
          test: /\.(js|css|html|svg)$/,
          compressionOptions: { level: 11 },
          threshold: 1024,
          minRatio: 0.8
        }),
        
        // Module concatenation
        new (require('webpack').optimize.ModuleConcatenationPlugin)(),
        
        // Duplicate package checking
        new (require('duplicate-package-checker-webpack-plugin'))({
          verbose: true,
          emitError: false,
          showHelp: false
        })
      );
    } else {
      // Development plugins
      plugins.push(
        new (require('webpack').HotModuleReplacementPlugin)()
      );
    }

    // Build metrics plugin
    plugins.push(this.createMetricsPlugin());

    return plugins;
  }

  private createMetricsPlugin() {
    return class BuildMetricsPlugin {
      apply(compiler: any) {
        let startTime: number;
        
        compiler.hooks.compile.tap('BuildMetricsPlugin', () => {
          startTime = Date.now();
        });
        
        compiler.hooks.done.tap('BuildMetricsPlugin', (stats: any) => {
          const buildTime = Date.now() - startTime;
          const info = stats.toJson();
          
          const metrics: BuildMetrics = {
            buildTime,
            bundleSize: info.assets?.reduce((total: number, asset: any) => total + asset.size, 0) || 0,
            chunkCount: info.chunks?.length || 0,
            moduleCount: info.modules?.length || 0,
            optimizationSavings: 0, // Would calculate from before/after
            timestamp: Date.now()
          };
          
          console.log('\n📈 Build Metrics:');
          console.log(`Build Time: ${buildTime}ms`);
          console.log(`Bundle Size: ${this.formatSize(metrics.bundleSize)}`);
          console.log(`Chunks: ${metrics.chunkCount}`);
          console.log(`Modules: ${metrics.moduleCount}`);
          
          // Store metrics
          if (typeof window === 'undefined') {
            try {
              const fs = require('fs');
              const metricsFile = 'build-metrics.json';
              let allMetrics: BuildMetrics[] = [];
              
              if (fs.existsSync(metricsFile)) {
                allMetrics = JSON.parse(fs.readFileSync(metricsFile, 'utf-8'));
              }
              
              allMetrics.push(metrics);
              
              // Keep last 30 builds
              if (allMetrics.length > 30) {
                allMetrics = allMetrics.slice(-30);
              }
              
              fs.writeFileSync(metricsFile, JSON.stringify(allMetrics, null, 2));
            } catch (error) {
              console.warn('Failed to save build metrics:', error);
            }
          }
        });
      }

      formatSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
          size /= 1024;
          unitIndex++;
        }

        return `${size.toFixed(2)}${units[unitIndex]}`;
      }
    };
  }

  // Performance budget validation
  validatePerformanceBudget(stats: any) {
    const info = stats.toJson();
    const budgets = {
      maxAssetSize: 250 * 1024, // 250KB
      maxEntrypointSize: 250 * 1024, // 250KB
      maxBundleSize: 1024 * 1024 // 1MB total
    };

    const violations: string[] = [];
    
    // Check asset sizes
    info.assets?.forEach((asset: any) => {
      if (asset.size > budgets.maxAssetSize) {
        violations.push(`Asset ${asset.name} (${this.formatSize(asset.size)}) exceeds budget (${this.formatSize(budgets.maxAssetSize)})`);
      }
    });

    // Check entrypoint sizes
    info.entrypoints && Object.entries(info.entrypoints).forEach(([name, entrypoint]: [string, any]) => {
      const size = entrypoint.assets?.reduce((total: number, asset: string) => {
        const assetInfo = info.assets?.find((a: any) => a.name === asset);
        return total + (assetInfo?.size || 0);
      }, 0) || 0;

      if (size > budgets.maxEntrypointSize) {
        violations.push(`Entrypoint ${name} (${this.formatSize(size)}) exceeds budget (${this.formatSize(budgets.maxEntrypointSize)})`);
      }
    });

    return violations;
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)}${units[unitIndex]}`;
  }
}

// Build optimization utilities
export const BuildOptimization = {
  // Create optimized Next.js config
  createNextConfig(baseConfig: any = {}) {
    const optimizer = new WebpackOptimizer();
    
    return {
      ...baseConfig,
      
      // Build optimizations
      experimental: {
        ...baseConfig.experimental,
        optimizeCss: true,
        modularizeImports: {
          'react-bootstrap': {
            transform: 'react-bootstrap/{{member}}'
          },
          'lodash': {
            transform: 'lodash/{{member}}'
          }
        }
      },
      
      // Compiler optimizations
      compiler: {
        ...baseConfig.compiler,
        removeConsole: process.env.NODE_ENV === 'production' ? {
          exclude: ['error', 'warn']
        } : false,
        styledComponents: true
      },
      
      // Webpack customization
      webpack: (config: any, options: any) => {
        const optimizedConfig = optimizer.generateOptimizedConfig(options.isServer);
        
        // Merge configurations
        config.optimization = {
          ...config.optimization,
          ...optimizedConfig.optimization
        };
        
        config.resolve.alias = {
          ...config.resolve.alias,
          ...optimizedConfig.resolve.alias
        };
        
        // Add optimization plugins
        config.plugins.push(...optimizedConfig.plugins);
        
        return baseConfig.webpack ? baseConfig.webpack(config, options) : config;
      }
    };
  },

  // Development build optimizations
  optimizeForDevelopment: {
    // Fast refresh optimization
    fastRefresh: true,
    
    // Build caching
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename]
      }
    },
    
    // Lazy compilation
    experiments: {
      lazyCompilation: {
        entries: false,
        imports: true
      }
    }
  },

  // Production build optimizations
  optimizeForProduction: {
    // Asset optimization
    assetOptimization: true,
    
    // Code splitting
    codeSplitting: 'aggressive',
    
    // Compression
    compression: ['gzip', 'brotli'],
    
    // Tree shaking
    treeShaking: 'aggressive',
    
    // Dead code elimination
    deadCodeElimination: true
  }
};

export default WebpackOptimizer;