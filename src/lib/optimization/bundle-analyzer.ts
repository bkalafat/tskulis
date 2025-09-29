/**
 * Bundle Analysis and Optimization Tools
 * Provides utilities for analyzing bundle size, identifying optimization opportunities,
 * and monitoring bundle performance over time
 */

interface BundleChunk {
  id: string;
  name: string;
  size: number;
  gzipSize?: number;
  files: string[];
  modules: BundleModule[];
  parents: string[];
  children: string[];
  origins: Array<{
    module: string;
    moduleIdentifier: string;
    reasons: string[];
  }>;
}

interface BundleModule {
  id: string;
  name: string;
  size: number;
  chunks: string[];
  built: boolean;
  optional: boolean;
  prefetched: boolean;
  reasons: Array<{
    module: string;
    type: string;
    userRequest: string;
  }>;
  source?: string;
}

interface BundleAsset {
  name: string;
  size: number;
  chunks: string[];
  chunkNames: string[];
  info: {
    minimized?: boolean;
    development?: boolean;
    hotModuleReplacement?: boolean;
  };
}

interface BundleStats {
  hash: string;
  version: string;
  time: number;
  builtAt: number;
  publicPath: string;
  outputPath: string;
  assetsByChunkName: { [chunkName: string]: string | string[] };
  assets: BundleAsset[];
  chunks: BundleChunk[];
  modules: BundleModule[];
  entrypoints: {
    [name: string]: {
      chunks: string[];
      assets: string[];
      children: any;
      childAssets: any;
    };
  };
  namedChunkGroups: any;
  errors: string[];
  warnings: string[];
}

interface OptimizationRecommendation {
  id: string;
  type: 'size' | 'duplication' | 'unused' | 'splitting' | 'loading';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: {
    sizeReduction?: number;
    performanceGain?: string;
    loadTimeImprovement?: number;
  };
  solution: {
    action: string;
    code?: string;
    links?: string[];
  };
  modules?: string[];
}

interface BundleReport {
  timestamp: number;
  buildHash: string;
  totalSize: number;
  gzippedSize: number;
  chunkCount: number;
  moduleCount: number;
  assetCount: number;
  recommendations: OptimizationRecommendation[];
  metrics: {
    duplicateModules: Array<{ module: string; occurrences: number; totalSize: number }>;
    largestModules: Array<{ name: string; size: number; percentage: number }>;
    heaviestChunks: Array<{ name: string; size: number; moduleCount: number }>;
    unusedExports?: Array<{ module: string; exports: string[] }>;
  };
  comparison?: {
    previousHash: string;
    sizeChange: number;
    chunkChanges: Array<{ chunk: string; change: number }>;
    newModules: string[];
    removedModules: string[];
  };
}

export class BundleAnalyzer {
  private stats: BundleStats | null = null;
  private previousReport: BundleReport | null = null;
  private thresholds = {
    largeBundleSize: 250 * 1024, // 250KB
    largeChunkSize: 100 * 1024,  // 100KB
    largeModuleSize: 50 * 1024,   // 50KB
    duplicateThreshold: 2,        // 2+ occurrences
    unusedExportThreshold: 0.8    // 80% unused
  };

  constructor(stats?: BundleStats) {
    if (stats) {
      this.stats = stats;
    }
  }

