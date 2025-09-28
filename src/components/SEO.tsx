/**
 * Advanced SEO Component with Structured Data
 * Comprehensive SEO optimization for TS Kulis news articles and pages
 */

import React from 'react';
import Head from 'next/head';
import { NewsType } from '../types/NewsType';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  article?: NewsType;
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  category?: string;
  noIndex?: boolean;
  structuredData?: object;
}

const SEO: React.FC<SEOProps> = ({
  title = 'TS Kulis - Trabzonspor Haberleri ve Transfer Gelişmeleri',
  description = 'Trabzonspor\'un en güncel haberleri, transfer gelişmeleri ve maç analizleri. TS Kulis\'te tüm Trabzonspor haberlerini takip edin.',
  canonicalUrl = 'https://tskulis.com',
  ogImage = 'https://tskulis.com/images/og-default.jpg',
  ogType = 'website',
  article,
  keywords = [],
  author = 'TS Kulis',
  publishedTime,
  modifiedTime,
  category,
  noIndex = false,
  structuredData,
}) => {
  // Generate structured data based on content type
  const generateStructuredData = () => {
    const baseStructuredData = {
      '@context': 'https://schema.org',
    };

    // Article structured data
    if (article && ogType === 'article') {
      return {
        ...baseStructuredData,
        '@type': 'NewsArticle',
        headline: article.caption,
        description: article.content?.substring(0, 160) || description,
        image: article.imgPath ? `https://tskulis.com${article.imgPath}` : ogImage,
        datePublished: article.createDate || publishedTime,
        dateModified: article.updateDate || modifiedTime || article.createDate,
        author: {
          '@type': 'Organization',
          name: 'TS Kulis',
          url: 'https://tskulis.com'
        },
        publisher: {
          '@type': 'Organization',
          name: 'TS Kulis',
          logo: {
            '@type': 'ImageObject',
            url: 'https://tskulis.com/images/logo.png',
            width: 300,
            height: 60
          }
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl
        },
        articleSection: getCategoryDisplayName(article.category),
        keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
        about: {
          '@type': 'SportsTeam',
          name: 'Trabzonspor',
          sport: 'Futbol',
          memberOf: {
            '@type': 'SportsOrganization',
            name: 'Süper Lig'
          }
        }
      };
    }

    // Website/Organization structured data
    return {
      ...baseStructuredData,
      '@type': 'WebSite',
      name: 'TS Kulis',
      alternateName: 'Trabzonspor Kulis',
      url: 'https://tskulis.com',
      description: 'Trabzonspor haberleri, transfer gelişmeleri ve maç analizleri',
      publisher: {
        '@type': 'Organization',
        name: 'TS Kulis',
        logo: {
          '@type': 'ImageObject',
          url: 'https://tskulis.com/images/logo.png'
        },
        sameAs: [
          'https://twitter.com/tskulis',
          'https://facebook.com/tskulis',
          'https://instagram.com/tskulis'
        ]
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://tskulis.com/ara?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      },
      ...structuredData
    };
  };

  // Get category display name for structured data
  const getCategoryDisplayName = (categorySlug?: string) => {
    const categoryMap: { [key: string]: string } = {
      'trabzonspor': 'Trabzonspor Haberleri',
      'transfer': 'Transfer Haberleri',
      'genel': 'Genel Haberler',
      'football': 'Futbol Haberleri'
    };
    return categoryMap[categorySlug || ''] || 'Spor Haberleri';
  };

  // Generate meta keywords
  const generateKeywords = () => {
    const defaultKeywords = [
      'Trabzonspor',
      'TS Kulis',
      'Trabzonspor haberleri',
      'Süper Lig',
      'futbol haberleri',
      'Trabzonspor transfer'
    ];

    if (article) {
      const articleKeywords = [
        article.caption?.split(' ').slice(0, 3).join(' '),
        getCategoryDisplayName(article.category)
      ].filter(Boolean);
      
      return [...articleKeywords, ...defaultKeywords, ...keywords]
        .filter((keyword, index, arr) => arr.indexOf(keyword) === index)
        .slice(0, 20)
        .join(', ');
    }

    return [...keywords, ...defaultKeywords]
      .filter((keyword, index, arr) => arr.indexOf(keyword) === index)
      .slice(0, 15)
      .join(', ');
  };

  const finalStructuredData = generateStructuredData();

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={generateKeywords()} />
      <meta name="author" content={author} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="TS Kulis" />
      <meta property="og:locale" content="tr_TR" />
      
      {/* Article specific Open Graph tags */}
      {article && ogType === 'article' && (
        <>
          <meta property="article:published_time" content={article.createDate || publishedTime} />
          <meta property="article:modified_time" content={article.updateDate || modifiedTime || article.createDate} />
          <meta property="article:author" content={author} />
          <meta property="article:section" content={getCategoryDisplayName(article.category)} />
          {keywords.map((keyword, index) => (
            <meta key={index} property="article:tag" content={keyword} />
          ))}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@tskulis" />
      <meta name="twitter:creator" content="@tskulis" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#800040" />
      <meta name="msapplication-TileColor" content="#800040" />
      <meta name="application-name" content="TS Kulis" />
      <meta name="apple-mobile-web-app-title" content="TS Kulis" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="mobile-web-app-capable" content="yes" />
      
      {/* Language and Location */}
      <meta httpEquiv="content-language" content="tr" />
      <meta name="geo.region" content="TR" />
      <meta name="geo.placename" content="Türkiye" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(finalStructuredData)
        }}
      />
      
      {/* Preload important resources */}
      <link
        rel="preload"
        href="/fonts/inter-var.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      
      {/* DNS Prefetch for external resources */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Breadcrumb structured data for articles */}
      {article && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Ana Sayfa',
                  item: 'https://tskulis.com'
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: getCategoryDisplayName(article.category),
                  item: `https://tskulis.com/${article.category}`
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: article.caption,
                  item: canonicalUrl
                }
              ]
            })
          }}
        />
      )}
      
      {/* Alternative language versions */}
      <link rel="alternate" hrefLang="tr" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
    </Head>
  );
};

export default SEO;