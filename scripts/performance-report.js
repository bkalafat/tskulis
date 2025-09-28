/**
 * Performance Report Generator
 * Generates comprehensive performance analysis and recommendations
 */

const fs = require('fs');
const path = require('path');

class PerformanceReporter {
  constructor(reportsDir = './lighthouse-reports') {
    this.reportsDir = reportsDir;
  }

  // Load latest Lighthouse results
  loadLatestResults() {
    const latestPath = path.join(this.reportsDir, 'lighthouse-latest.json');
    
    if (!fs.existsSync(latestPath)) {
      throw new Error('No performance data found. Run lighthouse audit first.');
    }

    return JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
  }

  // Generate performance insights
  generateInsights(summary) {
    const insights = {
      overall: this.getOverallHealth(summary),
      critical: this.getCriticalIssues(summary),
      recommendations: this.getRecommendations(summary),
      trends: this.getTrends(summary),
    };

    return insights;
  }

  // Calculate overall performance health
  getOverallHealth(summary) {
    const scores = summary.averageScores;
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const avgScore = totalScore / Object.keys(scores).length;

    return {
      score: Math.round(avgScore),
      grade: avgScore >= 90 ? 'A' : avgScore >= 80 ? 'B' : avgScore >= 70 ? 'C' : avgScore >= 60 ? 'D' : 'F',
      status: avgScore >= 80 ? 'Excellent' : avgScore >= 70 ? 'Good' : avgScore >= 60 ? 'Fair' : 'Needs Improvement',
      breakdown: scores,
    };
  }

  // Identify critical performance issues
  getCriticalIssues(summary) {
    const critical = [];
    const high = [];
    const medium = [];

    summary.thresholdViolations.forEach(violation => {
      const issue = {
        type: violation.category,
        url: violation.url,
        device: violation.device,
        current: violation.score,
        target: violation.threshold,
        impact: violation.violation,
      };

      if (violation.violation >= 20) {
        critical.push(issue);
      } else if (violation.violation >= 10) {
        high.push(issue);
      } else {
        medium.push(issue);
      }
    });

    return { critical, high, medium };
  }

  // Generate performance recommendations
  getRecommendations(summary) {
    const recommendations = [];

    // Performance-specific recommendations
    const perfScore = summary.averageScores.performance;
    if (perfScore < 90) {
      recommendations.push({
        priority: 'High',
        category: 'Performance',
        issue: `Performance score is ${perfScore}/100`,
        recommendation: 'Optimize images, minimize JavaScript, enable text compression',
        expectedImprovement: '10-15 points',
      });
    }

    // Accessibility recommendations
    const a11yScore = summary.averageScores.accessibility;
    if (a11yScore < 95) {
      recommendations.push({
        priority: 'High',
        category: 'Accessibility',
        issue: `Accessibility score is ${a11yScore}/100`,
        recommendation: 'Add alt texts, improve color contrast, ensure keyboard navigation',
        expectedImprovement: '5-10 points',
      });
    }

    // SEO recommendations
    const seoScore = summary.averageScores.seo;
    if (seoScore < 95) {
      recommendations.push({
        priority: 'Medium',
        category: 'SEO',
        issue: `SEO score is ${seoScore}/100`,
        recommendation: 'Optimize meta descriptions, improve heading structure, add structured data',
        expectedImprovement: '3-7 points',
      });
    }

    // Device-specific recommendations
    const mobileScores = this.getDeviceScores(summary, 'mobile');
    const desktopScores = this.getDeviceScores(summary, 'desktop');

    if (mobileScores.performance < desktopScores.performance - 10) {
      recommendations.push({
        priority: 'High',
        category: 'Mobile Performance',
        issue: 'Mobile performance significantly lower than desktop',
        recommendation: 'Optimize for mobile: reduce bundle size, lazy load images, minimize third-party scripts',
        expectedImprovement: '5-15 points',
      });
    }

    return recommendations.sort((a, b) => {
      const priority = { High: 3, Medium: 2, Low: 1 };
      return priority[b.priority] - priority[a.priority];
    });
  }

  // Get device-specific scores
  getDeviceScores(summary, device) {
    const deviceResults = summary.byDevice[device] || [];
    if (deviceResults.length === 0) return {};

    const scores = {};
    Object.keys(summary.averageScores).forEach(category => {
      const categoryScores = deviceResults
        .filter(result => result.scores && result.scores[category])
        .map(result => result.scores[category]);
      
      scores[category] = categoryScores.length > 0 
        ? Math.round(categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length)
        : 0;
    });

    return scores;
  }

  // Analyze performance trends (placeholder for historical data)
  getTrends(summary) {
    return {
      direction: 'stable',
      period: '30 days',
      changes: [],
      note: 'Historical trend analysis requires multiple audit runs over time',
    };
  }