  public async loadStats(statsPath: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Browser environment
        const response = await fetch(statsPath);
        this.stats = await response.json();
      } else {
        // Node.js environment
        const fs = require('fs').promises;
        const statsContent = await fs.readFile(statsPath, 'utf-8');
        this.stats = JSON.parse(statsContent);
      }
      console.log('[Bundle Analyzer] Stats loaded successfully');
    } catch (error) {
      console.error('[Bundle Analyzer] Failed to load stats:', error);
      throw new Error(`Failed to load bundle stats: ${error}`);
    }
  }

  public analyzeBundle(): BundleReport {
    if (!this.stats) {
      throw new Error('Bundle stats not loaded. Call loadStats() first.');
    }

    const report: BundleReport = {
      timestamp: Date.now(),
      buildHash: this.stats.hash,
      totalSize: this.calculateTotalSize(),
      gzippedSize: this.estimateGzippedSize(),
      chunkCount: this.stats.chunks.length,
      moduleCount: this.stats.modules.length,
      assetCount: this.stats.assets.length,
      recommendations: [],
      metrics: {
        duplicateModules: this.findDuplicateModules(),
        largestModules: this.findLargestModules(),
        heaviestChunks: this.findHeaviestChunks(),
      }
    };

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    // Compare with previous report if available
    if (this.previousReport) {
      report.comparison = this.compareReports(this.previousReport, report);
    }

    console.log('[Bundle Analyzer] Analysis complete:', {
      totalSize: this.formatSize(report.totalSize),
      chunks: report.chunkCount,
      modules: report.moduleCount,
      recommendations: report.recommendations.length
    });

    return report;
  }

  private calculateTotalSize(): number {
    if (!this.stats) return 0;

    return this.stats.assets
      .filter(asset => !asset.name.endsWith('.map'))
      .reduce((total, asset) => total + asset.size, 0);
  }

  private estimateGzippedSize(): number {
    // Rough estimation: gzipped size is typically 25-35% of original
    return Math.round(this.calculateTotalSize() * 0.3);
  }

  private findDuplicateModules(): Array<{ module: string; occurrences: number; totalSize: number }> {
    if (!this.stats) return [];

    const moduleOccurrences: { [module: string]: { count: number; totalSize: number } } = {};

    this.stats.modules.forEach(module => {
      // Extract clean module name
      const cleanName = this.getCleanModuleName(module.name);
      
      if (!moduleOccurrences[cleanName]) {
        moduleOccurrences[cleanName] = { count: 0, totalSize: 0 };
      }
      
      moduleOccurrences[cleanName].count++;
      moduleOccurrences[cleanName].totalSize += module.size;
    });

    return Object.entries(moduleOccurrences)
      .filter(([, data]) => data.count >= this.thresholds.duplicateThreshold)
      .map(([module, data]) => ({
        module,
        occurrences: data.count,
        totalSize: data.totalSize
      }))
      .sort((a, b) => b.totalSize - a.totalSize)
      .slice(0, 20);
  }

  private findLargestModules(): Array<{ name: string; size: number; percentage: number }> {
    if (!this.stats) return [];

    const totalSize = this.calculateTotalSize();

    return this.stats.modules
      .filter(module => module.size > this.thresholds.largeModuleSize)
      .map(module => ({
        name: this.getCleanModuleName(module.name),
        size: module.size,
        percentage: (module.size / totalSize) * 100
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 15);
  }

  private findHeaviestChunks(): Array<{ name: string; size: number; moduleCount: number }> {
    if (!this.stats) return [];

    return this.stats.chunks
      .filter(chunk => chunk.size > this.thresholds.largeChunkSize)
      .map(chunk => ({
        name: chunk.name || chunk.id,
        size: chunk.size,
        moduleCount: chunk.modules.length
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);
  }

  private generateRecommendations(report: BundleReport): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Large bundle recommendation
    if (report.totalSize > this.thresholds.largeBundleSize) {
      recommendations.push({
        id: 'large-bundle',
        type: 'size',
        severity: report.totalSize > 500 * 1024 ? 'critical' : 'high',
        title: 'Bundle Size Too Large',
        description: `Total bundle size (${this.formatSize(report.totalSize)}) exceeds recommended threshold (${this.formatSize(this.thresholds.largeBundleSize)})`,
        impact: {
          sizeReduction: report.totalSize - this.thresholds.largeBundleSize,
          loadTimeImprovement: 1000,
          performanceGain: 'Improved initial load time and Core Web Vitals scores'
        },
        solution: {
          action: 'Implement code splitting and lazy loading',
          code: `// Dynamic imports for route-based splitting
const LazyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});`,
          links: ['https://nextjs.org/docs/advanced-features/dynamic-import']
        }
      });
    }

    // Duplicate modules recommendations
    if (report.metrics.duplicateModules.length > 0) {
      const duplicates = report.metrics.duplicateModules.slice(0, 3);
      recommendations.push({
        id: 'duplicate-modules',
        type: 'duplication',
        severity: 'medium',
        title: 'Duplicate Modules Detected',
        description: `Found ${report.metrics.duplicateModules.length} modules included multiple times`,
        impact: {
          sizeReduction: duplicates.reduce((total, dup) => total + (dup.totalSize * 0.7), 0),
          performanceGain: 'Reduced bundle size and improved caching'
        },
        solution: {
          action: 'Configure webpack optimization and externals',
          code: `// webpack.config.js
optimization: {
  splitChunks: {
    cacheGroups: {
      vendor: {
        test: /[\\\\/]node_modules[\\\\/]/,
        name: 'vendors',
        chunks: 'all',
      }
    }
  }
}`,
        },
        modules: duplicates.map(d => d.module)
      });
    }

    // Heavy chunks recommendations
    const heavyChunks = report.metrics.heaviestChunks.filter(chunk => chunk.size > this.thresholds.largeChunkSize);
    if (heavyChunks.length > 0) {
      recommendations.push({
        id: 'heavy-chunks',
        type: 'splitting',
        severity: 'medium',
        title: 'Large Chunks Need Splitting',
        description: `${heavyChunks.length} chunks exceed size threshold`,
        impact: {
          loadTimeImprovement: 800,
          performanceGain: 'Better resource prioritization and caching'
        },
        solution: {
          action: 'Split large chunks into smaller, focused bundles',
          code: `// Dynamic imports for feature splitting
const FeatureModule = lazy(() => 
  import('./features/LargeFeature').then(module => ({
    default: module.LargeFeature
  }))
);`
        },
        modules: heavyChunks.map(c => c.name)
      });
    }

    // Large single modules
    const largeModules = report.metrics.largestModules.filter(mod => mod.size > this.thresholds.largeModuleSize);
    if (largeModules.length > 0) {
      recommendations.push({
        id: 'large-modules',
        type: 'size',
        severity: 'medium',
        title: 'Large Individual Modules',
        description: `${largeModules.length} modules are individually large`,
        impact: {
          sizeReduction: largeModules.reduce((total, mod) => total + mod.size * 0.3, 0),
          performanceGain: 'Reduced parse and execution time'
        },
        solution: {
          action: 'Consider tree shaking, module splitting, or lazy loading',
          code: `// Tree shake large libraries
import { specificFunction } from 'large-library/specific-function';

// Instead of
import * as LargeLibrary from 'large-library';`
        },
        modules: largeModules.slice(0, 5).map(m => m.name)
      });
    }

    return recommendations.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private compareReports(previous: BundleReport, current: BundleReport) {
    return {
      previousHash: previous.buildHash,
      sizeChange: current.totalSize - previous.totalSize,
      chunkChanges: [], // Would need more detailed comparison
      newModules: [], // Would need module-level comparison
      removedModules: [] // Would need module-level comparison
    };
  }

  private getCleanModuleName(moduleName: string): string {
    // Clean up webpack module names
    return moduleName
      .replace(/^.*!/, '') // Remove loaders
      .replace(/\?.*$/, '') // Remove queries
      .replace(/^\.\//, '') // Remove relative path prefix
      .replace(/\/index\.(js|ts|jsx|tsx)$/, '') // Remove index file suffix
      .split('node_modules/').pop() || moduleName;
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex > 0 ? 2 : 0)}${units[unitIndex]}`;
  }

  public setPreviousReport(report: BundleReport): void {
    this.previousReport = report;
  }

  public exportReport(report: BundleReport, format: 'json' | 'html' = 'json'): string {
    if (format === 'html') {
      return this.generateHTMLReport(report);
    }
    return JSON.stringify(report, null, 2);
  }

  private generateHTMLReport(report: BundleReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bundle Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; border-radius: 5px; background: #e9ecef; }
        .recommendation { margin: 10px 0; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }
        .critical { border-color: #dc3545; }
        .high { border-color: #fd7e14; }
        .medium { border-color: #ffc107; }
        .low { border-color: #28a745; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .chart { margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Bundle Analysis Report</h1>
        <div class="metrics">
            <div class="metric">
                <h3>Total Size</h3>
                <p>${this.formatSize(report.totalSize)}</p>
            </div>
            <div class="metric">
                <h3>Gzipped Size</h3>
                <p>${this.formatSize(report.gzippedSize)}</p>
            </div>
            <div class="metric">
                <h3>Chunks</h3>
                <p>${report.chunkCount}</p>
            </div>
            <div class="metric">
                <h3>Modules</h3>
                <p>${report.moduleCount}</p>
            </div>
        </div>

        <h2>Recommendations (${report.recommendations.length})</h2>
        ${report.recommendations.map(rec => `
            <div class="recommendation ${rec.severity}">
                <h3>${rec.title}</h3>
                <p>${rec.description}</p>
                ${rec.impact.sizeReduction ? `<p><strong>Potential Size Reduction:</strong> ${this.formatSize(rec.impact.sizeReduction)}</p>` : ''}
                <div class="solution">
                    <h4>Solution:</h4>
                    <p>${rec.solution.action}</p>
                    ${rec.solution.code ? `<pre><code>${rec.solution.code}</code></pre>` : ''}
                </div>
            </div>
        `).join('')}

        <h2>Largest Modules</h2>
        <table border="1" style="width: 100%; border-collapse: collapse;">
            <tr><th>Module</th><th>Size</th><th>Percentage</th></tr>
            ${report.metrics.largestModules.map(mod => `
                <tr>
                    <td>${mod.name}</td>
                    <td>${this.formatSize(mod.size)}</td>
                    <td>${mod.percentage.toFixed(2)}%</td>
                </tr>
            `).join('')}
        </table>

        <h2>Duplicate Modules</h2>
        <table border="1" style="width: 100%; border-collapse: collapse;">
            <tr><th>Module</th><th>Occurrences</th><th>Total Size</th></tr>
            ${report.metrics.duplicateModules.map(dup => `
                <tr>
                    <td>${dup.module}</td>
                    <td>${dup.occurrences}</td>
                    <td>${this.formatSize(dup.totalSize)}</td>
                </tr>
            `).join('')}
        </table>
    </div>
</body>
</html>`;
  }
}

// Bundle optimization utilities
export const BundleOptimizer = {
  // Analyze current bundle stats
  async analyzeCurrentBundle(statsPath?: string): Promise<BundleReport> {
    const analyzer = new BundleAnalyzer();
    
    if (statsPath) {
      await analyzer.loadStats(statsPath);
    } else {
      // Try to find stats file in common locations
      const commonPaths = [
        '.next/static/chunks/webpack-stats.json',
        'dist/stats.json',
        'build/stats.json'
      ];
      
      for (const path of commonPaths) {
        try {
          await analyzer.loadStats(path);
          break;
        } catch (e) {
          continue;
        }
      }
    }
    
    return analyzer.analyzeBundle();
  },

  // Generate optimization webpack config
  generateOptimizationConfig(report: BundleReport) {
    const config: any = {
      optimization: {
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
            }
          }
        }
      }
    };

    // Add specific optimizations based on report
    if (report.recommendations.some(rec => rec.id === 'duplicate-modules')) {
      config.resolve = {
        alias: {
          // Common duplicate resolution
          'react': require.resolve('react'),
          'react-dom': require.resolve('react-dom'),
        }
      };
    }

    return config;
  },

  // Create webpack plugin for continuous monitoring
  createMonitoringPlugin() {
    return class BundleMonitorPlugin {
      apply(compiler: any) {
        compiler.hooks.done.tap('BundleMonitorPlugin', (stats: any) => {
          const analyzer = new BundleAnalyzer(stats.toJson());
          const report = analyzer.analyzeBundle();
          
          console.log('\n📊 Bundle Analysis:');
          console.log(`Total Size: ${this.formatSize(report.totalSize)}`);
          console.log(`Chunks: ${report.chunkCount}`);
          console.log(`Modules: ${report.moduleCount}`);
          
          if (report.recommendations.length > 0) {
            console.log(`\n⚠️  ${report.recommendations.length} optimization recommendations:`);
            report.recommendations.slice(0, 3).forEach(rec => {
              console.log(`  ${rec.severity.toUpperCase()}: ${rec.title}`);
            });
          }
          
          // Save report for historical tracking
          if (typeof window === 'undefined') {
            const fs = require('fs').promises;
            fs.writeFile(
              `bundle-report-${Date.now()}.json`,
              JSON.stringify(report, null, 2)
            ).catch(console.error);
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

        return `${size.toFixed(unitIndex > 0 ? 2 : 0)}${units[unitIndex]}`;
      }
    };
  }
};

export default BundleAnalyzer;