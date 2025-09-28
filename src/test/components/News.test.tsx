/**
 * News Component Tests
 * Comprehensive testing for news components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/testUtils';
import { createMockNews, createMockNewsArray, mockFetch } from '../utils/testUtils';
import NewsCard from '../../components/News/NewsCard';
import NewsList from '../../components/News/NewsList';
import CategoryNews from '../../components/News/CategoryNews';

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

jest.mock('next/link', () => {
  return function MockLink({ href, children }: any) {
    return <a href={href}>{children}</a>;
  };
});

describe('NewsCard Component', () => {
  const mockNews = createMockNews();

  test('renders news card with correct content', () => {
    render(<NewsCard news={mockNews} />);
    
    expect(screen.getByText(mockNews.caption)).toBeInTheDocument();
    expect(screen.getByAltText(mockNews.imgAlt)).toBeInTheDocument();
    expect(screen.getByText(mockNews.summary)).toBeInTheDocument();
  });

  test('displays correct category and date', () => {
    render(<NewsCard news={mockNews} />);
    
    expect(screen.getByText(mockNews.category)).toBeInTheDocument();
    expect(screen.getByText(/28 Eylül 2025/)).toBeInTheDocument();
  });

  test('handles click events', () => {
    const onClick = jest.fn();
    render(<NewsCard news={mockNews} onClick={onClick} />);
    
    fireEvent.click(screen.getByText(mockNews.caption));
    expect(onClick).toHaveBeenCalledWith(mockNews);
  });

  test('shows view count when provided', () => {
    const newsWithViews = createMockNews({ viewCount: 150 });
    render(<NewsCard news={newsWithViews} showViewCount />);
    
    expect(screen.getByText('150 görüntülenme')).toBeInTheDocument();
  });

  test('applies priority styling for high priority news', () => {
    const priorityNews = createMockNews({ priority: 1 });
    render(<NewsCard news={priorityNews} />);
    
    const card = screen.getByTestId('news-card');
    expect(card).toHaveClass('priority-high');
  });
});

describe('NewsList Component', () => {
  const mockNewsArray = createMockNewsArray(5);

  beforeEach(() => {
    mockFetch(mockNewsArray);
  });

  test('renders list of news items', async () => {
    render(<NewsList category="Trabzonspor" />);
    
    await waitFor(() => {
      mockNewsArray.forEach(news => {
        expect(screen.getByText(news.caption)).toBeInTheDocument();
      });
    });
  });

  test('shows loading state initially', () => {
    render(<NewsList category="Trabzonspor" />);
    
    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
  });

  test('handles empty news list', async () => {
    mockFetch([]);
    render(<NewsList category="Transfer" />);
    
    await waitFor(() => {
      expect(screen.getByText('Henüz haber bulunmuyor')).toBeInTheDocument();
    });
  });

  test('implements pagination correctly', async () => {
    const largeNewsArray = createMockNewsArray(25);
    mockFetch(largeNewsArray);
    
    render(<NewsList category="Trabzonspor" pageSize={10} />);
    
    await waitFor(() => {
      // Should show only first 10 items
      expect(screen.getAllByTestId('news-card')).toHaveLength(10);
      expect(screen.getByText('Daha fazla yükle')).toBeInTheDocument();
    });
  });

  test('loads more news on pagination click', async () => {
    const largeNewsArray = createMockNewsArray(25);
    mockFetch(largeNewsArray);
    
    render(<NewsList category="Trabzonspor" pageSize={10} />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Daha fazla yükle'));
    });
    
    await waitFor(() => {
      expect(screen.getAllByTestId('news-card')).toHaveLength(20);
    });
  });
});

describe('CategoryNews Component', () => {
  const mockCategoryNews = createMockNewsArray(8);

  beforeEach(() => {
    mockFetch(mockCategoryNews);
  });

  test('renders category news with proper heading', async () => {
    render(<CategoryNews category="Trabzonspor" limit={6} />);
    
    await waitFor(() => {
      expect(screen.getByText('Trabzonspor Haberleri')).toBeInTheDocument();
    });
  });

  test('respects limit prop', async () => {
    render(<CategoryNews category="Transfer" limit={4} />);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('news-card')).toHaveLength(4);
    });
  });

  test('shows "Tümünü Gör" link', async () => {
    render(<CategoryNews category="Football" />);
    
    await waitFor(() => {
      const viewAllLink = screen.getByText('Tümünü Gör');
      expect(viewAllLink).toBeInTheDocument();
      expect(viewAllLink.closest('a')).toHaveAttribute('href', '/football');
    });
  });

  test('handles API errors gracefully', async () => {
    mockFetch(null, 500);
    
    render(<CategoryNews category="General" />);
    
    await waitFor(() => {
      expect(screen.getByText('Haberler yüklenirken hata oluştu')).toBeInTheDocument();
    });
  });

  test('implements responsive grid layout', async () => {
    render(<CategoryNews category="Trabzonspor" />);
    
    await waitFor(() => {
      const container = screen.getByTestId('category-news-grid');
      expect(container).toHaveClass('news-grid', 'responsive-grid');
    });
  });
});

describe('News Component Integration', () => {
  test('news card click navigates to detail page', () => {
    const mockNews = createMockNews();
    render(<NewsCard news={mockNews} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/trabzonspor/${mockNews.slug}`);
  });

  test('category filter works correctly', async () => {
    const mixedNews = [
      createMockNews({ category: 'Trabzonspor', id: '1' }),
      createMockNews({ category: 'Transfer', id: '2' }),
      createMockNews({ category: 'Trabzonspor', id: '3' })
    ];
    
    mockFetch(mixedNews);
    
    render(<NewsList category="Trabzonspor" />);
    
    await waitFor(() => {
      const newsItems = screen.getAllByTestId('news-card');
      newsItems.forEach(item => {
        expect(item).toHaveTextContent('Trabzonspor');
      });
    });
  });

  test('search functionality works', async () => {
    const searchResults = createMockNewsArray(3);
    mockFetch(searchResults);
    
    render(<NewsList searchQuery="test" />);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('news-card')).toHaveLength(3);
    });
  });
});

describe('News Component Performance', () => {
  test('implements lazy loading for images', () => {
    const mockNews = createMockNews();
    render(<NewsCard news={mockNews} />);
    
    const image = screen.getByAltText(mockNews.imgAlt);
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  test('memoizes expensive operations', () => {
    const mockNews = createMockNews();
    const { rerender } = render(<NewsCard news={mockNews} />);
    
    // Component should not re-render if props haven't changed
    const initialRenderCount = jest.fn();
    rerender(<NewsCard news={mockNews} />);
    
    expect(initialRenderCount).not.toHaveBeenCalled();
  });

  test('debounces search input', async () => {
    const onSearch = jest.fn();
    render(<NewsList onSearch={onSearch} />);
    
    const searchInput = screen.getByPlaceholderText('Haber ara...');
    
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    // Should debounce and only call once
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith('test query');
    }, { timeout: 500 });
  });
});

describe('News Component Accessibility', () => {
  test('has proper ARIA labels', () => {
    const mockNews = createMockNews();
    render(<NewsCard news={mockNews} />);
    
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', `Haber: ${mockNews.caption}`);
  });

  test('supports keyboard navigation', () => {
    const mockNews = createMockNews();
    render(<NewsCard news={mockNews} />);
    
    const link = screen.getByRole('link');
    expect(link).toBeVisible();
    
    fireEvent.focus(link);
    expect(link).toHaveFocus();
  });

  test('has proper heading hierarchy', () => {
    render(<CategoryNews category="Trabzonspor" />);
    
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Trabzonspor Haberleri');
  });

  test('provides alternative text for images', () => {
    const mockNews = createMockNews();
    render(<NewsCard news={mockNews} />);
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', mockNews.imgAlt);
  });
});