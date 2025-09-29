/**
 * Build Optimization System
 * Comprehensive build optimization utilities and tools
 */

// Core optimization modules
export { default as BundleAnalyzer, BundleOptimizer } from './bundle-analyzer';
export { default as TreeShaking, TreeShakingOptimizer, ImportOptimizer, ImportMonitor } from './tree-shaking';
export { default as WebpackOptimizer, BuildOptimization } from './webpack-optimizer';

// Import necessary classes for internal use
import BundleAnalyzer from './bundle-analyzer';
import { TreeShakingOptimizer } from './tree-shaking';
import WebpackOptimizer from './webpack-optimizer';

// Optimization utilities
export const OptimizationUtils = {
  // Format file sizes
  formatSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)}${units[unitIndex]}`;
  },

  // Calculate optimization impact
  calculateImpact: (before: number, after: number): { 
    savings: number; 
    percentage: number; 
    impact: 'low' | 'medium' | 'high' 
  } => {
    const savings = before - after;
    const percentage = before > 0 ? (savings / before) * 100 : 0;
    
    let impact: 'low' | 'medium' | 'high' = 'low';
    if (percentage > 20) impact = 'high';
    else if (percentage > 10) impact = 'medium';
    
    return { savings, percentage, impact };
  },

  // Performance recommendations
  getPerformanceRecommendations: (bundleSize: number, loadTime: number) => {
    const recommendations: string[] = [];
    
    if (bundleSize > 250000) { // 250KB
      recommendations.push('Consider code splitting to reduce initial bundle size');
    }
    
    if (bundleSize > 500000) { // 500KB
      recommendations.push('Bundle size is too large - implement aggressive code splitting');
    }
    
    if (loadTime > 3000) { // 3 seconds
      recommendations.push('Bundle load time is too slow - optimize critical path');
    }
    
    if (loadTime > 5000) { // 5 seconds
      recommendations.push('Implement preloading and caching strategies');
    }
    
    return recommendations;
  }
};

// Main optimization orchestrator
export class BuildOptimizationOrchestrator {
  private bundleAnalyzer: BundleAnalyzer;
  private treeShakingOptimizer: TreeShakingOptimizer;
  private webpackOptimizer: WebpackOptimizer;

  constructor() {
    this.bundleAnalyzer = new BundleAnalyzer();
    this.treeShakingOptimizer = new TreeShakingOptimizer();
    this.webpackOptimizer = new WebpackOptimizer();
  }

  // Run comprehensive optimization analysis
  async runOptimizationAnalysis(statsPath?: string) {
    console.log('🚀 Starting comprehensive build optimization analysis...');
    
    try {
      // Load and analyze bundle
      if (statsPath) {
        await this.bundleAnalyzer.loadStats(statsPath);
      }
      
      const bundleReport = this.bundleAnalyzer.analyzeBundle();
      const treeShakingReport = this.treeShakingOptimizer.generateOptimizations();
      
      // Generate comprehensive report
      const optimizationReport = {
        timestamp: Date.now(),
        bundle: bundleReport,
        treeShaking: {
          optimizations: treeShakingReport,
          unusedExports: this.treeShakingOptimizer.analyzeUnusedImports()
        },
        recommendations: this.generatePrioritizedRecommendations(bundleReport, treeShakingReport),
        performance: {
          bundleSize: bundleReport.totalSize,
          estimatedLoadTime: this.estimateLoadTime(bundleReport.totalSize),
          coreWebVitals: this.estimateCoreWebVitals(bundleReport.totalSize)
        }
      };
      
      console.log('✅ Optimization analysis complete');
      return optimizationReport;
      
    } catch (error) {
      console.error('❌ Optimization analysis failed:', error);
      throw error;
    }
  }

  // Generate webpack configuration with optimizations
  generateOptimizedWebpackConfig(currentConfig: any = {}) {
    const optimizedConfig = this.webpackOptimizer.generateOptimizedConfig();
    
    // Merge with current configuration
    return {
      ...currentConfig,
      ...optimizedConfig,
      optimization: {
        ...currentConfig.optimization,
        ...optimizedConfig.optimization
      },
      resolve: {
        ...currentConfig.resolve,
        ...optimizedConfig.resolve
      },
      module: {
        ...currentConfig.module,
        rules: [
          ...(currentConfig.module?.rules || []),
          ...optimizedConfig.module.rules
        ]
      },
      plugins: [
        ...(currentConfig.plugins || []),
        ...optimizedConfig.plugins
      ]
    };
  }

  private generatePrioritizedRecommendations(bundleReport: any, treeShakingReport: any) {
    const recommendations = [
      ...bundleReport.recommendations,
      ...treeShakingReport.map((opt: any) => ({
        id: `tree-shaking-${opt.module}`,
        type: 'tree-shaking',
        severity: opt.impact,
        title: `Optimize ${opt.module} imports`,
        description: `${opt.type}: ${opt.current} → ${opt.suggested}`,
        impact: {
          sizeReduction: opt.savings,
          performanceGain: 'Reduced bundle size and improved tree shaking'
        }
      }))
    ];

    // Sort by priority
    return recommendations.sort((a, b) => {
      const severityOrder: { [key: string]: number } = { critical: 4, high: 3, medium: 2, low: 1 };
      const aSeverity = severityOrder[a.severity] || 1;
      const bSeverity = severityOrder[b.severity] || 1;
      return bSeverity - aSeverity;
    });
  }

  private estimateLoadTime(bundleSize: number): number {
    // Rough estimation: 3G network (1.6 Mbps = 200 KB/s)
    const networkSpeed = 200 * 1024; // bytes per second
    return (bundleSize / networkSpeed) * 1000; // milliseconds
  }

  private estimateCoreWebVitals(bundleSize: number) {
    // Very rough estimates based on bundle size
    const baseloadTime = this.estimateLoadTime(bundleSize);
    
    return {
      LCP: Math.max(2500, baseloadTime * 1.2), // Largest Contentful Paint
      FID: Math.min(100, bundleSize / 10000), // First Input Delay
      CLS: bundleSize > 500000 ? 0.15 : 0.1    // Cumulative Layout Shift
    };
  }
}

// Export default optimization orchestrator instance
export const buildOptimization = new BuildOptimizationOrchestrator();

export default buildOptimization;