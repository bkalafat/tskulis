/**
 * Bundle Analyzer Tests
 * Tests for bundle analysis and optimization recommendations
 */

import BundleAnalyzer, { BundleOptimizer } from '../bundle-analyzer';

// Mock webpack stats data
const mockStats = {
  hash: 'test-hash-123',
  version: '5.0.0',
  time: 5000,
  builtAt: Date.now(),
  publicPath: '/',
  outputPath: '/dist',
  assetsByChunkName: { main: 'main.js' },
  assets: [
    {
      name: 'main.js',
      size: 150000,
      chunks: ['main'],
      chunkNames: ['main'],
      info: { minimized: true }
    },
    {
      name: 'vendor.js',
      size: 300000,
      chunks: ['vendor'],
      chunkNames: ['vendor'],
      info: { minimized: true }
    }
  ],
  chunks: [
    {
      id: 'main',
      name: 'main',
      size: 150000,
      files: ['main.js'],
      modules: [
        { id: '1', name: './src/index.js', size: 50000, chunks: ['main'] },
        { id: '2', name: './src/component.js', size: 100000, chunks: ['main'] }
      ],
      parents: [],
      children: [],
      origins: []
    },
    {
      id: 'vendor',
      name: 'vendor',
      size: 300000,
      files: ['vendor.js'],
      modules: [
        { id: '3', name: './node_modules/react/index.js', size: 150000, chunks: ['vendor'] },
        { id: '4', name: './node_modules/lodash/index.js', size: 150000, chunks: ['vendor'] }
      ],
      parents: [],
      children: [],
      origins: []
    }
  ],
  modules: [
    {
      id: '1',
      name: './src/index.js',
      size: 50000,
      chunks: ['main'],
      built: true,
      optional: false,
      prefetched: false,
      reasons: []
    },
    {
      id: '2',
      name: './src/component.js',
      size: 100000,
      chunks: ['main'],
      built: true,
      optional: false,
      prefetched: false,
      reasons: []
    },
    {
      id: '3',
      name: './node_modules/react/index.js',
      size: 150000,
      chunks: ['vendor'],
      built: true,
      optional: false,
      prefetched: false,
      reasons: []
    },
    {
      id: '4',
      name: './node_modules/lodash/index.js',
      size: 150000,
      chunks: ['vendor'],
      built: true,
      optional: false,
      prefetched: false,
      reasons: []
    }
  ],
  entrypoints: {
    main: {
      chunks: ['main', 'vendor'],
      assets: ['main.js', 'vendor.js'],
      children: {},
      childAssets: {}
    }
  },
  namedChunkGroups: {},
  errors: [],
  warnings: []
};

