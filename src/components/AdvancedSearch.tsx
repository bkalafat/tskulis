/**
 * Advanced Search Component for TS Kulis
 * Real-time search with filters, suggestions, and analytics
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { NewsType } from '../types/NewsType';
import { useAnalytics } from '../lib/analytics';
import { CATEGORY, TYPE } from '../utils/enum';

interface SearchProps {
  placeholder?: string;
  onResultSelect?: (result: NewsType) => void;
  showFilters?: boolean;
  maxResults?: number;
  categories?: string[];
}

interface SearchFilters {
  category: string;
  type: string;
  dateRange: string;
  sortBy: 'relevance' | 'date' | 'popularity';
}

interface SearchResult extends NewsType {
  score: number;
  highlightedTitle: string;
  highlightedContent: string;
}

interface SearchSuggestion {
  query: string;
  count: number;
  category?: string;
}

const SEARCH_CONFIG = {
  debounceMs: 300,
  minQueryLength: 2,
  maxResults: 10,
  maxSuggestions: 5,
  highlightClass: 'search-highlight'
};

export const AdvancedSearch: React.FC<SearchProps> = ({
  placeholder = 'Haber ara...',
  onResultSelect,
  showFilters = true,
  maxResults = SEARCH_CONFIG.maxResults,
  categories = Object.values(CATEGORY)
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'all',
    type: 'all',
    dateRange: 'all',
    sortBy: 'relevance'
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { trackEvent } = useAnalytics();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string, searchFilters: SearchFilters) => {
      if (searchQuery.length >= SEARCH_CONFIG.minQueryLength) {
        performSearch(searchQuery, searchFilters);
      } else {
        setResults([]);
        setSuggestions([]);
        setShowResults(false);
      }
    }, SEARCH_CONFIG.debounceMs),
    []
  );

  // Effect for search execution
  useEffect(() => {
    if (query.trim()) {
      setIsLoading(true);
      debouncedSearch(query.trim(), filters);
    } else {
      setResults([]);
      setSuggestions([]);
      setShowResults(false);
      setIsLoading(false);
    }
  }, [query, filters, debouncedSearch]);

  // Handle clicks outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        } else {
          performFullSearch();
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Perform search with API call
  const performSearch = async (searchQuery: string, searchFilters: SearchFilters) => {
    try {
      const searchParams = new URLSearchParams({
        q: searchQuery,
        limit: maxResults.toString(),
        category: searchFilters.category !== 'all' ? searchFilters.category : '',
        type: searchFilters.type !== 'all' ? searchFilters.type : '',
        dateRange: searchFilters.dateRange !== 'all' ? searchFilters.dateRange : '',
        sortBy: searchFilters.sortBy
      });

      // Remove empty parameters
      Array.from(searchParams.entries()).forEach(([key, value]) => {
        if (!value) searchParams.delete(key);
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_PATH}/news/search?${searchParams}`
      );

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      const searchResults = Array.isArray(data) ? data : data.data || [];

      // Process and highlight results
      const processedResults = searchResults.map((item: NewsType) => 
        processSearchResult(item, searchQuery)
      );

      setResults(processedResults);
      setShowResults(true);
      setSelectedIndex(-1);

      // Load search suggestions
      if (searchQuery.length >= 2) {
        loadSearchSuggestions(searchQuery);
      }

      // Track search event
      trackEvent('search_query', {
        event_category: 'search',
        event_label: searchQuery,
        search_term: searchQuery,
        search_results_count: processedResults.length,
        search_category: searchFilters.category,
        search_type: searchFilters.type
      } as any);

    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Process search result with highlighting
  const processSearchResult = (item: NewsType, searchQuery: string): SearchResult => {
    const query = searchQuery.toLowerCase();
    const title = item.caption.toLowerCase();
    const content = (item.summary || item.content).toLowerCase();

    // Calculate relevance score
    let score = 0;
    if (title.includes(query)) score += 10;
    if (content.includes(query)) score += 5;
    if (item.keywords?.toLowerCase().includes(query)) score += 3;
    if (item.subjects?.some(subject => subject.toLowerCase().includes(query))) score += 2;

    // Add recency bonus
    const daysSincePublish = Math.floor(
      (Date.now() - new Date(item.createDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSincePublish <= 1) score += 5;
    else if (daysSincePublish <= 7) score += 2;

    return {
      ...item,
      score,
      highlightedTitle: highlightText(item.caption, searchQuery),
      highlightedContent: highlightText(
        (item.summary || item.content).substring(0, 150) + '...',
        searchQuery
      )
    };
  };

  // Highlight matching text
  const highlightText = (text: string, query: string): string => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, `<mark class="${SEARCH_CONFIG.highlightClass}">$1</mark>`);
  };

  // Load search suggestions
  const loadSearchSuggestions = async (query: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_PATH}/search/suggestions?q=${encodeURIComponent(query)}&limit=${SEARCH_CONFIG.maxSuggestions}`
      );

      if (response.ok) {
        const suggestions = await response.json();
        setSuggestions(suggestions || []);
      }
    } catch (error) {
      console.warn('Failed to load suggestions:', error);
    }
  };

  // Handle result selection
  const handleResultSelect = (result: NewsType) => {
    trackEvent('search_result_click', {
      event_category: 'search',
      event_label: result.caption,
      content_title: result.caption,
      content_id: result.id,
      search_term: query
    } as any);

    if (onResultSelect) {
      onResultSelect(result);
    } else {
      // Default navigation
      window.location.href = `/${result.category.toLowerCase()}/${result.slug}`;
    }

    setShowResults(false);
    setQuery('');
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.query);
    inputRef.current?.focus();
    
    trackEvent('search_suggestion_click', {
      event_category: 'search',
      event_label: suggestion.query,
      search_term: suggestion.query
    } as any);
  };

  // Perform full search (navigate to search page)
  const performFullSearch = () => {
    if (!query.trim()) return;

    trackEvent('search_full_results', {
      event_category: 'search',
      event_label: query,
      search_term: query
    } as any);

    const searchParams = new URLSearchParams({
      q: query,
      ...(filters.category !== 'all' && { category: filters.category }),
      ...(filters.type !== 'all' && { type: filters.type }),
      ...(filters.dateRange !== 'all' && { date: filters.dateRange }),
      sort: filters.sortBy
    });

    window.location.href = `/search?${searchParams}`;
  };

  // Update filters
  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div ref={searchRef} className="advanced-search">
      <style jsx>{`
        .advanced-search {
          position: relative;
          width: 100%;
          max-width: 600px;
        }

        .search-input-container {
          position: relative;
          display: flex;
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 25px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .search-input-container.focused {
          border-color: #007bff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }

        .search-input {
          flex: 1;
          padding: 12px 20px;
          border: none;
          outline: none;
          font-size: 16px;
          background: transparent;
        }

        .search-button {
          padding: 12px 20px;
          background: #007bff;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.3s ease;
        }

        .search-button:hover {
          background: #0056b3;
        }

        .search-loading {
          padding: 12px 20px;
          color: #6c757d;
          display: flex;
          align-items: center;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e9ecef;
          border-top: 2px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .search-filters {
          display: flex;
          gap: 12px;
          margin-top: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          flex-wrap: wrap;
        }

        .filter-select {
          padding: 6px 12px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          background: white;
          font-size: 14px;
          min-width: 120px;
        }

        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #dee2e6;
          border-top: none;
          border-radius: 0 0 8px 8px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .search-result {
          padding: 16px;
          border-bottom: 1px solid #f1f3f4;
          cursor: pointer;
          transition: background 0.2s ease;
          display: flex;
          gap: 12px;
        }

        .search-result:hover,
        .search-result.selected {
          background: #f8f9fa;
        }

        .result-image {
          width: 60px;
          height: 60px;
          border-radius: 4px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .result-content {
          flex: 1;
          min-width: 0;
        }

        .result-title {
          font-weight: 600;
          font-size: 14px;
          line-height: 1.4;
          margin-bottom: 4px;
          color: #2c3e50;
        }

        .result-summary {
          font-size: 13px;
          color: #6c757d;
          line-height: 1.3;
        }

        .result-meta {
          display: flex;
          gap: 12px;
          margin-top: 6px;
          font-size: 12px;
          color: #9ca3af;
        }

        .search-suggestions {
          padding: 12px;
          border-bottom: 1px solid #f1f3f4;
        }

        .suggestions-title {
          font-size: 12px;
          font-weight: 600;
          color: #6c757d;
          margin-bottom: 8px;
        }

        .suggestion-item {
          display: inline-block;
          padding: 4px 8px;
          margin: 2px 4px 2px 0;
          background: #f8f9fa;
          border-radius: 12px;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .suggestion-item:hover {
          background: #e9ecef;
        }

        .no-results {
          padding: 20px;
          text-align: center;
          color: #6c757d;
          font-size: 14px;
        }

        .search-footer {
          padding: 12px;
          background: #f8f9fa;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
        }

        :global(.search-highlight) {
          background: #fff3cd;
          color: #856404;
          padding: 1px 2px;
          border-radius: 2px;
        }

        @media (max-width: 768px) {
          .search-filters {
            flex-direction: column;
          }

          .filter-select {
            min-width: auto;
          }

          .search-result {
            padding: 12px;
          }

          .result-image {
            width: 50px;
            height: 50px;
          }
        }
      `}</style>

      <div className={`search-input-container ${showResults ? 'focused' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(query.length >= SEARCH_CONFIG.minQueryLength && results.length > 0)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        
        {isLoading ? (
          <div className="search-loading">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <button 
            className="search-button"
            onClick={performFullSearch}
            disabled={!query.trim()}
          >
            🔍 Ara
          </button>
        )}
      </div>

      {showFilters && (
        <div className="search-filters">
          <select
            className="filter-select"
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
          >
            <option value="all">Tüm Türler</option>
            {Object.values(TYPE).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filters.dateRange}
            onChange={(e) => updateFilter('dateRange', e.target.value)}
          >
            <option value="all">Tüm Tarihler</option>
            <option value="today">Bugün</option>
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
            <option value="year">Bu Yıl</option>
          </select>

          <select
            className="filter-select"
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value as SearchFilters['sortBy'])}
          >
            <option value="relevance">İlgililik</option>
            <option value="date">Tarih</option>
            <option value="popularity">Popülerlik</option>
          </select>
        </div>
      )}

      {showResults && (
        <div className="search-results">
          {suggestions.length > 0 && (
            <div className="search-suggestions">
              <div className="suggestions-title">Öneriler:</div>
              {suggestions.map((suggestion, index) => (
                <span
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  {suggestion.query} ({suggestion.count})
                </span>
              ))}
            </div>
          )}

          {results.length > 0 ? (
            <>
              {results.map((result, index) => (
                <div
                  key={result.id}
                  className={`search-result ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleResultSelect(result)}
                >
                  <img
                    src={result.imgPath}
                    alt={result.imgAlt}
                    className="result-image"
                    loading="lazy"
                  />
                  <div className="result-content">
                    <div 
                      className="result-title"
                      dangerouslySetInnerHTML={{ __html: result.highlightedTitle }}
                    />
                    <div 
                      className="result-summary"
                      dangerouslySetInnerHTML={{ __html: result.highlightedContent }}
                    />
                    <div className="result-meta">
                      <span>{result.category}</span>
                      <span>{new Date(result.createDate).toLocaleDateString('tr-TR')}</span>
                      {result.viewCount && <span>{result.viewCount} görüntülenme</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div className="search-footer">
                <button onClick={performFullSearch}>
                  Tüm sonuçları gör →
                </button>
              </div>
            </>
          ) : !isLoading && query.length >= SEARCH_CONFIG.minQueryLength && (
            <div className="no-results">
              "{query}" için sonuç bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Utility functions
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default AdvancedSearch;