/**
 * Advanced Sitemap Generator for TS Kulis
 * Generates comprehensive XML sitemaps with news-specific enhancements
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_PATH || 'http://localhost:5000/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tskulis.com';

// Sitemap configuration
const SITEMAP_CONFIG = {
  baseUrl: SITE_URL,
  outputDir: './public',
  changefreq: {
    homepage: 'hourly',
    category: 'daily', 
    article: 'weekly',
    static: 'monthly'
  },
  priority: {
    homepage: 1.0,
    category: 0.8,
    article: 0.6,
    static: 0.4
  },
  maxUrls: 50000, // Google's limit
  compress: true
};

// Categories mapping
const CATEGORIES = [
  'Trabzonspor',
  'Transfer',
  'General', 
  'Football'
];

// Static pages
const STATIC_PAGES = [
  { url: '/', changefreq: 'hourly', priority: 1.0 },
  { url: '/about', changefreq: 'monthly', priority: 0.4 },
  { url: '/contact', changefreq: 'monthly', priority: 0.4 },
  { url: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { url: '/terms', changefreq: 'yearly', priority: 0.3 },
  { url: '/sitemap', changefreq: 'weekly', priority: 0.5 }
];

class SitemapGenerator {
  constructor() {
    this.sitemaps = [];
    this.sitemapIndex = [];
    this.urlCount = 0;
  }

  // Main sitemap generation function
  async generateSitemaps() {
    console.log('🗺️  Starting sitemap generation...');
    
    try {
      // Clear existing sitemaps
      await this.clearOldSitemaps();

      // Generate main sitemap with static pages and categories
      await this.generateMainSitemap();
      
      // Generate news sitemaps
      await this.generateNewsSitemaps();
      
      // Generate news sitemap index
      await this.generateNewsSitemapIndex();
      
      // Generate main sitemap index
      await this.generateSitemapIndex();
      
      // Generate robots.txt
      await this.generateRobotsTxt();
      
      // Generate RSS feeds
      await this.generateRSSFeeds();

      console.log(`✅ Sitemap generation completed! Generated ${this.urlCount} URLs across ${this.sitemaps.length} sitemaps`);
      
      return {
        success: true,
        urlCount: this.urlCount,
        sitemapCount: this.sitemaps.length,
        files: this.sitemaps.concat(['sitemap.xml', 'robots.txt', 'rss.xml'])
      };
    } catch (error) {
      console.error('❌ Sitemap generation failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear old sitemap files
  async clearOldSitemaps() {
    const files = await promisify(fs.readdir)(SITEMAP_CONFIG.outputDir);
    const sitemapFiles = files.filter(file => 
      file.startsWith('sitemap') && file.endsWith('.xml')
    );
    
    for (const file of sitemapFiles) {
      await promisify(fs.unlink)(path.join(SITEMAP_CONFIG.outputDir, file));
    }
  }

  // Generate main sitemap with static pages and categories
  async generateMainSitemap() {
    const urls = [];
    
    // Add static pages
    STATIC_PAGES.forEach(page => {
      urls.push(this.createUrlEntry({
        loc: `${SITEMAP_CONFIG.baseUrl}${page.url}`,
        lastmod: new Date().toISOString(),
        changefreq: page.changefreq,
        priority: page.priority
      }));
    });

    // Add category pages
    CATEGORIES.forEach(category => {
      urls.push(this.createUrlEntry({
        loc: `${SITEMAP_CONFIG.baseUrl}/${category.toLowerCase()}`,
        lastmod: new Date().toISOString(),
        changefreq: SITEMAP_CONFIG.changefreq.category,
        priority: SITEMAP_CONFIG.priority.category
      }));
    });

    const xml = this.createSitemapXML(urls);
    const filename = 'sitemap-main.xml';
    
    await this.writeSitemap(filename, xml);
    this.sitemaps.push(filename);
    this.urlCount += urls.length;
  }

  // Generate news sitemaps (split by category and date)
  async generateNewsSitemaps() {
    for (const category of CATEGORIES) {
      await this.generateCategoryNewsSitemap(category);
    }
  }

  // Generate news sitemap for specific category
  async generateCategoryNewsSitemap(category) {
    try {
      const articles = await this.fetchArticles(category);
      
      if (articles.length === 0) {
        console.log(`⚠️  No articles found for category: ${category}`);
        return;
      }

      // Split articles into chunks of 1000 URLs (Google News sitemap limit)
      const chunks = this.chunkArray(articles, 1000);
      
      for (let i = 0; i < chunks.length; i++) {
        const urls = chunks[i].map(article => this.createNewsUrlEntry(article));
        const xml = this.createNewsSitemapXML(urls);
        const filename = `sitemap-news-${category.toLowerCase()}${i > 0 ? `-${i + 1}` : ''}.xml`;
        
        await this.writeSitemap(filename, xml);
        this.sitemaps.push(filename);
        this.urlCount += urls.length;
      }
      
      console.log(`📰 Generated ${chunks.length} news sitemap(s) for ${category} with ${articles.length} articles`);
    } catch (error) {
      console.error(`❌ Failed to generate news sitemap for ${category}:`, error);
    }
  }

  // Fetch articles from API
  async fetchArticles(category, limit = 10000) {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${API_BASE_URL}/news/category/${category}?limit=${limit}&sortBy=createDate&order=desc`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error(`Failed to fetch articles for ${category}:`, error);
      return [];
    }
  }

  // Create standard URL entry
  createUrlEntry({ loc, lastmod, changefreq, priority }) {
    return `
    <url>
      <loc>${this.escapeXml(loc)}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>
    </url>`;
  }

  // Create news URL entry with Google News extensions
  createNewsUrlEntry(article) {
    const articleUrl = `${SITEMAP_CONFIG.baseUrl}/${article.category.toLowerCase()}/${article.slug}`;
    const publishDate = new Date(article.createDate || article.expressDate);
    const modifiedDate = new Date(article.updateDate || article.createDate || article.expressDate);

    return `
    <url>
      <loc>${this.escapeXml(articleUrl)}</loc>
      <lastmod>${modifiedDate.toISOString()}</lastmod>
      <changefreq>${SITEMAP_CONFIG.changefreq.article}</changefreq>
      <priority>${SITEMAP_CONFIG.priority.article}</priority>
      <news:news>
        <news:publication>
          <news:name>TS Kulis</news:name>
          <news:language>tr</news:language>
        </news:publication>
        <news:publication_date>${publishDate.toISOString()}</news:publication_date>
        <news:title>${this.escapeXml(article.caption)}</news:title>
        <news:keywords>${this.escapeXml(article.keywords || article.subjects?.join(', ') || article.category)}</news:keywords>
      </news:news>
      <image:image>
        <image:loc>${this.escapeXml(article.imgPath)}</image:loc>
        <image:caption>${this.escapeXml(article.imgAlt || article.caption)}</image:caption>
        <image:title>${this.escapeXml(article.caption)}</image:title>
      </image:image>
    </url>`;
  }

  // Create sitemap XML
  createSitemapXML(urls) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('')}
</urlset>`;
  }

  // Create news sitemap XML with Google News extensions
  createNewsSitemapXML(urls) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('')}
</urlset>`;
  }

  // Generate news sitemap index
  async generateNewsSitemapIndex() {
    const newsSitemaps = this.sitemaps.filter(sitemap => sitemap.includes('news'));
    
    if (newsSitemaps.length === 0) return;

    const sitemapEntries = newsSitemaps.map(sitemap => `
    <sitemap>
      <loc>${SITEMAP_CONFIG.baseUrl}/${sitemap}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>`);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('')}
</sitemapindex>`;

    await this.writeSitemap('sitemap-news-index.xml', xml);
    this.sitemaps.push('sitemap-news-index.xml');
  }

  // Generate main sitemap index
  async generateSitemapIndex() {
    const sitemapEntries = this.sitemaps.map(sitemap => `
    <sitemap>
      <loc>${SITEMAP_CONFIG.baseUrl}/${sitemap}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>`);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('')}
</sitemapindex>`;

    await this.writeSitemap('sitemap.xml', xml);
  }

  // Generate robots.txt
  async generateRobotsTxt() {
    const robotsTxt = `User-agent: *
Allow: /

# Sitemap locations
Sitemap: ${SITEMAP_CONFIG.baseUrl}/sitemap.xml
Sitemap: ${SITEMAP_CONFIG.baseUrl}/sitemap-news-index.xml
Sitemap: ${SITEMAP_CONFIG.baseUrl}/rss.xml

# Disallow admin and API endpoints
Disallow: /api/
Disallow: /adminpanel/
Disallow: /editor/
Disallow: /_next/
Disallow: /public/

# Allow specific bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

# Crawl delay for general bots
User-agent: *
Crawl-delay: 1

# Host directive
Host: ${SITEMAP_CONFIG.baseUrl.replace('https://', '').replace('http://', '')}
`;

    await promisify(fs.writeFile)(
      path.join(SITEMAP_CONFIG.outputDir, 'robots.txt'),
      robotsTxt,
      'utf8'
    );
    
    console.log('🤖 Generated robots.txt');
  }

  // Generate RSS feeds
  async generateRSSFeeds() {
    try {
      // Main RSS feed
      await this.generateMainRSSFeed();
      
      // Category RSS feeds
      for (const category of CATEGORIES) {
        await this.generateCategoryRSSFeed(category);
      }
    } catch (error) {
      console.error('Failed to generate RSS feeds:', error);
    }
  }

  // Generate main RSS feed
  async generateMainRSSFeed() {
    const articles = await this.fetchLatestArticles(20);
    const rss = this.createRSSXML(articles, {
      title: 'TS Kulis - Trabzonspor Haberleri',
      description: 'Trabzonspor\'un en güncel haberleri, transfer gelişmeleri ve maç özetleri',
      link: SITEMAP_CONFIG.baseUrl,
      language: 'tr-TR'
    });
    
    await promisify(fs.writeFile)(
      path.join(SITEMAP_CONFIG.outputDir, 'rss.xml'),
      rss,
      'utf8'
    );
    
    console.log('📡 Generated main RSS feed');
  }

  // Generate category RSS feed
  async generateCategoryRSSFeed(category) {
    const articles = await this.fetchArticles(category, 20);
    const rss = this.createRSSXML(articles, {
      title: `TS Kulis - ${category} Haberleri`,
      description: `${category} kategorisindeki en güncel haberler`,
      link: `${SITEMAP_CONFIG.baseUrl}/${category.toLowerCase()}`,
      language: 'tr-TR'
    });
    
    await promisify(fs.writeFile)(
      path.join(SITEMAP_CONFIG.outputDir, `rss-${category.toLowerCase()}.xml`),
      rss,
      'utf8'
    );
    
    console.log(`📡 Generated RSS feed for ${category}`);
  }

  // Fetch latest articles across all categories
  async fetchLatestArticles(limit = 20) {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${API_BASE_URL}/news?limit=${limit}&sortBy=createDate&order=desc`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error('Failed to fetch latest articles:', error);
      return [];
    }
  }

  // Create RSS XML
  createRSSXML(articles, feedInfo) {
    const items = articles.map(article => {
      const articleUrl = `${SITEMAP_CONFIG.baseUrl}/${article.category.toLowerCase()}/${article.slug}`;
      const pubDate = new Date(article.createDate || article.expressDate).toUTCString();
      
      return `
    <item>
      <title>${this.escapeXml(article.caption)}</title>
      <description>${this.escapeXml(article.summary || article.content.substring(0, 200) + '...')}</description>
      <link>${this.escapeXml(articleUrl)}</link>
      <guid>${this.escapeXml(articleUrl)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${this.escapeXml(article.category)}</category>
      <author>TS Kulis</author>
      <enclosure url="${this.escapeXml(article.imgPath)}" type="image/jpeg" />
    </item>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${this.escapeXml(feedInfo.title)}</title>
    <description>${this.escapeXml(feedInfo.description)}</description>
    <link>${feedInfo.link}</link>
    <language>${feedInfo.language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>TS Kulis Sitemap Generator</generator>
    <atom:link href="${feedInfo.link}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITEMAP_CONFIG.baseUrl}/icon-512x512.png</url>
      <title>${this.escapeXml(feedInfo.title)}</title>
      <link>${feedInfo.link}</link>
    </image>
${items.join('')}
  </channel>
</rss>`;
  }

  // Write sitemap to file
  async writeSitemap(filename, xml) {
    const filePath = path.join(SITEMAP_CONFIG.outputDir, filename);
    
    await promisify(fs.writeFile)(filePath, xml, 'utf8');
    
    // Optionally compress large sitemaps
    if (SITEMAP_CONFIG.compress && xml.length > 10000) {
      await this.compressSitemap(filePath);
    }
  }

  // Compress sitemap with gzip
  async compressSitemap(filePath) {
    try {
      const zlib = require('zlib');
      const content = await promisify(fs.readFile)(filePath);
      const compressed = zlib.gzipSync(content);
      await promisify(fs.writeFile)(filePath + '.gz', compressed);
      console.log(`🗜️  Compressed ${path.basename(filePath)}`);
    } catch (error) {
      console.error('Failed to compress sitemap:', error);
    }
  }

  // Utility functions
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  escapeXml(text) {
    if (!text) return '';
    return text.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

// Export for Next.js build process
module.exports = {
  SitemapGenerator,
  SITEMAP_CONFIG,
  generateSitemaps: async () => {
    const generator = new SitemapGenerator();
    return await generator.generateSitemaps();
  }
};

// CLI usage
if (require.main === module) {
  (async () => {
    const generator = new SitemapGenerator();
    const result = await generator.generateSitemaps();
    
    if (result.success) {
      console.log(`\n🎉 Successfully generated ${result.urlCount} URLs across ${result.sitemapCount} sitemaps`);
      console.log('📁 Generated files:', result.files.join(', '));
    } else {
      console.error(`\n❌ Sitemap generation failed: ${result.error}`);
      process.exit(1);
    }
  })();
}