/**
 * Security Monitoring Dashboard Component
 * Real-time security status and vulnerability monitoring
 */

import React, { useState, useEffect } from 'react';

interface SecurityStatus {
  timestamp: string;
  environment: string;
  headerSecurity?: any;
  dependencyScan?: any;
  systemSecurity?: any;
}

const SecurityDashboard: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);

  const fetchSecurityStatus = async (type: string = 'all') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/security/status?type=${type}`);
      const data = await response.json();
      
      if (data.success) {
        setSecurityStatus(data.data);
      } else {
        setError(data.message || 'Failed to fetch security status');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  const getTestStatusClass = (passed: boolean) => {
    return passed ? 'badge-success' : 'badge-danger';
  };

  const getRiskScoreClass = (score: number) => {
    if (score >= 8) return 'badge-danger';
    if (score >= 6) return 'badge-warning';
    if (score >= 4) return 'badge-info';
    return 'badge-success';
  };

  const showTestDetails = (test: any) => {
    setSelectedTest(test);
    setShowDetails(true);
  };

  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Security Dashboard Error</h4>
        <p>{error}</p>
        <button className="btn btn-outline-danger" onClick={() => fetchSecurityStatus()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="security-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🔐 Security Dashboard</h2>
        <div className="btn-group" role="group">
          <button 
            className="btn btn-outline-primary" 
            onClick={() => fetchSecurityStatus('headers')}
            disabled={loading}
          >
            Headers
          </button>
          <button 
            className="btn btn-outline-primary" 
            onClick={() => fetchSecurityStatus('dependencies')}
            disabled={loading}
          >
            Dependencies
          </button>
          <button 
            className="btn btn-outline-primary" 
            onClick={() => fetchSecurityStatus('system')}
            disabled={loading}
          >
            System
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => fetchSecurityStatus('all')}
            disabled={loading}
          >
            {loading ? 'Scanning...' : 'Full Scan'}
          </button>
        </div>
      </div>

      {securityStatus && (
        <>
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-header bg-primary text-white">
                  <strong>Environment Status</strong>
                </div>
                <div className="card-body">
                  <span className={`badge ${securityStatus.environment === 'production' ? 'badge-success' : 'badge-warning'}`}>
                    {securityStatus.environment.toUpperCase()}
                  </span>
                  <small className="text-muted d-block mt-2">
                    Last Updated: {new Date(securityStatus.timestamp).toLocaleString()}
                  </small>
                </div>
              </div>
            </div>

            {securityStatus.dependencyScan && (
              <div className="col-md-4">
                <div className="card h-100">
                  <div className="card-header bg-warning text-dark">
                    <strong>Dependency Security</strong>
                  </div>
                  <div className="card-body">
                    <div className="mb-2">
                      <strong>Risk Score: </strong>
                      <span className={`badge ${getRiskScoreClass(securityStatus.dependencyScan.riskScore)}`}>
                        {securityStatus.dependencyScan.riskScore}/10
                      </span>
                    </div>
                    <div className="mb-2">
                      <strong>Vulnerabilities: </strong>
                      {securityStatus.dependencyScan.totalVulnerabilities}
                    </div>
                    {securityStatus.dependencyScan.summary && (
                      <div className="vulnerability-summary">
                        <span className="badge badge-danger mr-1">
                          Critical: {securityStatus.dependencyScan.summary.critical}
                        </span>
                        <span className="badge badge-warning mr-1">
                          High: {securityStatus.dependencyScan.summary.high}
                        </span>
                        <span className="badge badge-info mr-1">
                          Moderate: {securityStatus.dependencyScan.summary.moderate}
                        </span>
                        <span className="badge badge-secondary">
                          Low: {securityStatus.dependencyScan.summary.low}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {securityStatus.systemSecurity && (
              <div className="col-md-4">
                <div className="card h-100">
                  <div className="card-header bg-info text-white">
                    <strong>System Security</strong>
                  </div>
                  <div className="card-body">
                    <div className="mb-1">
                      <strong>Node.js:</strong> {securityStatus.systemSecurity.nodeVersion}
                    </div>
                    <div className="mb-1">
                      <strong>Platform:</strong> {securityStatus.systemSecurity.platform}
                    </div>
                    {securityStatus.systemSecurity.securityHeaders && (
                      <div className="security-features mt-2">
                        <span className={`badge ${securityStatus.systemSecurity.securityHeaders.cspEnabled ? 'badge-success' : 'badge-danger'}`}>
                          CSP: {securityStatus.systemSecurity.securityHeaders.cspEnabled ? 'ON' : 'OFF'}
                        </span>
                        <span className={`badge ${securityStatus.systemSecurity.securityHeaders.hstsEnabled ? 'badge-success' : 'badge-danger'} ml-1`}>
                          HSTS: {securityStatus.systemSecurity.securityHeaders.hstsEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {securityStatus.headerSecurity && securityStatus.headerSecurity.tests && (
            <div className="card mb-4">
              <div className="card-header">
                <strong>Security Header Tests</strong>
                <span className="badge badge-info ml-2">
                  {securityStatus.headerSecurity.tests.filter((t: any) => t.passed).length} / {securityStatus.headerSecurity.tests.length} Passed
                </span>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Test Name</th>
                        <th>Status</th>
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {securityStatus.headerSecurity.tests.map((test: any, index: number) => (
                        <tr key={index}>
                          <td><strong>{test.name}</strong></td>
                          <td>
                            <span className={`badge ${getTestStatusClass(test.passed)}`}>
                              {test.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                          <td>{test.description}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => showTestDetails(test)}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {securityStatus.dependencyScan && securityStatus.dependencyScan.recommendations && (
            <div className="card">
              <div className="card-header">
                <strong>Security Recommendations</strong>
              </div>
              <div className="card-body">
                <ul className="list-unstyled">
                  {securityStatus.dependencyScan.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="mb-2">
                      <span className="badge badge-warning mr-2">!</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {/* Test Details Modal */}
      {showDetails && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Test Details: {selectedTest?.name}</h5>
                <button type="button" className="close" onClick={() => setShowDetails(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {selectedTest && (
                  <div>
                    <p><strong>Status:</strong> 
                      <span className={`badge ${getTestStatusClass(selectedTest.passed)} ml-2`}>
                        {selectedTest.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </p>
                    <p><strong>Description:</strong> {selectedTest.description}</p>
                    {selectedTest.details && (
                      <div>
                        <strong>Details:</strong>
                        <pre className="bg-light p-2 mt-2 rounded">
                          {JSON.stringify(selectedTest.details, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedTest.recommendations && (
                      <div>
                        <strong>Recommendations:</strong>
                        <ul>
                          {selectedTest.recommendations.map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDetails(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center mt-4">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Running security scan...</p>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;