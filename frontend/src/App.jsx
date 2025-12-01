import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import ResultList from './components/ResultList';
import './index.css';

function App() {
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
          <h1>Email Search Tool</h1>
          {datasetInfo && (
            <div className="dataset-info">
              Target dataset: <code>{datasetInfo.dataset}.{datasetInfo.table}</code>
            </div>
          )}
        </header>

        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter keywords to search..."
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="search-button" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : '🔍 Search'}
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">🔍 Searching emails...</div>
        ) : (
          <ResultList results={results} query={query} showSummary={filters.show_summaries} />
        )}
      </div>
    </div>
  );
}

export default App;
