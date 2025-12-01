import React from 'react';
import { useTranslation } from 'react-i18next';
import ResultItem from './ResultItem';

const ResultList = ({ results, query, showSummary }) => {
    const { t } = useTranslation();
    
    if (!results || results.length === 0) {
        return <div className="no-results">{t('results.noResults')}</div>;
    }

    const uniqueSenders = new Set(results.map(r => r.sender)).size;
    const uniqueRecipients = new Set(results.map(r => r.recipient)).size;
    const dates = results.map(r => new Date(r.date));
    const minDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
    const maxDate = new Date(Math.max(...dates)).toISOString().split('T')[0];

    const handleExport = () => {
        // Escape CSV values properly
        const escapeCsvValue = (val) => {
            if (val == null) return '';
            const str = String(val);
            // If value contains comma, quote, or newline, wrap in quotes and escape quotes
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const headers = Object.keys(results[0]).join(',');
        const csv = [
            headers,
            ...results.map(row => Object.values(row).map(escapeCsvValue).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `email_search_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="result-list">
            <div className="results-success">✅ {t('results.found', { count: results.length })}</div>

            <div className="stats-grid">
                <div className="stat-box">
                    <div className="stat-label">{t('results.totalResults')}</div>
                    <div className="stat-value">{results.length}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">{t('results.uniqueSenders')}</div>
                    <div className="stat-value">{uniqueSenders}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">{t('results.uniqueRecipients')}</div>
                    <div className="stat-value">{uniqueRecipients}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">{t('results.dateRange')}</div>
                    <div className="stat-value-small">{minDate} to {maxDate}</div>
                </div>
            </div>

            <button onClick={handleExport} className="export-btn-main">{t('results.exportButton')}</button>

            <hr />

            {results.map((result, idx) => (
                <ResultItem key={idx} result={result} query={query} showSummary={showSummary} />
            ))}
        </div>
    );
};

export default ResultList;
