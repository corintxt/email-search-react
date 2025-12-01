import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import ResultList from './components/ResultList';
import './index.css';

function App() {
  const { t, i18n } = useTranslation();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [datasetInfo, setDatasetInfo] = useState(null);

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

  // Fetch dataset configuration on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/config`);
        setDatasetInfo(response.data);
      } catch (error) {
        console.error("Failed to fetch config", error);
      }
    };
    fetchConfig();
  }, []);

  const handleSearch = async (overrideFilters) => {
    setLoading(true);
    try {
      // Use environment variable for API URL in production, fallback to proxy in development
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const payload = {
        query: query,
        ...(overrideFilters ?? filters)
      };
      const response = await axios.post(`${apiUrl}/api/search`, payload);
      setResults(response.data.results);
    } catch (error) {
      console.error("Search failed", error);
      alert("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        filters={filters}
        setFilters={setFilters}
        onSearch={handleSearch}
      />

      <div className="main-content">
        <header className="app-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>{t('header.title')} • AFP-DDV</h1>
              {datasetInfo && (
                <div className="dataset-info">
                  {t('header.datasetInfo')}: <code>{datasetInfo.dataset}.{datasetInfo.table}</code>
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
        ) : (
          <ResultList results={results} query={query} showSummary={filters.show_summaries} />
        )}
      </div>
    </div>
  );
}

export default App;
