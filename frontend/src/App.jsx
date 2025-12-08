import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import ResultList from './components/ResultList';
import './index.css';

function App() {
  const { t, i18n } = useTranslation();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);

  const [filters, setFilters] = useState({
    limit: 100,
    search_type: 'All fields',
    date_from: null,
    date_to: null,
    sender_filter: '',
    recipient_filter: '',
    show_summaries: false,
    category_filter: null
  });

  // Refs to always have access to current values
  const filtersRef = useRef(filters);
  const queryRef = useRef(query);
  const selectedTableIdRef = useRef(selectedTableId);

  // Keep refs in sync with state
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    selectedTableIdRef.current = selectedTableId;
  }, [selectedTableId]);

  // Fetch dataset configuration on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/config`);
        setDatasetInfo(response.data);
        // Set default selected table to first available
        if (response.data.tables && response.data.tables.length > 0) {
          setSelectedTableId(response.data.tables[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch config", error);
      }
    };
    fetchConfig();
  }, []);

  const handleSearch = useCallback(async (overrideFilters) => {
    // Ignore if overrideFilters is an event object (from onClick handlers)
    const isValidFilters = overrideFilters && typeof overrideFilters === 'object' && 'limit' in overrideFilters;
    setLoading(true);
    setError(null);
    try {
      // Use environment variable for API URL in production, fallback to proxy in development
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const payload = {
        query: queryRef.current,
        table_id: selectedTableIdRef.current,
        ...(isValidFilters ? overrideFilters : filtersRef.current)
      };
      const response = await axios.post(`${apiUrl}/api/search`, payload);
      setResults(response.data.results);
    } catch (err) {
      console.error("Search failed", err);
      setError("Search failed - database configuration error");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="app-container">
      <Sidebar
        filters={filters}
        setFilters={setFilters}
        onSearch={handleSearch}
        selectedTableId={selectedTableId}
      />

      <div className="main-content">
        <header className="app-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>{t('header.title')} • AFP-DDV</h1>
              {datasetInfo && datasetInfo.tables && datasetInfo.tables.length > 0 && (
                <div className="dataset-info">
                  {t('header.datasetInfo')}:{' '}
                  {datasetInfo.tables.length === 1 ? (
                    <code>{datasetInfo.dataset}.{datasetInfo.tables[0].table}</code>
                  ) : (
                    <select
                      className="dataset-select"
                      value={selectedTableId || ''}
                      onChange={(e) => {
                        setSelectedTableId(e.target.value);
                        setResults([]); // Clear results when switching tables
                      }}
                    >
                      {datasetInfo.tables.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => i18n.changeLanguage('en')} 
                className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
              >
                EN
              </button>
              <button 
                onClick={() => i18n.changeLanguage('fr')} 
                className={`lang-btn ${i18n.language === 'fr' ? 'active' : ''}`}
              >
                FR
              </button>
            </div>
          </div>
        </header>

        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="search-button" onClick={handleSearch} disabled={loading}>
            {loading ? t('search.searching') : `🔍 ${t('search.button')}`}
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">{t('results.loading')}</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <ResultList results={results} query={query} showSummary={filters.show_summaries} />
        )}
      </div>
    </div>
  );
}

export default App;