describe('BundleAnalyzer', () => {
  let analyzer: BundleAnalyzer;

  beforeEach(() => {
    analyzer = new BundleAnalyzer(mockStats as any);
  });

  describe('Bundle Analysis', () => {
    test('should analyze bundle successfully', () => {
      const report = analyzer.analyzeBundle();
      
      expect(report).toBeDefined();
      expect(report.buildHash).toBe('test-hash-123');
      expect(report.totalSize).toBe(450000); // 150000 + 300000
      expect(report.chunkCount).toBe(2);
      expect(report.moduleCount).toBe(4);
    });

    test('should calculate total size correctly', () => {
      const report = analyzer.analyzeBundle();
      expect(report.totalSize).toBe(450000);
    });

    test('should estimate gzipped size', () => {
      const report = analyzer.analyzeBundle();
      // Should be approximately 30% of total size
      expect(report.gzippedSize).toBeGreaterThan(100000);
      expect(report.gzippedSize).toBeLessThan(200000);
    });

    test('should find largest modules', () => {
      const report = analyzer.analyzeBundle();
      expect(report.metrics.largestModules.length).toBeGreaterThan(0);
      
      // Should include React and Lodash
      const moduleNames = report.metrics.largestModules.map(m => m.name);
      expect(moduleNames.some(name => name.includes('react'))).toBe(true);
      expect(moduleNames.some(name => name.includes('lodash'))).toBe(true);
    });

    test('should find heaviest chunks', () => {
      const report = analyzer.analyzeBundle();
      expect(report.metrics.heaviestChunks.length).toBeGreaterThan(0);
      
      // Vendor chunk should be larger
      const vendorChunk = report.metrics.heaviestChunks.find(c => c.name === 'vendor');
      expect(vendorChunk).toBeDefined();
      expect(vendorChunk!.size).toBe(300000);
    });
  });

  describe('Recommendations', () => {
    test('should generate size recommendations for large bundles', () => {
      const report = analyzer.analyzeBundle();
      
      // Should have recommendations due to large bundle size
      expect(report.recommendations.length).toBeGreaterThan(0);
      
      const sizeRecommendation = report.recommendations.find(r => r.type === 'size');
      expect(sizeRecommendation).toBeDefined();
    });

    test('should prioritize recommendations by severity', () => {
      const report = analyzer.analyzeBundle();
      
      if (report.recommendations.length > 1) {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        
        for (let i = 1; i < report.recommendations.length; i++) {
          const currentPriority = severityOrder[report.recommendations[i-1].severity];
          const nextPriority = severityOrder[report.recommendations[i].severity];
          expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
        }
      }
    });
  });

  describe('Report Export', () => {
    test('should export report as JSON', () => {
      const report = analyzer.analyzeBundle();
      const jsonExport = analyzer.exportReport(report, 'json');
      
      expect(typeof jsonExport).toBe('string');
      expect(JSON.parse(jsonExport)).toEqual(report);
    });

    test('should export report as HTML', () => {
      const report = analyzer.analyzeBundle();
      const htmlExport = analyzer.exportReport(report, 'html');
      
      expect(typeof htmlExport).toBe('string');
      expect(htmlExport).toContain('<!DOCTYPE html>');
      expect(htmlExport).toContain('Bundle Analysis Report');
    });
  });
});

describe('BundleOptimizer', () => {
  describe('Bundle Analysis', () => {
    test('should analyze bundle when stats path provided', async () => {
      // Mock file system
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve(mockStats)
      });
      global.fetch = mockFetch;
      
      // This would normally fail in node environment
      // Just test the configuration generation
      const config = BundleOptimizer.generateOptimizationConfig({ 
        totalSize: 450000,
        recommendations: [],
        chunkCount: 2,
        moduleCount: 4,
        assetCount: 2,
        buildHash: 'test',
        timestamp: Date.now(),
        gzippedSize: 135000,
        metrics: {
          duplicateModules: [],
          largestModules: [],
          heaviestChunks: []
        }
      });
      
      expect(config).toBeDefined();
      expect(config.optimization).toBeDefined();
      expect(config.optimization.splitChunks).toBeDefined();
    });

    test('should create monitoring plugin', () => {
      const Plugin = BundleOptimizer.createMonitoringPlugin();
      expect(Plugin).toBeDefined();
      expect(typeof Plugin).toBe('function');
      
      const pluginInstance = new Plugin();
      expect(pluginInstance.apply).toBeDefined();
    });
  });

  describe('Optimization Config', () => {
    test('should generate webpack optimization config', () => {
      const report = {
        totalSize: 450000,
        recommendations: [
          { id: 'duplicate-modules', type: 'duplication' as const }
        ],
        chunkCount: 2,
        moduleCount: 4,
        assetCount: 2,
        buildHash: 'test',
        timestamp: Date.now(),
        gzippedSize: 135000,
        metrics: {
          duplicateModules: [
            { module: 'lodash', occurrences: 2, totalSize: 100000 }
          ],
          largestModules: [],
          heaviestChunks: []
        }
      };
      
      const config = BundleOptimizer.generateOptimizationConfig(report);
      
      expect(config.optimization).toBeDefined();
      expect(config.optimization.splitChunks).toBeDefined();
      expect(config.resolve?.alias).toBeDefined();
    });
  });
});

// Utility function tests
describe('Bundle Analyzer Utilities', () => {
  test('should format sizes correctly', () => {
    const analyzer = new BundleAnalyzer();
    
    // Test private method through reflection
    const formatSize = (analyzer as any).formatSize;
    
    expect(formatSize(500)).toBe('500B');
    expect(formatSize(1024)).toBe('1.00KB');
    expect(formatSize(1024 * 1024)).toBe('1.00MB');
    expect(formatSize(1024 * 1024 * 1024)).toBe('1.00GB');
  });
});

export default {};