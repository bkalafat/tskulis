/**
 * Social Media Optimization Component for TS Kulis
 * Advanced social sharing and engagement features
 */

import React, { useState, useEffect } from 'react';
import { NewsType } from '../types/NewsType';
import { useAnalytics } from '../lib/analytics';

interface SocialShareProps {
  article?: NewsType;
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  hashtags?: string[];
}

interface ShareCounts {
  facebook: number;
  twitter: number;
  linkedin: number;
  whatsapp: number;
  telegram: number;
}

export const SocialShare: React.FC<SocialShareProps> = ({
  article,
  url = typeof window !== 'undefined' ? window.location.href : '',
  title = '',
  description = '',
  image = '',
  hashtags = ['Trabzonspor', 'TSKulis']
}) => {
  const [shareCounts, setShareCounts] = useState<ShareCounts>({
    facebook: 0,
    twitter: 0,
    linkedin: 0,
    whatsapp: 0,
    telegram: 0
  });
  
  const [copied, setCopied] = useState(false);
  const { trackEvent } = useAnalytics();

  // Generate optimized share data
  const shareData = {
    url: encodeURIComponent(url),
    title: encodeURIComponent(title || article?.caption || 'TS Kulis - Trabzonspor Haberleri'),
    description: encodeURIComponent(description || article?.content?.substring(0, 150) + '...' || 'Trabzonspor\'un en güncel haberleri'),
    image: encodeURIComponent(image || article?.imgPath || '/icon-512x512.png'),
    hashtags: encodeURIComponent(hashtags.join(',')),
    via: 'tskulis'
  };

  // Load share counts on component mount
  useEffect(() => {
    loadShareCounts();
  }, [url]);

  // Load social share counts
  const loadShareCounts = async () => {
    try {
      // Facebook share count (requires app ID)
      const facebookCount = await fetchFacebookCount(url);
      
      setShareCounts(prev => ({
        ...prev,
        facebook: facebookCount
      }));
    } catch (error) {
      console.warn('Could not load share counts:', error);
    }
  };

  // Fetch Facebook share count
  const fetchFacebookCount = async (shareUrl: string): Promise<number> => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v12.0/?id=${encodeURIComponent(shareUrl)}&fields=engagement&access_token=${process.env.NEXT_PUBLIC_FB_APP_TOKEN}`
      );
      const data = await response.json();
      return data.engagement?.share_count || 0;
    } catch {
      return 0;
    }
  };

  // Handle share click
  const handleShare = (platform: string, shareUrl: string) => {
    // Track social share event
    trackEvent('social_share', {
      event_category: 'engagement',
      event_label: platform,
      content_title: title || article?.caption,
      content_category: article?.category,
      content_id: article?.id
    } as any);

    // Open share window
    if (typeof window !== 'undefined') {
      const width = 600;
      const height = 400;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      window.open(
        shareUrl,
        'share',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      
      trackEvent('copy_link', {
        event_category: 'engagement',
        event_label: 'clipboard',
        content_title: title || article?.caption
      } as any);

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Could not copy to clipboard:', error);
    }
  };

  // Native Web Share API
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.description,
          url: url
        });
        
        trackEvent('native_share', {
          event_category: 'engagement',
          event_label: 'web_share_api',
          content_title: title || article?.caption
        } as any);
      } catch (error) {
        console.log('Native sharing cancelled or failed:', error);
      }
    }
  };

  // Social platform configurations
  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: '📘',
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareData.url}&quote=${shareData.title}`,
      color: '#1877F2',
      count: shareCounts.facebook
    },
    {
      name: 'Twitter',
      icon: '🐦',
      url: `https://twitter.com/intent/tweet?text=${shareData.title}&url=${shareData.url}&hashtags=${shareData.hashtags}&via=${shareData.via}`,
      color: '#1DA1F2',
      count: shareCounts.twitter
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareData.url}`,
      color: '#0077B5',
      count: shareCounts.linkedin
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      url: `https://wa.me/?text=${shareData.title}%20${shareData.url}`,
      color: '#25D366',
      count: shareCounts.whatsapp
    },
    {
      name: 'Telegram',
      icon: '✈️',
      url: `https://t.me/share/url?url=${shareData.url}&text=${shareData.title}`,
      color: '#0088CC',
      count: shareCounts.telegram
    }
  ];

  return (
    <div className="social-share-container">
      <style jsx>{`
        .social-share-container {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          margin: 20px 0;
        }
        
        .share-title {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .share-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 15px;
        }
        
        .share-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: white;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          color: #2c3e50;
          font-weight: 500;
          position: relative;
          overflow: hidden;
        }
        
        .share-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          text-decoration: none;
          color: white;
        }
        
        .share-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: var(--platform-color);
          transition: left 0.3s ease;
          z-index: -1;
        }
        
        .share-button:hover::before {
          left: 0;
        }
        
        .share-count {
          font-size: 12px;
          color: #666;
          margin-left: auto;
          padding: 2px 6px;
          background: #e9ecef;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
        }
        
        .share-button:hover .share-count {
          color: white;
          background: rgba(255,255,255,0.2);
        }
        
        .utility-buttons {
          display: flex;
          gap: 12px;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #dee2e6;
        }
        
        .utility-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        
        .utility-button:hover {
          background: #5a6268;
          transform: translateY(-1px);
        }
        
        .utility-button.copied {
          background: #28a745;
        }
        
        .share-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          font-size: 12px;
          color: #6c757d;
        }
        
        @media (max-width: 768px) {
          .share-buttons {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .utility-buttons {
            flex-direction: column;
          }
        }
        
        @media (max-width: 480px) {
          .share-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="share-title">
        <span>📤</span>
        Haberi Paylaş
      </div>

      <div className="share-buttons">
        {socialPlatforms.map((platform) => (
          <button
            key={platform.name}
            className="share-button"
            onClick={() => handleShare(platform.name, platform.url)}
            style={{ '--platform-color': platform.color } as React.CSSProperties}
            title={`${platform.name} üzerinde paylaş`}
            aria-label={`${platform.name} üzerinde paylaş`}
          >
            <span>{platform.icon}</span>
            <span>{platform.name}</span>
            {platform.count > 0 && (
              <span className="share-count">{platform.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="utility-buttons">
        <button
          className={`utility-button ${copied ? 'copied' : ''}`}
          onClick={copyToClipboard}
          title="Bağlantıyı kopyala"
        >
          <span>{copied ? '✅' : '📋'}</span>
          <span>{copied ? 'Kopyalandı!' : 'Linki Kopyala'}</span>
        </button>

        {navigator.share && (
          <button
            className="utility-button"
            onClick={nativeShare}
            title="Sistem paylaşım menüsünü aç"
          >
            <span>📱</span>
            <span>Paylaş</span>
          </button>
        )}
      </div>

      <div className="share-stats">
        <span>Toplam paylaşım: {Object.values(shareCounts).reduce((a, b) => a + b, 0)}</span>
        <span>TS Kulis 📰</span>
      </div>
    </div>
  );
};

// Floating share buttons for articles
interface FloatingShareProps {
  article: NewsType;
  position?: 'left' | 'right';
}

export const FloatingShare: React.FC<FloatingShareProps> = ({ 
  article, 
  position = 'left' 
}) => {
  const [visible, setVisible] = useState(false);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 200;
      setVisible(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleQuickShare = (platform: string, url: string) => {
    trackEvent('floating_share', {
      event_category: 'engagement',
      event_label: platform,
      content_title: article.caption,
      content_id: article.id
    } as any);

    window.open(url, 'share', 'width=600,height=400');
  };

  if (!visible) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = encodeURIComponent(article.caption);
  const shareUrl = encodeURIComponent(currentUrl);

  const quickPlatforms = [
    {
      name: 'Facebook',
      icon: '📘',
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      color: '#1877F2'
    },
    {
      name: 'Twitter', 
      icon: '🐦',
      url: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}&via=tskulis`,
      color: '#1DA1F2'
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      url: `https://wa.me/?text=${shareTitle}%20${shareUrl}`,
      color: '#25D366'
    }
  ];

  return (
    <>
      <style jsx>{`
        .floating-share {
          position: fixed;
          ${position}: 20px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            ${position}: -60px;
            opacity: 0;
          }
          to {
            ${position}: 20px;
            opacity: 1;
          }
        }
        
        .floating-button {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        
        .floating-button:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        
        @media (max-width: 768px) {
          .floating-share {
            display: none;
          }
        }
      `}</style>

      <div className="floating-share">
        {quickPlatforms.map((platform) => (
          <button
            key={platform.name}
            className="floating-button"
            onClick={() => handleQuickShare(platform.name, platform.url)}
            style={{ backgroundColor: platform.color }}
            title={`${platform.name} ile paylaş`}
            aria-label={`${platform.name} ile paylaş`}
          >
            {platform.icon}
          </button>
        ))}
      </div>
    </>
  );
};

