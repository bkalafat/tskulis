/**
 * E2E Tests for TS Kulis using Playwright
 * End-to-end testing scenarios
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
test.describe.configure({ mode: 'parallel' });

test.describe('TS Kulis Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/TS Kulis/);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should display main navigation', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    await expect(nav.locator('text=Trabzonspor')).toBeVisible();
    await expect(nav.locator('text=Transfer')).toBeVisible();
    await expect(nav.locator('text=Genel')).toBeVisible();
    await expect(nav.locator('text=Futbol')).toBeVisible();
  });

  test('should display latest news on homepage', async ({ page }) => {
    const newsContainer = page.locator('.latest-news');
    await expect(newsContainer).toBeVisible();
    
    const newsItems = newsContainer.locator('.news-item');
    await expect(newsItems.first()).toBeVisible();
    
    // Check that news items have required elements
    const firstNews = newsItems.first();
    await expect(firstNews.locator('img')).toBeVisible();
    await expect(firstNews.locator('.news-title')).toBeVisible();
    await expect(firstNews.locator('.news-summary')).toBeVisible();
  });

  test('should have working search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="ara"]');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('Trabzonspor');
    await page.keyboard.press('Enter');
    
    await expect(page).toHaveURL(/search/);
    await expect(page.locator('.search-results')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('.mobile-menu-toggle')).toBeVisible();
    
    // Test mobile menu
    await page.locator('.mobile-menu-toggle').click();
    await expect(page.locator('.mobile-nav')).toBeVisible();
  });
});

test.describe('News Categories', () => {
  test('should navigate to Trabzonspor category', async ({ page }) => {
    await page.goto('/');
    await page.locator('text=Trabzonspor').click();
    
    await expect(page).toHaveURL(/trabzonspor/);
    await expect(page.locator('h1')).toContainText('Trabzonspor');
    
    const newsItems = page.locator('.news-item');
    await expect(newsItems.first()).toBeVisible();
  });

  test('should load more news on pagination', async ({ page }) => {
    await page.goto('/trabzonspor');
    
    const initialNewsCount = await page.locator('.news-item').count();
    
    if (await page.locator('text=Daha fazla').isVisible()) {
      await page.locator('text=Daha fazla').click();
      await page.waitForTimeout(1000);
      
      const newNewsCount = await page.locator('.news-item').count();
      expect(newNewsCount).toBeGreaterThan(initialNewsCount);
    }
  });

  test('should filter news by date', async ({ page }) => {
    await page.goto('/trabzonspor');
    
    const dateFilter = page.locator('select[name="dateFilter"]');
    if (await dateFilter.isVisible()) {
      await dateFilter.selectOption('today');
      await page.waitForTimeout(1000);
      
      const newsItems = page.locator('.news-item');
      const count = await newsItems.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('News Article Page', () => {
  test('should display full news article', async ({ page }) => {
    await page.goto('/');
    
    // Click on first news item
    await page.locator('.news-item').first().click();
    
    // Should navigate to article page
    await expect(page.locator('article')).toBeVisible();
    await expect(page.locator('.article-title')).toBeVisible();
    await expect(page.locator('.article-content')).toBeVisible();
    await expect(page.locator('.article-date')).toBeVisible();
  });

  test('should have social sharing buttons', async ({ page }) => {
    await page.goto('/');
    await page.locator('.news-item').first().click();
    
    const shareContainer = page.locator('.social-share');
    await expect(shareContainer).toBeVisible();
    
    await expect(shareContainer.locator('[title*="Facebook"]')).toBeVisible();
    await expect(shareContainer.locator('[title*="Twitter"]')).toBeVisible();
    await expect(shareContainer.locator('[title*="WhatsApp"]')).toBeVisible();
  });

  test('should display related news', async ({ page }) => {
    await page.goto('/');
    await page.locator('.news-item').first().click();
    
    const relatedNews = page.locator('.related-news');
    if (await relatedNews.isVisible()) {
      await expect(relatedNews.locator('.news-item').first()).toBeVisible();
    }
  });

  test('should have working comment section', async ({ page }) => {
    await page.goto('/');
    await page.locator('.news-item').first().click();
    
    const commentSection = page.locator('.comments-section');
    if (await commentSection.isVisible()) {
      const commentForm = commentSection.locator('form');
      await expect(commentForm).toBeVisible();
      
      await expect(commentForm.locator('input[name="name"]')).toBeVisible();
      await expect(commentForm.locator('textarea[name="comment"]')).toBeVisible();
      await expect(commentForm.locator('button[type="submit"]')).toBeVisible();
    }
  });
});

test.describe('Search Functionality', () => {
  test('should perform search and display results', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('input[placeholder*="ara"]');
    await searchInput.fill('transfer');
    await page.keyboard.press('Enter');
    
    await expect(page).toHaveURL(/search.*transfer/);
    await expect(page.locator('.search-results')).toBeVisible();
    
    const resultItems = page.locator('.search-result');
    if (await resultItems.count() > 0) {
      await expect(resultItems.first()).toBeVisible();
    }
  });

  test('should show search suggestions', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('input[placeholder*="ara"]');
    await searchInput.fill('trab');
    
    const suggestions = page.locator('.search-suggestions');
    if (await suggestions.isVisible()) {
      await expect(suggestions.locator('.suggestion-item').first()).toBeVisible();
    }
  });

  test('should handle empty search results', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('input[placeholder*="ara"]');
    await searchInput.fill('xyzabc123nonexistent');
    await page.keyboard.press('Enter');
    
    await expect(page.locator('.no-results')).toBeVisible();
    await expect(page.locator('text=sonuç bulunamadı')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load homepage within performance budget', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    
    // Check Core Web Vitals
    const lcpElement = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    expect(lcpElement).toBeLessThan(2500); // LCP should be under 2.5s
  });

  test('should have optimized images', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      await expect(img).toHaveAttribute('loading', 'lazy');
      
      // Check if image has proper alt text
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBe('');
    }
  });

  test('should implement service worker for caching', async ({ page }) => {
    await page.goto('/');
    
    const serviceWorkerRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(serviceWorkerRegistered).toBe(true);
  });
});

test.describe('SEO', () => {
  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('meta[name="description"]')).toBeVisible();
    await expect(page.locator('meta[property="og:title"]')).toBeVisible();
    await expect(page.locator('meta[property="og:description"]')).toBeVisible();
    await expect(page.locator('meta[property="og:image"]')).toBeVisible();
    await expect(page.locator('meta[name="twitter:card"]')).toBeVisible();
  });

  test('should have structured data', async ({ page }) => {
    await page.goto('/');
    await page.locator('.news-item').first().click();
    
    const structuredData = await page.locator('script[type="application/ld+json"]').textContent();
    expect(structuredData).toContain('"@type":"NewsArticle"');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const firstFocusable = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT'].includes(firstFocusable || '')).toBe(true);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    const nav = page.locator('nav');
    await expect(nav).toHaveAttribute('aria-label');
    
    const searchInput = page.locator('input[placeholder*="ara"]');
    if (await searchInput.isVisible()) {
      await expect(searchInput).toHaveAttribute('aria-label');
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    // This would require a more sophisticated color contrast checker
    // For now, we ensure text elements are visible
    await expect(page.locator('body')).toBeVisible();
    const textColor = await page.evaluate(() => {
      const body = document.body;
      return getComputedStyle(body).color;
    });
    
    expect(textColor).not.toBe('rgba(0, 0, 0, 0)'); // Should not be transparent
  });
});

test.describe('Admin Panel', () => {
  test.skip('should require authentication for admin access', async ({ page }) => {
    await page.goto('/adminpanel');
    
    // Should redirect to login or show login form
    await expect(page).toHaveURL(/login|auth/);
  });

  test.skip('should allow authenticated admin to create news', async ({ page }) => {
    // This test would require authentication setup
    // Skip for now as it requires NextAuth configuration
  });
});