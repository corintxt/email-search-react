import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Sidebar = ({ filters, setFilters, onSearch }) => {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '';
                const res = await axios.get(`${apiUrl}/api/categories`);
                setCategories(['All categories', ...res.data.categories]);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (key, value) => {
        // Compute next filters from current props (avoid side-effects in setState updater)
        const next = { ...filters, [key]: value };
        setFilters(next);
        if (key === 'category_filter' && typeof onSearch === 'function') {
            onSearch(next);
        }
    };

    return (
        <div className="sidebar">
            <h2>Search Filters</h2>

            <div className="filter-group">
                <label>Max results: {filters.limit}</label>
                <input
                    type="range"
                    min="50"
                    max="1000"
                    step="50"
                    value={filters.limit}
                    onChange={(e) => handleChange('limit', parseInt(e.target.value))}
                />
            </div>

            <div className="filter-group">
                <label>Search in:</label>
                <div className="radio-group">
                    {['All fields', 'Subject', 'Body'].map(type => (
                        <label key={type}>
                            <input
                                type="radio"
                                value={type}
                                checked={filters.search_type === type}
                                onChange={(e) => handleChange('search_type', e.target.value)}
                            />
                            {type}
                        </label>
                    ))}
                </div>
            </div>

            {categories.length > 1 && (
                <div className="filter-group">
                    <label>Filter by category:</label>
                    <select
                        value={filters.category_filter || 'All categories'}
                        onChange={(e) => handleChange('category_filter', e.target.value === 'All categories' ? null : e.target.value)}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            )}

            <h3>Email Filters</h3>
            <div className="filter-group">
                <label>From (sender contains):</label>
                <input
                    type="text"
                    value={filters.sender_filter || ''}
                    onChange={(e) => handleChange('sender_filter', e.target.value)}
                />
            </div>

            <div className="filter-group">
                <label>To (recipient contains):</label>
                <input
                    type="text"
                    value={filters.recipient_filter || ''}
                    onChange={(e) => handleChange('recipient_filter', e.target.value)}
                />
            </div>

            <h3>Date Range</h3>
            <div className="filter-group">
                <label>
                    <input
                        type="checkbox"
                        checked={!!filters.date_from}
                        onChange={(e) => {
                            if (e.target.checked) {
                                const today = new Date().toISOString().split('T')[0];
                                handleChange('date_from', today);
                                handleChange('date_to', today);
                            } else {
                                handleChange('date_from', null);
                                handleChange('date_to', null);
                            }
                        }}
                    />
                    Filter by date range
                </label>
                {filters.date_from && (
                    <div className="date-inputs">
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => handleChange('date_from', e.target.value)}
                        />
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => handleChange('date_to', e.target.value)}
                        />
                    </div>
                )}
            </div>

            <h3>Display Options</h3>
            <div className="filter-group">
                <label>
                    <input
                        type="checkbox"
                        checked={filters.show_summaries}
                        onChange={(e) => handleChange('show_summaries', e.target.checked)}
                    />
                    Show summary
                </label>
            </div>

        </div>
    );
};

export default Sidebar;