// Social media meta tags component
interface SocialMetaProps {
  article?: NewsType;
  title?: string;
  description?: string;
  image?: string;
  type?: 'article' | 'website';
}

export const SocialMeta: React.FC<SocialMetaProps> = ({
  article,
  title,
  description, 
  image,
  type = 'article'
}) => {
  const metaTitle = title || article?.caption || 'TS Kulis - Trabzonspor Haberleri';
  const metaDescription = description || article?.content?.substring(0, 160) || 'Trabzonspor\'un en güncel haberleri, transfer gelişmeleri ve maç özetleri';
  const metaImage = image || article?.imgPath || '/icon-512x512.png';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="TS Kulis" />
      <meta property="og:locale" content="tr_TR" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@tskulis" />
      <meta name="twitter:creator" content="@tskulis" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      
      {/* Article-specific meta tags */}
      {article && (
        <>
          <meta property="article:published_time" content={article.createDate || ''} />
          <meta property="article:modified_time" content={article.updateDate || ''} />
          <meta property="article:author" content="TS Kulis" />
          <meta property="article:section" content={article.category || 'Trabzonspor'} />
          <meta property="article:tag" content={`Trabzonspor,${article.category},${article.type}`} />
        </>
      )}
      
      {/* LinkedIn specific */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      
      {/* WhatsApp specific */}
      <meta property="og:image:type" content="image/jpeg" />
    </>
  );
};

export default SocialShare;