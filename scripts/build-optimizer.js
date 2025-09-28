#!/usr/bin/env node

/**
 * Production Build Optimization Script
 * 
 * This script performs comprehensive build optimization including:
 * - Bundle analysis and size checking
 * - Performance budget validation
 * - Asset optimization verification
 * - Build artifact analysis
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const performanceBudget = require('../performance-budget');

class BuildOptimizer {
  constructor() {
    this.buildDir = '.next';
    this.analyzeDir = './analyze';
    this.results = {
      bundleSizes: {},
      performanceMetrics: {},
      recommendations: [],
      passed: true
    };
  }

  async optimize() {
    console.log('🚀 Starting Production Build Optimization...\n');

    try {
      // Step 1: Clean previous builds
      await this.cleanPreviousBuilds();
      
      // Step 2: Run production build with analysis
      await this.runProductionBuild();
      
      // Step 3: Analyze bundle sizes
      await this.analyzeBundleSizes();
      
      // Step 4: Check performance budgets
      await this.checkPerformanceBudgets();
      
      // Step 5: Generate optimization report
      await this.generateOptimizationReport();
      
      // Step 6: Provide recommendations
      await this.generateRecommendations();
      
      console.log('\n✅ Build optimization completed successfully!');
      
    } catch (error) {
      console.error('❌ Build optimization failed:', error.message);
      process.exit(1);
    }
  }

  async cleanPreviousBuilds() {
    console.log('🧹 Cleaning previous builds...');
    
    const dirsToClean = ['.next', 'build', 'analyze', 'coverage'];
    
    dirsToClean.forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`   ✓ Cleaned ${dir}/`);
      }
    });
  }

  async runProductionBuild() {
    console.log('🔨 Running production build with analysis...');
    
    try {
      // Set production environment
      process.env.NODE_ENV = 'production';
      process.env.ANALYZE = 'true';
      
      // Run Next.js build
      execSync('npx next build', { 
        stdio: 'inherit',
        env: { ...process.env }
      });
      
      console.log('   ✓ Production build completed');
      
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async analyzeBundleSizes() {
    console.log('📊 Analyzing bundle sizes...');
    
    const buildManifest = path.join(this.buildDir, 'build-manifest.json');
    
    if (!fs.existsSync(buildManifest)) {
      console.warn('   ⚠️  Build manifest not found, skipping bundle analysis');
      return;
    }
    
    try {
      const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
      
      // Analyze page bundles
      Object.entries(manifest.pages || {}).forEach(([page, files]) => {
        const totalSize = this.calculateBundleSize(files);
        this.results.bundleSizes[page] = totalSize;
        
        console.log(`   📦 ${page}: ${this.formatBytes(totalSize)}`);
      });
      
    } catch (error) {
      console.warn('   ⚠️  Could not analyze bundle sizes:', error.message);
    }
  }

  calculateBundleSize(files) {
    let totalSize = 0;
    
    files.forEach(file => {
      const filePath = path.join(this.buildDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
    });
    
    return totalSize;
  }

  async checkPerformanceBudgets() {
    console.log('🎯 Checking performance budgets...');
    
    // Check bundle size budgets
    Object.entries(this.results.bundleSizes).forEach(([page, size]) => {
      const budget = performanceBudget.bundles[page];
      
      if (budget) {
        if (size > budget.maxSize) {
          this.results.passed = false;
          this.results.recommendations.push({
            type: 'error',
            page,
            message: `Bundle size ${this.formatBytes(size)} exceeds budget ${this.formatBytes(budget.maxSize)}`
          });
          console.log(`   ❌ ${page}: ${this.formatBytes(size)} > ${this.formatBytes(budget.maxSize)} (EXCEEDED)`);
        } else if (size > budget.warning) {
          this.results.recommendations.push({
            type: 'warning',
            page,
            message: `Bundle size ${this.formatBytes(size)} approaching budget limit`
          });
          console.log(`   ⚠️  ${page}: ${this.formatBytes(size)} > ${this.formatBytes(budget.warning)} (WARNING)`);
        } else {
          console.log(`   ✓ ${page}: ${this.formatBytes(size)} (OK)`);
        }
      }
    });
  }

  async generateOptimizationReport() {
    console.log('📋 Generating optimization report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      buildId: process.env.BUILD_ID || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      bundleSizes: this.results.bundleSizes,
      performanceMetrics: this.results.performanceMetrics,
      recommendations: this.results.recommendations,
      budgets: performanceBudget,
      passed: this.results.passed
    };
    
    // Create reports directory
    const reportsDir = './reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }
    
    // Write detailed JSON report
    const reportFile = path.join(reportsDir, `build-optimization-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // Write human-readable summary
    const summaryFile = path.join(reportsDir, 'build-optimization-summary.txt');
    const summary = this.generateSummary(report);
    fs.writeFileSync(summaryFile, summary);
    
    console.log(`   ✓ Reports saved to ${reportsDir}/`);
  }

  generateSummary(report) {
    let summary = `Build Optimization Summary\n`;
    summary += `=========================\n\n`;
    summary += `Timestamp: ${report.timestamp}\n`;
    summary += `Build ID: ${report.buildId}\n`;
    summary += `Environment: ${report.environment}\n`;
    summary += `Overall Status: ${report.passed ? 'PASSED' : 'FAILED'}\n\n`;
    
    summary += `Bundle Sizes:\n`;
    summary += `-------------\n`;
    Object.entries(report.bundleSizes).forEach(([page, size]) => {
      summary += `${page}: ${this.formatBytes(size)}\n`;
    });
    
    summary += `\nRecommendations:\n`;
    summary += `----------------\n`;
    if (report.recommendations.length === 0) {
      summary += `No recommendations - build is optimal!\n`;
    } else {
      report.recommendations.forEach(rec => {
        summary += `[${rec.type.toUpperCase()}] ${rec.page || 'General'}: ${rec.message}\n`;
      });
    }
    
    return summary;
  }

  async generateRecommendations() {
    console.log('💡 Generating optimization recommendations...');
    
    // General recommendations
    const generalRecs = [
      'Consider implementing code splitting for large pages',
      'Use Next.js Image component for optimized image loading',
      'Implement service worker for offline caching',
      'Consider lazy loading for non-critical components',
      'Optimize third-party script loading with Next.js Script component',
      'Use dynamic imports for admin-only components',
      'Consider removing unused dependencies',
      'Implement preloading for critical resources'
    ];
    
    console.log('\n📝 General Optimization Tips:');
    generalRecs.forEach(rec => {
      console.log(`   💡 ${rec}`);
    });
    
    // Specific recommendations based on analysis
    if (this.results.recommendations.length > 0) {
      console.log('\n🎯 Specific Issues Found:');
      this.results.recommendations.forEach(rec => {
        const icon = rec.type === 'error' ? '❌' : '⚠️';
        console.log(`   ${icon} ${rec.message}`);
      });
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new BuildOptimizer();
  optimizer.optimize().catch(error => {
    console.error('Optimization failed:', error);
    process.exit(1);
  });
}

module.exports = BuildOptimizer;