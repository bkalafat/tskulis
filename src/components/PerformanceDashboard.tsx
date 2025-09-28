/**
 * Performance Dashboard Component
 * Real-time performance monitoring and analytics
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Alert, Button } from 'react-bootstrap';
import { getPerformanceMonitor, PERFORMANCE_THRESHOLDS } from '../lib/performance';

interface MetricData {
  count: number;
  avgValue: number;
  ratings: { [key: string]: number };
}

interface PerformanceSummary {
  totalEntries: number;
  byMetric: { [key: string]: MetricData };
  byUrl: { [key: string]: number };
  deviceTypes: { [key: string]: number };
}

const PerformanceDashboard: React.FC = () => {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);

  // Fetch performance summary
  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/performance-summary');
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      } else {
        setError('Failed to load performance data');
      }
    } catch (err) {
      setError('Error fetching performance data');
    } finally {
      setLoading(false);
    }
  };

  // Get real-time metrics from client
  const updateRealTimeData = () => {
    const monitor = getPerformanceMonitor();
    if (monitor) {
      const currentSummary = monitor.getSummary();
      setRealTimeData(Object.entries(currentSummary).map(([name, entries]) => ({
        name,
        count: entries.length,
        latest: entries[entries.length - 1],
      })));
    }
  };

  useEffect(() => {
    fetchSummary();
    updateRealTimeData();

    // Update real-time data every 5 seconds
    const interval = setInterval(updateRealTimeData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get rating badge variant
  const getRatingVariant = (rating: string): string => {
    switch (rating) {
      case 'good': return 'success';
      case 'needs-improvement': return 'warning';
      case 'poor': return 'danger';
      default: return 'secondary';
    }
  };

  // Format metric value
  const formatMetricValue = (name: string, value: number): string => {
    if (name === 'CLS') {
      return value.toFixed(3);
    }
    return Math.round(value).toString() + (name.includes('time') || name.includes('duration') ? 'ms' : '');
  };

  // Get threshold for metric
  const getThreshold = (metricName: string): number[] | null => {
    const threshold = PERFORMANCE_THRESHOLDS[metricName as keyof typeof PERFORMANCE_THRESHOLDS];
    return threshold ? threshold : null;
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">Yükleniyor...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={fetchSummary} variant="outline-primary">
          Tekrar Dene
        </Button>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col md={12}>
          <h1 className="mb-4">Performans Paneli</h1>
        </Col>
      </Row>

      {/* Real-time Metrics */}
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5>Gerçek Zamanlı Metrikler</h5>
              <small className="text-muted">Mevcut sayfa oturumundan</small>
            </Card.Header>
            <Card.Body>
              {realTimeData.length === 0 ? (
                <p className="text-muted">Henüz veri toplanmadı</p>
              ) : (
                <Row>
                  {realTimeData.map(({ name, count, latest }) => (
                    <Col md={3} key={name} className="mb-3">
                      <Card className="h-100">
                        <Card.Body className="text-center">
                          <h6 className="text-uppercase">{name}</h6>
                          <h4>{formatMetricValue(name, latest.value)}</h4>
                          <Badge bg={getRatingVariant(latest.rating)}>
                            {latest.rating}
                          </Badge>
                          <div className="mt-2">
                            <small className="text-muted">{count} ölçüm</small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Historical Summary */}
      {summary && (
        <>
          <Row className="mb-4">
            <Col md={4}>
              <Card>
                <Card.Header>
                  <h6>Toplam İstatistikler</h6>
                </Card.Header>
                <Card.Body>
                  <Table size="sm">
                    <tbody>
                      <tr>
                        <td>Toplam Kayıt:</td>
                        <td><strong>{summary.totalEntries}</strong></td>
                      </tr>
                      <tr>
                        <td>Metrik Türleri:</td>
                        <td><strong>{Object.keys(summary.byMetric).length}</strong></td>
                      </tr>
                      <tr>
                        <td>Sayfa Sayısı:</td>
                        <td><strong>{Object.keys(summary.byUrl).length}</strong></td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col md={8}>
              <Card>
                <Card.Header>
                  <h6>Cihaz Dağılımı</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {Object.entries(summary.deviceTypes).map(([device, count]) => (
                      <Col md={4} key={device} className="text-center">
                        <h4>{count}</h4>
                        <p className="text-muted text-capitalize">{device}</p>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Card>
                <Card.Header>
                  <h6>Metrik Detayları</h6>
                </Card.Header>
                <Card.Body>
                  <Table striped responsive>
                    <thead>
                      <tr>
                        <th>Metrik</th>
                        <th>Sayı</th>
                        <th>Ortalama</th>
                        <th>Eşik Değerler</th>
                        <th>İyi</th>
                        <th>Orta</th>
                        <th>Kötü</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(summary.byMetric)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([metricName, data]) => {
                          const threshold = getThreshold(metricName);
                          const avgRating = data.avgValue <= (threshold?.[0] || 0) ? 'good' : 
                                           data.avgValue <= (threshold?.[1] || Infinity) ? 'needs-improvement' : 'poor';
                          
                          return (
                            <tr key={metricName}>
                              <td>
                                <strong>{metricName}</strong>
                              </td>
                              <td>{data.count}</td>
                              <td>{formatMetricValue(metricName, data.avgValue)}</td>
                              <td>
                                {threshold ? (
                                  <small>
                                    ≤{formatMetricValue(metricName, threshold[0])} / 
                                    ≤{formatMetricValue(metricName, threshold[1])}
                                  </small>
                                ) : (
                                  <small className="text-muted">-</small>
                                )}
                              </td>
                              <td>
                                <Badge bg="success">
                                  {data.ratings.good || 0}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg="warning">
                                  {data.ratings['needs-improvement'] || 0}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg="danger">
                                  {data.ratings.poor || 0}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg={getRatingVariant(avgRating)}>
                                  {avgRating}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col md={12}>
              <Card>
                <Card.Header>
                  <h6>En Popüler Sayfalar</h6>
                </Card.Header>
                <Card.Body>
                  <Table striped responsive>
                    <thead>
                      <tr>
                        <th>URL</th>
                        <th>Metrik Sayısı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(summary.byUrl)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([url, count]) => (
                          <tr key={url}>
                            <td>
                              <code>{url}</code>
                            </td>
                            <td>
                              <Badge bg="info">{count}</Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <Row className="mt-4">
        <Col md={12} className="text-center">
          <Button onClick={fetchSummary} variant="outline-primary">
            Verileri Yenile
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default PerformanceDashboard;