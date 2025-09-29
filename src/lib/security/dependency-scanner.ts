/**
 * Dependency Security Scanner
 * Automated security vulnerability scanning and reporting
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Vulnerability severity levels
export type VulnerabilitySeverity = 'low' | 'moderate' | 'high' | 'critical';

// Vulnerability information
export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: VulnerabilitySeverity;
  packageName: string;
  installedVersion: string;
  vulnerableVersions: string;
  patchedVersions: string;
  cwe: string[] | undefined;
  cvss: {
    score: number;
    vector: string;
  } | undefined;
  references: string[];
  reportedBy: string;
  publishedDate: string;
  updatedDate: string;
  recommendation: string;
  exploitability: 'low' | 'medium' | 'high' | undefined;
}

// Scan results
export interface SecurityScanResult {
  scanDate: string;
  totalVulnerabilities: number;
  vulnerabilities: Vulnerability[];
  summary: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
  affectedPackages: string[];
  riskScore: number;
  recommendations: string[];
}

// Scanner configuration
interface ScannerConfig {
  includeDev: boolean;
  severity: VulnerabilitySeverity[];
  excludePackages: string[];
  outputFormat: 'json' | 'table' | 'csv';
  maxAge: number; // Max age of vulnerability database in hours
  failOnSeverity?: VulnerabilitySeverity;
  reportPath?: string;
}

// Default configuration
const defaultConfig: ScannerConfig = {
  includeDev: false,
  severity: ['low', 'moderate', 'high', 'critical'],
  excludePackages: [],
  outputFormat: 'json',
  maxAge: 24,
  reportPath: './security-report.json'
};

export class DependencySecurityScanner {
  private config: ScannerConfig;
  private lastScanResult: SecurityScanResult | null = null;

  constructor(config: Partial<ScannerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // Run full security audit
  async runAudit(): Promise<SecurityScanResult> {
    console.log('🔍 Starting dependency security scan...');

    try {
      // Update vulnerability database first
      await this.updateDatabase();

      // Run npm audit
      const auditResult = await this.runNpmAudit();

      // Parse and process results
      const scanResult = await this.processAuditResults(auditResult);

      // Store last scan result
      this.lastScanResult = scanResult;

      // Save report if path is configured
      if (this.config.reportPath) {
        await this.saveReport(scanResult);
      }

      // Log summary
      this.logScanSummary(scanResult);

      return scanResult;
    } catch (error) {
      console.error('❌ Security scan failed:', error);
      throw error;
    }
  }

  // Run quick vulnerability check
  async quickCheck(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('npm audit --audit-level=high --json');
      const auditData = JSON.parse(stdout);
      
      return auditData.metadata?.vulnerabilities?.high > 0 || 
             auditData.metadata?.vulnerabilities?.critical > 0;
    } catch (error) {
      console.error('Quick security check failed:', error);
      return true; // Assume vulnerabilities if check fails
    }
  }

  // Update vulnerability database
  private async updateDatabase(): Promise<void> {
    try {
      console.log('📦 Updating vulnerability database...');
      await execAsync('npm update');
      console.log('✅ Vulnerability database updated');
    } catch (error) {
      console.warn('⚠️ Failed to update vulnerability database:', error);
    }
  }

  // Run npm audit command
  private async runNpmAudit(): Promise<any> {
    const auditLevel = this.config.severity.includes('low') ? 'low' : 'moderate';
    const prodOnly = this.config.includeDev ? '' : '--production';
    
    try {
      const { stdout } = await execAsync(`npm audit --json --audit-level=${auditLevel} ${prodOnly}`);
      return JSON.parse(stdout);
    } catch (error: any) {
      // npm audit exits with code 1 when vulnerabilities are found
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch (parseError) {
          console.error('Failed to parse audit output:', parseError);
          throw parseError;
        }
      }
      throw error;
    }
  }

  // Process audit results into structured format
  private async processAuditResults(auditData: any): Promise<SecurityScanResult> {
    const vulnerabilities: Vulnerability[] = [];
    const affectedPackages = new Set<string>();

    // Process vulnerabilities from audit data
    if (auditData.vulnerabilities) {
      for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities)) {
        const vulnInfo = vulnData as any;
        
        // Skip if package is excluded
        if (this.config.excludePackages.includes(packageName)) {
          continue;
        }

        // Process each vulnerability
        for (const advisory of vulnInfo.via || []) {
          if (typeof advisory === 'object' && advisory.id) {
            const vulnerability: Vulnerability = {
              id: advisory.id.toString(),
              title: advisory.title || 'Unknown vulnerability',
              description: advisory.overview || advisory.title || '',
              severity: this.mapSeverity(advisory.severity),
              packageName,
              installedVersion: vulnInfo.nodes?.[0] || 'unknown',
              vulnerableVersions: advisory.vulnerable_versions || '*',
              patchedVersions: advisory.patched_versions || 'none',
              cwe: advisory.cwe || [],
              cvss: advisory.cvss ? {
                score: advisory.cvss.score || 0,
                vector: advisory.cvss.vector || ''
              } : undefined,
              references: advisory.references || [],
              reportedBy: 'npm audit',
              publishedDate: advisory.created || new Date().toISOString(),
              updatedDate: advisory.updated || new Date().toISOString(),
              recommendation: this.generateRecommendation(advisory, vulnInfo),
              exploitability: this.assessExploitability(advisory)
            };

            // Filter by severity
            if (this.config.severity.includes(vulnerability.severity)) {
              vulnerabilities.push(vulnerability);
              affectedPackages.add(packageName);
            }
          }
        }
      }
    }

    // Calculate summary
    const summary = {
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      moderate: vulnerabilities.filter(v => v.severity === 'moderate').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length
    };

    // Calculate risk score
    const riskScore = this.calculateRiskScore(summary);

    // Generate recommendations
    const recommendations = this.generateRecommendations(vulnerabilities);

    return {
      scanDate: new Date().toISOString(),
      totalVulnerabilities: vulnerabilities.length,
      vulnerabilities,
      summary,
      affectedPackages: Array.from(affectedPackages),
      riskScore,
      recommendations
    };
  }

  // Map npm audit severity to our format
  private mapSeverity(severity: string): VulnerabilitySeverity {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'moderate': return 'moderate';
      case 'low': return 'low';
      default: return 'moderate';
    }
  }

  // Generate recommendation for vulnerability
  private generateRecommendation(advisory: any, vulnInfo: any): string {
    if (advisory.patched_versions && advisory.patched_versions !== 'none') {
      return `Update ${vulnInfo.name || 'package'} to version ${advisory.patched_versions}`;
    }
    
    if (advisory.url) {
      return `Review security advisory: ${advisory.url}`;
    }
    
    return 'Review and update the affected package';
  }

  // Assess exploitability level
  private assessExploitability(advisory: any): 'low' | 'medium' | 'high' {
    const cvssScore = advisory.cvss?.score || 0;
    
    if (cvssScore >= 7) return 'high';
    if (cvssScore >= 4) return 'medium';
    return 'low';
  }

  // Calculate overall risk score
  private calculateRiskScore(summary: SecurityScanResult['summary']): number {
    const weights = { critical: 10, high: 7, moderate: 4, low: 1 };
    
    return (
      summary.critical * weights.critical +
      summary.high * weights.high +
      summary.moderate * weights.moderate +
      summary.low * weights.low
    );
  }

  // Generate general recommendations
  private generateRecommendations(vulnerabilities: Vulnerability[]): string[] {
    const recommendations: string[] = [];
    
    if (vulnerabilities.length === 0) {
      recommendations.push('✅ No security vulnerabilities detected');
      return recommendations;
    }

    // Critical vulnerabilities
    const critical = vulnerabilities.filter(v => v.severity === 'critical');
    if (critical.length > 0) {
      recommendations.push(`🚨 URGENT: Fix ${critical.length} critical vulnerabilities immediately`);
    }

    // High vulnerabilities
    const high = vulnerabilities.filter(v => v.severity === 'high');
    if (high.length > 0) {
      recommendations.push(`⚠️ HIGH: Address ${high.length} high-severity vulnerabilities soon`);
    }

    // Update recommendations
    const outdatedPackages = [...new Set(vulnerabilities.map(v => v.packageName))];
    if (outdatedPackages.length > 0) {
      recommendations.push(`📦 Update packages: ${outdatedPackages.slice(0, 5).join(', ')}${outdatedPackages.length > 5 ? '...' : ''}`);
    }

    // Automated fix
    recommendations.push('🔧 Run `npm audit fix` to automatically resolve fixable vulnerabilities');
    
    // Manual review
    const unfixable = vulnerabilities.filter(v => v.patchedVersions === 'none');
    if (unfixable.length > 0) {
      recommendations.push(`👀 Manual review required for ${unfixable.length} vulnerabilities without patches`);
    }

    return recommendations;
  }

  // Save scan report to file
  private async saveReport(scanResult: SecurityScanResult): Promise<void> {
    if (!this.config.reportPath) return;

    try {
      const fs = await import('fs');
      const path = await import('path');

      // Ensure directory exists
      const dir = path.dirname(this.config.reportPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Save report based on format
      switch (this.config.outputFormat) {
        case 'json':
          fs.writeFileSync(this.config.reportPath, JSON.stringify(scanResult, null, 2));
          break;
          
        case 'csv':
          const csvContent = this.formatAsCSV(scanResult);
          fs.writeFileSync(this.config.reportPath.replace('.json', '.csv'), csvContent);
          break;
          
        case 'table':
          const tableContent = this.formatAsTable(scanResult);
          fs.writeFileSync(this.config.reportPath.replace('.json', '.txt'), tableContent);
          break;
      }

      console.log(`📄 Security report saved to ${this.config.reportPath}`);
    } catch (error) {
      console.error('Failed to save security report:', error);
    }
  }

  // Format results as CSV
  private formatAsCSV(scanResult: SecurityScanResult): string {
    const headers = [
      'ID', 'Package', 'Severity', 'Title', 'Installed Version',
      'Vulnerable Versions', 'Patched Versions', 'CVSS Score'
    ];

    const rows = scanResult.vulnerabilities.map(vuln => [
      vuln.id,
      vuln.packageName,
      vuln.severity,
      vuln.title,
      vuln.installedVersion,
      vuln.vulnerableVersions,
      vuln.patchedVersions,
      vuln.cvss?.score?.toString() || 'N/A'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Format results as table
  private formatAsTable(scanResult: SecurityScanResult): string {
    let output = `Security Scan Report - ${scanResult.scanDate}\n`;
    output += '='.repeat(50) + '\n\n';
    
    output += `Total Vulnerabilities: ${scanResult.totalVulnerabilities}\n`;
    output += `Risk Score: ${scanResult.riskScore}\n\n`;
    
    output += 'Summary:\n';
    output += `  Critical: ${scanResult.summary.critical}\n`;
    output += `  High: ${scanResult.summary.high}\n`;
    output += `  Moderate: ${scanResult.summary.moderate}\n`;
    output += `  Low: ${scanResult.summary.low}\n\n`;
    
    if (scanResult.vulnerabilities.length > 0) {
      output += 'Vulnerabilities:\n';
      output += '-'.repeat(30) + '\n';
      
      scanResult.vulnerabilities.forEach((vuln, index) => {
        output += `${index + 1}. ${vuln.title} (${vuln.severity.toUpperCase()})\n`;
        output += `   Package: ${vuln.packageName}@${vuln.installedVersion}\n`;
        output += `   Recommendation: ${vuln.recommendation}\n\n`;
      });
    }
    
    return output;
  }

  // Log scan summary to console
  private logScanSummary(scanResult: SecurityScanResult): void {
    console.log('\n📊 Security Scan Summary');
    console.log('========================');
    console.log(`Total vulnerabilities: ${scanResult.totalVulnerabilities}`);
    console.log(`Risk Score: ${scanResult.riskScore}`);
    
    if (scanResult.summary.critical > 0) {
      console.log(`🚨 Critical: ${scanResult.summary.critical}`);
    }
    if (scanResult.summary.high > 0) {
      console.log(`⚠️  High: ${scanResult.summary.high}`);
    }
    if (scanResult.summary.moderate > 0) {
      console.log(`⚡ Moderate: ${scanResult.summary.moderate}`);
    }
    if (scanResult.summary.low > 0) {
      console.log(`ℹ️  Low: ${scanResult.summary.low}`);
    }
    
    console.log('\n📋 Recommendations:');
    scanResult.recommendations.forEach(rec => {
      console.log(`  ${rec}`);
    });
  }

  // Check if scan should fail build
  shouldFailBuild(scanResult: SecurityScanResult): boolean {
    if (!this.config.failOnSeverity) return false;

    const severityLevels: Record<VulnerabilitySeverity, number> = {
      low: 1,
      moderate: 2,
      high: 3,
      critical: 4
    };

    const threshold = severityLevels[this.config.failOnSeverity];

    return scanResult.vulnerabilities.some(vuln => 
      severityLevels[vuln.severity] >= threshold
    );
  }

  // Get last scan result
  getLastScanResult(): SecurityScanResult | null {
    return this.lastScanResult;
  }

  // Update scanner configuration
  updateConfig(newConfig: Partial<ScannerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Run automated fix for vulnerabilities
  async runAutomaticFix(): Promise<void> {
    console.log('🔧 Running automatic vulnerability fixes...');
    
    try {
      const { stdout, stderr } = await execAsync('npm audit fix --force');
      
      if (stdout) {
        console.log('Fix output:', stdout);
      }
      
      if (stderr) {
        console.warn('Fix warnings:', stderr);
      }
      
      console.log('✅ Automatic fixes completed');
    } catch (error) {
      console.error('❌ Automatic fix failed:', error);
      throw error;
    }
  }
}

// Security scanner utilities
export const SecurityUtils = {
  // Check if a package version is vulnerable
  isVulnerableVersion(version: string, vulnerableRange: string): boolean {
    // This is a simplified version - use semver library for production
    return vulnerableRange.includes(version) || vulnerableRange === '*';
  },

  // Get severity color for console output
  getSeverityColor(severity: VulnerabilitySeverity): string {
    const colors = {
      critical: '\x1b[41m', // Red background
      high: '\x1b[91m',     // Bright red
      moderate: '\x1b[93m',  // Bright yellow
      low: '\x1b[94m'        // Bright blue
    };
    return colors[severity] || '\x1b[0m';
  },

  // Format vulnerability for display
  formatVulnerability(vuln: Vulnerability): string {
    const color = this.getSeverityColor(vuln.severity);
    const reset = '\x1b[0m';
    
    return `${color}${vuln.severity.toUpperCase()}${reset} ${vuln.packageName}: ${vuln.title}`;
  }
};

// Global security scanner instance
export const globalSecurityScanner = new DependencySecurityScanner({
  reportPath: './docs/security-report.json',
  failOnSeverity: 'high'
});

export default DependencySecurityScanner;