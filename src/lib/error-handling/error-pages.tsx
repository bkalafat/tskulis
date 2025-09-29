/**
 * User-Friendly Error Pages
 * Comprehensive error page components with contextual information
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useErrorHandler } from './error-boundary';

// Common error page styles
const errorPageStyles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    fontFamily: 'Arial, sans-serif'
  },
  content: {
    textAlign: 'center' as const,
    maxWidth: '600px',
    width: '100%'
  },
  heading: {
    fontSize: '72px',
    fontWeight: 'bold',
    color: '#e74c3c',
    margin: '0 0 20px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
  },
  subheading: {
    fontSize: '28px',
    color: '#2c3e50',
    margin: '0 0 30px',
    fontWeight: '300'
  },
  description: {
    fontSize: '16px',
    color: '#5a6c7d',
    lineHeight: '1.6',
    margin: '0 0 40px'
  },
  buttonContainer: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    margin: '0 0 40px'
  },
  button: {
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  primaryButton: {
    backgroundColor: '#007bff',
    color: 'white'
  },
  secondaryButton: {
    backgroundColor: '#28a745',
    color: 'white'
  },
  tertiaryButton: {
    backgroundColor: '#6c757d',
    color: 'white'
  },
  details: {
    backgroundColor: 'white',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '30px',
    textAlign: 'left' as const
  },
  helpSection: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginTop: '40px'
  }
};

// 404 - Not Found
export const NotFoundPage: React.FC = () => {
  const router = useRouter();
  const { addBreadcrumb } = useErrorHandler();

  React.useEffect(() => {
    addBreadcrumb({
      category: 'navigation',
      message: `404 Error: ${router.asPath}`,
      level: 'warning'
    });
  }, [router.asPath, addBreadcrumb]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div style={errorPageStyles.container}>
      <div style={errorPageStyles.content}>
        <h1 style={errorPageStyles.heading}>404</h1>
        <h2 style={errorPageStyles.subheading}>Sayfa Bulunamadı</h2>
        <p style={errorPageStyles.description}>
          Aradığınız sayfa mevcut değil veya kaldırılmış olabilir. 
          URL adresini kontrol edin veya ana sayfaya dönerek aradığınızı bulun.
        </p>
        
        <div style={errorPageStyles.buttonContainer}>
          <button
            onClick={handleGoBack}
            style={{
              ...errorPageStyles.button,
              ...errorPageStyles.primaryButton
            }}
          >
            ← Geri Dön
          </button>
          
          <Link href="/" style={{
            ...errorPageStyles.button,
            ...errorPageStyles.secondaryButton
          }}>
            🏠 Ana Sayfa
          </Link>
          
          <Link href="/trabzonspor" style={{
            ...errorPageStyles.button,
            ...errorPageStyles.tertiaryButton
          }}>
            ⚽ Trabzonspor Haberleri
          </Link>
        </div>

        <div style={errorPageStyles.helpSection}>
          <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>
            🔍 Aradığınızı Bulmaya Yardımcı Olalım
          </h3>
          <ul style={{ 
            textAlign: 'left', 
            color: '#5a6c7d',
            lineHeight: '1.8',
            paddingLeft: '20px'
          }}>
            <li><Link href="/trabzonspor" style={{ color: '#007bff' }}>En Son Trabzonspor Haberleri</Link></li>
            <li><Link href="/transfer" style={{ color: '#007bff' }}>Transfer Haberleri</Link></li>
            <li><Link href="/genel" style={{ color: '#007bff' }}>Genel Futbol Haberleri</Link></li>
            <li><Link href="/futbol" style={{ color: '#007bff' }}>Tüm Futbol Haberleri</Link></li>
          </ul>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details style={errorPageStyles.details}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
              Geliştirici Bilgileri
            </summary>
            <p><strong>Requested URL:</strong> {router.asPath}</p>
            <p><strong>Referrer:</strong> {document.referrer || 'None'}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
          </details>
        )}
      </div>
    </div>
  );
};

// 500 - Internal Server Error
export const InternalServerErrorPage: React.FC<{
  errorId?: string;
  message?: string;
  statusCode?: number;
}> = ({ errorId, message, statusCode = 500 }) => {
  const router = useRouter();
  const { reportError, addBreadcrumb } = useErrorHandler();

  React.useEffect(() => {
    addBreadcrumb({
      category: 'console',
      message: `${statusCode} Error: ${message || 'Internal Server Error'}`,
      level: 'error',
      data: { errorId, statusCode }
    });

    if (message) {
      reportError(new Error(message), { statusCode, errorId });
    }
  }, [errorId, message, statusCode, reportError, addBreadcrumb]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div style={errorPageStyles.container}>
      <div style={errorPageStyles.content}>
        <h1 style={errorPageStyles.heading}>{statusCode}</h1>
        <h2 style={errorPageStyles.subheading}>Sunucu Hatası</h2>
        <p style={errorPageStyles.description}>
          Üzgünüz, sunucumuzda beklenmeyen bir hata oluştu. 
          Teknik ekibimiz bu sorunu çözmek için çalışıyor. 
          Lütfen birkaç dakika sonra tekrar deneyin.
        </p>
        
        <div style={errorPageStyles.buttonContainer}>
          <button
            onClick={handleRetry}
            style={{
              ...errorPageStyles.button,
              ...errorPageStyles.primaryButton
            }}
          >
            🔄 Sayfayı Yenile
          </button>
          
          <Link href="/" style={{
            ...errorPageStyles.button,
            ...errorPageStyles.secondaryButton
          }}>
            🏠 Ana Sayfa
          </Link>
          
          <button
            onClick={() => router.back()}
            style={{
              ...errorPageStyles.button,
              ...errorPageStyles.tertiaryButton
            }}
          >
            ← Geri Dön
          </button>
        </div>

        <div style={errorPageStyles.helpSection}>
          <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>
            💡 Bu Sorunu Çözmek İçin
          </h3>
          <ul style={{ 
            textAlign: 'left', 
            color: '#5a6c7d',
            lineHeight: '1.8',
            paddingLeft: '20px'
          }}>
            <li>Sayfayı birkaç dakika sonra tekrar yenileyin</li>
            <li>Internet bağlantınızı kontrol edin</li>
            <li>Tarayıcınızın önbelleğini temizleyin</li>
            <li>Sorun devam ederse ana sayfadan devam edin</li>
          </ul>
        </div>

        {errorId && (
          <div style={errorPageStyles.details}>
            <p style={{ color: '#6c757d', fontSize: '14px' }}>
              <strong>Hata Kodu:</strong> {errorId}
              <br />
              Bu kodu teknik destek ekibine bildirirseniz sorununuzu daha hızlı çözebiliriz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// 503 - Service Unavailable
export const ServiceUnavailablePage: React.FC<{
  estimatedDowntime?: string;
  maintenanceMessage?: string;
}> = ({ estimatedDowntime, maintenanceMessage }) => {
  const { addBreadcrumb } = useErrorHandler();

  React.useEffect(() => {
    addBreadcrumb({
      category: 'console',
      message: '503 Service Unavailable - Maintenance mode',
      level: 'warning'
    });
  }, [addBreadcrumb]);

  return (
    <div style={errorPageStyles.container}>
      <div style={errorPageStyles.content}>
        <h1 style={errorPageStyles.heading}>503</h1>
        <h2 style={errorPageStyles.subheading}>Bakım Modu</h2>
        <p style={errorPageStyles.description}>
          {maintenanceMessage || 'Sitemiz şu anda bakım çalışması nedeniyle geçici olarak kullanılamıyor. Size daha iyi hizmet verebilmek için sistemimizi güncelliyoruz.'}
        </p>
        
        {estimatedDowntime && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '6px',
            padding: '15px',
            marginBottom: '30px',
            color: '#856404'
          }}>
            <strong>Tahmini Tamamlanma:</strong> {estimatedDowntime}
          </div>
        )}
        
        <div style={errorPageStyles.buttonContainer}>
          <button
            onClick={() => window.location.reload()}
            style={{
              ...errorPageStyles.button,
              ...errorPageStyles.primaryButton
            }}
          >
            🔄 Tekrar Dene
          </button>
        </div>

        <div style={errorPageStyles.helpSection}>
          <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>
            📢 Bakım Sürecinde
          </h3>
          <ul style={{ 
            textAlign: 'left', 
            color: '#5a6c7d',
            lineHeight: '1.8',
            paddingLeft: '20px'
          }}>
            <li>Sistem performansı iyileştiriliyor</li>
            <li>Güvenlik güncellemeleri yapılıyor</li>
            <li>Yeni özellikler ekleniyor</li>
            <li>Mevcut hatalar gideriliyor</li>
          </ul>
          
          <p style={{ marginTop: '20px', color: '#5a6c7d' }}>
            Sosyal medya hesaplarımızdan güncel duyuruları takip edebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
};

// Network Error Page
export const NetworkErrorPage: React.FC<{
  isOffline?: boolean;
  onRetry?: () => void;
}> = ({ isOffline = false, onRetry }) => {
  const { addBreadcrumb } = useErrorHandler();

  React.useEffect(() => {
    addBreadcrumb({
      category: 'console',
      message: isOffline ? 'Network offline' : 'Network connection error',
      level: 'error'
    });
  }, [isOffline, addBreadcrumb]);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div style={errorPageStyles.container}>
      <div style={errorPageStyles.content}>
        <h1 style={{
          ...errorPageStyles.heading,
          fontSize: '96px'
        }}>
          {isOffline ? '📡' : '🌐'}
        </h1>
        <h2 style={errorPageStyles.subheading}>
          {isOffline ? 'İnternet Bağlantısı Yok' : 'Bağlantı Hatası'}
        </h2>
        <p style={errorPageStyles.description}>
          {isOffline 
            ? 'İnternet bağlantınız kesildi. Lütfen bağlantınızı kontrol edin ve tekrar deneyin.'
            : 'Sunucuya bağlanırken bir hata oluştu. İnternet bağlantınızı kontrol edin veya birkaç dakika sonra tekrar deneyin.'
          }
        </p>
        
        <div style={errorPageStyles.buttonContainer}>
          <button
            onClick={handleRetry}
            style={{
              ...errorPageStyles.button,
              ...errorPageStyles.primaryButton
            }}
          >
            🔄 Bağlantıyı Kontrol Et
          </button>
        </div>

        <div style={errorPageStyles.helpSection}>
          <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>
            🔧 Bağlantı Sorunları İçin
          </h3>
          <ul style={{ 
            textAlign: 'left', 
            color: '#5a6c7d',
            lineHeight: '1.8',
            paddingLeft: '20px'
          }}>
            <li>WiFi veya mobil veri bağlantınızı kontrol edin</li>
            <li>Modem/router'ınızı yeniden başlatın</li>
            <li>VPN bağlantınızı kapatıp açın</li>
            <li>Güvenlik duvarı ayarlarınızı kontrol edin</li>
            <li>Farklı bir ağdan denemeyi deneyin</li>
          </ul>
        </div>

        {!isOffline && navigator.onLine && (
          <div style={{
            backgroundColor: '#d1ecf1',
            border: '1px solid #bee5eb',
            borderRadius: '6px',
            padding: '15px',
            marginTop: '20px',
            color: '#0c5460'
          }}>
            <strong>İnternet bağlantınız aktif görünüyor.</strong><br />
            Bu geçici bir sunucu sorunu olabilir.
          </div>
        )}
      </div>
    </div>
  );
};

// Permission Denied Page
export const PermissionDeniedPage: React.FC<{
  requiredPermission?: string;
  loginUrl?: string;
}> = ({ requiredPermission = 'yönetici', loginUrl = '/api/auth/signin' }) => {
  const { addBreadcrumb } = useErrorHandler();

  React.useEffect(() => {
    addBreadcrumb({
      category: 'navigation',
      message: `Access denied: ${requiredPermission} permission required`,
      level: 'warning'
    });
  }, [requiredPermission, addBreadcrumb]);

  return (
    <div style={errorPageStyles.container}>
      <div style={errorPageStyles.content}>
        <h1 style={errorPageStyles.heading}>🔒</h1>
        <h2 style={errorPageStyles.subheading}>Erişim Reddedildi</h2>
        <p style={errorPageStyles.description}>
          Bu sayfaya erişmek için {requiredPermission} yetkisine sahip olmalısınız. 
          Eğer yetkili bir kullanıcıysanız, lütfen giriş yapın.
        </p>
        
        <div style={errorPageStyles.buttonContainer}>
          <Link href={loginUrl} style={{
            ...errorPageStyles.button,
            ...errorPageStyles.primaryButton
          }}>
            🔑 Giriş Yap
          </Link>
          
          <Link href="/" style={{
            ...errorPageStyles.button,
            ...errorPageStyles.secondaryButton
          }}>
            🏠 Ana Sayfa
          </Link>
        </div>

        <div style={errorPageStyles.helpSection}>
          <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>
            ℹ️ Yetkilendirme Hakkında
          </h3>
          <p style={{ color: '#5a6c7d', lineHeight: '1.8' }}>
            Bu sayfa yalnızca yönetici hesabıyla erişilebilir. 
            Eğer bir yönetici hesabınız yoksa ve bu sayfaya erişmeniz gerekiyorsa, 
            lütfen site yöneticisiyle iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  );
};

// Generic Error Page with customizable content
export const GenericErrorPage: React.FC<{
  statusCode?: number;
  title?: string;
  message?: string;
  icon?: string;
  actions?: Array<{
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: 'primary' | 'secondary' | 'tertiary';
  }>;
  helpContent?: React.ReactNode;
}> = ({
  statusCode = 500,
  title = 'Bir Hata Oluştu',
  message = 'Beklenmeyen bir hata meydana geldi.',
  icon = '⚠️',
  actions = [],
  helpContent
}) => {
  const { addBreadcrumb } = useErrorHandler();

  React.useEffect(() => {
    addBreadcrumb({
      category: 'console',
      message: `${statusCode}: ${title}`,
      level: 'error'
    });
  }, [statusCode, title, addBreadcrumb]);

  const getButtonStyle = (variant: 'primary' | 'secondary' | 'tertiary' = 'primary') => ({
    ...errorPageStyles.button,
    ...errorPageStyles[`${variant}Button`]
  });

  return (
    <div style={errorPageStyles.container}>
      <div style={errorPageStyles.content}>
        <h1 style={{
          ...errorPageStyles.heading,
          fontSize: typeof statusCode === 'number' ? '72px' : '96px'
        }}>
          {typeof statusCode === 'number' ? statusCode : icon}
        </h1>
        <h2 style={errorPageStyles.subheading}>{title}</h2>
        <p style={errorPageStyles.description}>{message}</p>
        
        {actions.length > 0 && (
          <div style={errorPageStyles.buttonContainer}>
            {actions.map((action, index) => {
              if (action.href) {
                return (
                  <Link 
                    key={index}
                    href={action.href} 
                    style={getButtonStyle(action.variant)}
                  >
                    {action.label}
                  </Link>
                );
              }
              
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  style={getButtonStyle(action.variant)}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        )}

        {helpContent && (
          <div style={errorPageStyles.helpSection}>
            {helpContent}
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  NotFoundPage,
  InternalServerErrorPage,
  ServiceUnavailablePage,
  NetworkErrorPage,
  PermissionDeniedPage,
  GenericErrorPage
};