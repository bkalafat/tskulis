/**
 * Documentation Optimizer
 * Optimizes generated documentation for better performance and SEO
 */

const fs = require('fs').promises;
const path = require('path');

const optimizeMarkdown = (content) => {
  // Add table of contents
  const lines = content.split('\n');
  const headers = lines.filter(line => line.startsWith('#')).slice(1); // Skip main title
  
  if (headers.length > 2) {
    const toc = '## Table of Contents\n\n' + 
      headers.map(header => {
        const level = header.match(/^#+/)[0].length;
        const title = header.replace(/^#+\s*/, '');
        const anchor = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const indent = '  '.repeat(Math.max(0, level - 2));
        return `${indent}- [${title}](#${anchor})`;
      }).join('\n') + '\n\n';
    
    // Insert TOC after first header
    const firstHeaderIndex = lines.findIndex(line => line.startsWith('# '));
    if (firstHeaderIndex >= 0) {
      lines.splice(firstHeaderIndex + 2, 0, toc);
    }
  }

  // Optimize code blocks
  return lines.join('\n')
    .replace(/```tsx\n/g, '```typescript\n') // Better syntax highlighting
    .replace(/```js\n/g, '```javascript\n')
    .replace(/\n{3,}/g, '\n\n'); // Remove excessive line breaks
};

const generateSearchIndex = async (docsDir) => {
  const searchIndex = [];
  
  const processFile = async (filePath, relativePath) => {
    const content = await fs.readFile(filePath, 'utf8');
    const title = content.match(/^# (.+)$/m)?.[1] || path.basename(filePath, '.md');
    
    // Extract sections for search
    const sections = content.split(/^## /m).slice(1).map(section => {
      const lines = section.split('\n');
      const sectionTitle = lines[0];
      const sectionContent = lines.slice(1).join(' ').replace(/[#*`]/g, '').trim();
      
      return {
        title: sectionTitle,
        content: sectionContent.substring(0, 200) + (sectionContent.length > 200 ? '...' : ''),
        url: `/${relativePath}#${sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      };
    });

    searchIndex.push({
      title,
      url: `/${relativePath}`,
      content: content.replace(/[#*`]/g, '').substring(0, 300),
      sections
    });
  };

  const scanDirectory = async (dir, basePath = '') => {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      const relativePath = path.join(basePath, item).replace(/\\/g, '/');
      
      if (stat.isDirectory()) {
        await scanDirectory(fullPath, relativePath);
      } else if (item.endsWith('.md')) {
        await processFile(fullPath, relativePath);
      }
    }
  };

  await scanDirectory(docsDir);
  return searchIndex;
};

const optimizeDocs = async () => {
  const docsDir = path.join(__dirname, '..', 'docs');
  
  console.log('🔧 Optimizing documentation...');

  // Optimize all markdown files
  const optimizeDirectory = async (dir) => {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        await optimizeDirectory(fullPath);
      } else if (item.endsWith('.md')) {
        const content = await fs.readFile(fullPath, 'utf8');
        const optimized = optimizeMarkdown(content);
        await fs.writeFile(fullPath, optimized);
        console.log(`✅ Optimized ${item}`);
      }
    }
  };

  await optimizeDirectory(docsDir);

  // Generate search index
  console.log('🔍 Generating search index...');
  const searchIndex = await generateSearchIndex(docsDir);
  await fs.writeFile(
    path.join(docsDir, 'search-index.json'),
    JSON.stringify(searchIndex, null, 2)
  );

  // Generate site configuration
  const siteConfig = {
    title: 'TS Kulis Documentation',
    description: 'Comprehensive documentation for TS Kulis React components and API',
    baseUrl: '/',
    generateAt: new Date().toISOString(),
    componentsCount: searchIndex.length,
    sections: ['Components', 'API', 'Guides']
  };

  await fs.writeFile(
    path.join(docsDir, 'site-config.json'),
    JSON.stringify(siteConfig, null, 2)
  );

  console.log('✨ Documentation optimization completed!');
};

if (require.main === module) {
  optimizeDocs().catch(console.error);
}

module.exports = { optimizeDocs, optimizeMarkdown, generateSearchIndex };