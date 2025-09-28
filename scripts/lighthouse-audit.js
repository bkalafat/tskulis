/**
 * Automated Lighthouse Performance Audits
 * Runs performance audits and generates reports
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');
const cliProgress = require('cli-progress');

// Audit configuration
const AUDIT_CONFIG = {
  urls: [
    'http://localhost:3000',
    'http://localhost:3000/trabzonspor',
    'http://localhost:3000/transfer',
    'http://localhost:3000/genel',
  ],
  desktop: {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'desktop',
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
      },
    },
  },
  mobile: {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'mobile',
    },
  },
};

// Performance thresholds
const THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 90,
  seo: 95,
  pwa: 80,
};

class LighthouseAuditor {
  constructor() {
    this.results = [];
    this.chrome = null;
    this.progressBar = null;
  }

  // Launch Chrome instance
  async launchChrome() {
    console.log('🚀 Launching Chrome...');
    this.chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    console.log(`✅ Chrome launched on port ${this.chrome.port}`);
    return this.chrome;
  }

  // Run audit for single URL
  async auditUrl(url, config, device) {
    try {
      const options = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
        port: this.chrome.port,
      };

      const runnerResult = await lighthouse(url, options, config);
      
      if (!runnerResult || !runnerResult.artifacts) {
        throw new Error(`Failed to audit ${url}`);
      }

      const { lhr } = runnerResult;
      
      return {
        url,
        device,
        timestamp: new Date().toISOString(),
        scores: {
          performance: Math.round(lhr.categories.performance.score * 100),
          accessibility: Math.round(lhr.categories.accessibility.score * 100),
          'best-practices': Math.round(lhr.categories['best-practices'].score * 100),
          seo: Math.round(lhr.categories.seo.score * 100),
          pwa: Math.round((lhr.categories.pwa?.score || 0) * 100),
        },
        metrics: {
          'first-contentful-paint': lhr.audits['first-contentful-paint'].numericValue,
          'largest-contentful-paint': lhr.audits['largest-contentful-paint'].numericValue,
          'first-meaningful-paint': lhr.audits['first-meaningful-paint'].numericValue,
          'speed-index': lhr.audits['speed-index'].numericValue,
          'cumulative-layout-shift': lhr.audits['cumulative-layout-shift'].numericValue,
          'total-blocking-time': lhr.audits['total-blocking-time'].numericValue,
        },
        opportunities: lhr.audits['opportunities'] ? 
          Object.entries(lhr.audits)
            .filter(([key, audit]) => audit.score !== null && audit.score < 0.9 && audit.details?.type === 'opportunity')
            .map(([key, audit]) => ({
              id: key,
              title: audit.title,
              description: audit.description,
              score: audit.score,
              displayValue: audit.displayValue,
            })) : [],
        diagnostics: Object.entries(lhr.audits)
          .filter(([key, audit]) => audit.score !== null && audit.score < 1 && audit.scoreDisplayMode === 'binary')
          .map(([key, audit]) => ({
            id: key,
            title: audit.title,
            description: audit.description,
            score: audit.score,
          })),
      };
    } catch (error) {
      console.error(`❌ Failed to audit ${url}:`, error.message);
      return {
        url,
        device,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Run full audit suite
  async runAudits() {
    console.log('🔍 Starting Lighthouse audits...');
    
    await this.launchChrome();

    const totalAudits = AUDIT_CONFIG.urls.length * 2; // desktop + mobile
    this.progressBar = new cliProgress.SingleBar({
      format: 'Auditing [{bar}] {percentage}% | {value}/{total} | {url}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
    });
    this.progressBar.start(totalAudits, 0);

    let currentAudit = 0;

    for (const url of AUDIT_CONFIG.urls) {
      // Desktop audit
      this.progressBar.update(currentAudit, { url: `${url} (desktop)` });
      const desktopResult = await this.auditUrl(url, AUDIT_CONFIG.desktop, 'desktop');
      this.results.push(desktopResult);
      currentAudit++;

      // Mobile audit
      this.progressBar.update(currentAudit, { url: `${url} (mobile)` });
      const mobileResult = await this.auditUrl(url, AUDIT_CONFIG.mobile, 'mobile');
      this.results.push(mobileResult);
      currentAudit++;

      // Small delay between audits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.progressBar.stop();
    console.log('✅ All audits completed');
  }

  // Analyze results and generate summary
  generateSummary() {
    const summary = {
      totalAudits: this.results.length,
      successfulAudits: this.results.filter(r => !r.error).length,
      failedAudits: this.results.filter(r => r.error).length,
      timestamp: new Date().toISOString(),
      byUrl: {},
      byDevice: { desktop: [], mobile: [] },
      thresholdViolations: [],
      averageScores: {},
    };

    // Group by URL and device
    this.results.forEach(result => {
      if (result.error) return;

      if (!summary.byUrl[result.url]) {
        summary.byUrl[result.url] = { desktop: null, mobile: null };
      }
      summary.byUrl[result.url][result.device] = result;
      summary.byDevice[result.device].push(result);
    });

    // Calculate average scores
    const successfulResults = this.results.filter(r => !r.error && r.scores);
    if (successfulResults.length > 0) {
      const scoreKeys = Object.keys(successfulResults[0].scores);
      scoreKeys.forEach(key => {
        const scores = successfulResults.map(r => r.scores[key]).filter(s => s > 0);
        summary.averageScores[key] = scores.length > 0 
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;
      });
    }

    // Check threshold violations
    successfulResults.forEach(result => {
      Object.entries(THRESHOLDS).forEach(([category, threshold]) => {
        if (result.scores[category] < threshold) {
          summary.thresholdViolations.push({
            url: result.url,
            device: result.device,
            category,
            score: result.scores[category],
            threshold,
            violation: threshold - result.scores[category],
          });
        }
      });
    });

    return summary;
  }

  // Save results to files
  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportsDir = path.join(process.cwd(), 'lighthouse-reports');
    
    // Ensure reports directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const summary = this.generateSummary();

    // Save detailed results
    const detailedPath = path.join(reportsDir, `lighthouse-detailed-${timestamp}.json`);
    fs.writeFileSync(detailedPath, JSON.stringify(this.results, null, 2));

    // Save summary
    const summaryPath = path.join(reportsDir, `lighthouse-summary-${timestamp}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    // Save latest summary (for CI/CD)
    const latestPath = path.join(reportsDir, 'lighthouse-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(summary, null, 2));

    // Generate HTML report
    await this.generateHtmlReport(summary, reportsDir, timestamp);

    console.log(`📊 Results saved:`);
    console.log(`   Detailed: ${detailedPath}`);
    console.log(`   Summary:  ${summaryPath}`);
    console.log(`   Latest:   ${latestPath}`);

    return { summary, detailedPath, summaryPath, latestPath };
  }

  // Generate HTML report
  async generateHtmlReport(summary, reportsDir, timestamp) {
    const htmlPath = path.join(reportsDir, `lighthouse-report-${timestamp}.html`);
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Lighthouse Audit Report - ${timestamp}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .good { color: #0cce6b; }
        .average { color: #ffa400; }
        .poor { color: #ff4e42; }
        .violations { margin-top: 30px; }
        .violation { background: #fff5f5; border: 1px solid #fed7d7; border-radius: 4px; padding: 15px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e0e0e0; }
        th { background: #f8f9fa; font-weight: 600; }
        .score { font-weight: bold; padding: 4px 8px; border-radius: 4px; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Lighthouse Performance Report</h1>
        <p>Generated: ${new Date(timestamp).toLocaleString()}</p>
        <p>Total Audits: ${summary.successfulAudits}/${summary.totalAudits}</p>
    </div>
    
    <div class="summary">
        ${Object.entries(summary.averageScores).map(([category, score]) => `
            <div class="metric">
                <h3>${category.toUpperCase()}</h3>
                <div class="value ${score >= 90 ? 'good' : score >= 70 ? 'average' : 'poor'}">${score}</div>
            </div>
        `).join('')}
    </div>
    
    <h2>Results by URL and Device</h2>
    <table>
        <thead>
            <tr>
                <th>URL</th>
                <th>Device</th>
                <th>Performance</th>
                <th>Accessibility</th>
                <th>Best Practices</th>
                <th>SEO</th>
                <th>PWA</th>
            </tr>
        </thead>
        <tbody>
            ${this.results.filter(r => !r.error).map(result => `
                <tr>
                    <td><code>${result.url}</code></td>
                    <td>${result.device}</td>
                    ${Object.entries(result.scores).map(([category, score]) => `
                        <td><span class="score" style="background-color: ${score >= 90 ? '#0cce6b' : score >= 70 ? '#ffa400' : '#ff4e42'}">${score}</span></td>
                    `).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    ${summary.thresholdViolations.length > 0 ? `
        <div class="violations">
            <h2>Threshold Violations</h2>
            ${summary.thresholdViolations.map(violation => `
                <div class="violation">
                    <strong>${violation.url}</strong> (${violation.device})<br>
                    ${violation.category}: ${violation.score} (threshold: ${violation.threshold}, deficit: ${violation.violation})
                </div>
            `).join('')}
        </div>
    ` : '<div class="violations"><h2>✅ All thresholds passed!</h2></div>'}
</body>
</html>`;

    fs.writeFileSync(htmlPath, html);
    console.log(`   HTML:     ${htmlPath}`);
  }

  // Cleanup
  async cleanup() {
    if (this.chrome) {
      await this.chrome.kill();
      console.log('🔄 Chrome instance closed');
    }
  }

  // Main audit function
  async audit() {
    try {
      await this.runAudits();
      const { summary } = await this.saveResults();
      
      console.log('\n📈 Audit Summary:');
      console.log(`   Average Performance: ${summary.averageScores.performance || 0}`);
      console.log(`   Threshold Violations: ${summary.thresholdViolations.length}`);
      
      if (summary.thresholdViolations.length > 0) {
        console.log('\n⚠️  Performance issues detected:');
        summary.thresholdViolations.forEach(v => {
          console.log(`   ${v.url} (${v.device}) ${v.category}: ${v.score}/${v.threshold}`);
        });
      }
      
      return summary;
    } finally {
      await this.cleanup();
    }
  }
}

// CLI interface
if (require.main === module) {
  const auditor = new LighthouseAuditor();
  
  auditor.audit()
    .then(summary => {
      const hasViolations = summary.thresholdViolations.length > 0;
      process.exit(hasViolations ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    });
}

module.exports = LighthouseAuditor;