  // Generate console report
  generateConsoleReport() {
    const summary = this.loadLatestResults();
    const insights = this.generateInsights(summary);

    console.log('\n🔍 PERFORMANCE ANALYSIS REPORT');
    console.log('=' .repeat(60));
    console.log(`Generated: ${new Date().toLocaleString()}`);
    console.log(`Based on: ${summary.totalAudits} audits (${summary.successfulAudits} successful)`);

    // Overall Health
    console.log('\n📊 OVERALL HEALTH');
    console.log('-'.repeat(30));
    console.log(`Grade: ${insights.overall.grade} (${insights.overall.score}/100)`);
    console.log(`Status: ${insights.overall.status}`);
    
    console.log('\nScore Breakdown:');
    Object.entries(insights.overall.breakdown).forEach(([category, score]) => {
      const status = score >= 90 ? '✅' : score >= 80 ? '⚠️' : '❌';
      console.log(`  ${status} ${category.padEnd(15)}: ${score}/100`);
    });

    // Critical Issues
    if (insights.critical.critical.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES');
      console.log('-'.repeat(30));
      insights.critical.critical.forEach(issue => {
        console.log(`❌ ${issue.type} on ${issue.url} (${issue.device})`);
        console.log(`   Current: ${issue.current}, Target: ${issue.target}, Gap: ${issue.impact}`);
      });
    }

    // High Priority Issues
    if (insights.critical.high.length > 0) {
      console.log('\n⚠️  HIGH PRIORITY ISSUES');
      console.log('-'.repeat(30));
      insights.critical.high.forEach(issue => {
        console.log(`⚠️  ${issue.type} on ${issue.url} (${issue.device})`);
        console.log(`   Current: ${issue.current}, Target: ${issue.target}, Gap: ${issue.impact}`);
      });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(30));
    insights.recommendations.slice(0, 5).forEach((rec, index) => {
      const priority = rec.priority === 'High' ? '🔥' : rec.priority === 'Medium' ? '⚡' : '💭';
      console.log(`${index + 1}. ${priority} ${rec.category}: ${rec.issue}`);
      console.log(`   Action: ${rec.recommendation}`);
      console.log(`   Expected: +${rec.expectedImprovement}\n`);
    });

    // Device Comparison
    const mobileScores = this.getDeviceScores(summary, 'mobile');
    const desktopScores = this.getDeviceScores(summary, 'desktop');

    if (Object.keys(mobileScores).length > 0 && Object.keys(desktopScores).length > 0) {
      console.log('\n📱 DEVICE COMPARISON');
      console.log('-'.repeat(30));
      console.log('Category         Mobile    Desktop   Difference');
      Object.keys(summary.averageScores).forEach(category => {
        const mobile = mobileScores[category] || 0;
        const desktop = desktopScores[category] || 0;
        const diff = desktop - mobile;
        const diffStr = diff > 0 ? `+${diff}` : diff.toString();
        console.log(`${category.padEnd(15)} ${mobile.toString().padStart(6)}    ${desktop.toString().padStart(6)}    ${diffStr.padStart(6)}`);
      });
    }

    console.log('\n📈 NEXT STEPS');
    console.log('-'.repeat(30));
    if (insights.overall.score >= 90) {
      console.log('✅ Excellent performance! Focus on maintaining these levels.');
      console.log('   • Set up monitoring alerts for performance regressions');
      console.log('   • Run audits weekly to catch issues early');
    } else if (insights.overall.score >= 80) {
      console.log('👍 Good performance with room for improvement.');
      console.log('   • Address high-priority recommendations first');
      console.log('   • Focus on mobile optimization');
    } else {
      console.log('🔧 Performance needs attention.');
      console.log('   • Address critical issues immediately');
      console.log('   • Implement performance budget');
      console.log('   • Consider performance-first development approach');
    }

    console.log('\n' + '='.repeat(60));
    
    return insights;
  }

  // Generate JSON report for CI/CD
  generateJsonReport(outputPath) {
    const summary = this.loadLatestResults();
    const insights = this.generateInsights(summary);

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        score: insights.overall.score,
        grade: insights.overall.grade,
        status: insights.overall.status,
      },
      scores: insights.overall.breakdown,
      issues: {
        critical: insights.critical.critical.length,
        high: insights.critical.high.length,
        medium: insights.critical.medium.length,
      },
      recommendations: insights.recommendations.length,
      passed: insights.critical.critical.length === 0,
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    return report;
  }
}

// CLI interface
if (require.main === module) {
  const reporter = new PerformanceReporter();
  
  try {
    // Generate console report
    const insights = reporter.generateConsoleReport();
    
    // Generate JSON report for CI/CD
    const jsonPath = './lighthouse-reports/performance-report.json';
    const report = reporter.generateJsonReport(jsonPath);
    console.log(`\n📄 JSON report saved: ${jsonPath}`);
    
    // Exit with error code if critical issues found
    const hasCritical = insights.critical.critical.length > 0;
    process.exit(hasCritical ? 1 : 0);
  } catch (error) {
    console.error('❌ Report generation failed:', error.message);
    process.exit(1);
  }
}

module.exports = PerformanceReporter;