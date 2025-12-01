import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Highlight = ({ text, query }) => {
    if (!query || !text) return <span>{text}</span>;

    const parts = text.split(new RegExp(`(${query.split(' ').join('|')})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() || query.split(' ').some(q => q.toLowerCase() === part.toLowerCase()) ?
                    <span key={i} className="highlight">{part}</span> : part
            )}
        </span>
    );
};

const ResultItem = ({ result, query, showSummary }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="result-card">
            <div className="result-header">
                <div className="result-subject">
                    <h5><Highlight text={result.Subject} query={query} /></h5>
                </div>
                <div className="result-date">
                    <strong>{t('results.date')}:</strong> {result.date}
                </div>
            </div>

            <div className="result-meta">
                <div><strong>{t('results.from')}:</strong> {result.sender}</div>
                <div><strong>{t('results.to')}:</strong> {result.recipient}</div>
            </div>

            <div className="result-body">
                {showSummary && result.summary ? (
                    <p><em><Highlight text={result.summary} query={query} /></em></p>
                ) : (
                    <p>
                        <strong>{t('results.body')}: </strong>
                        <Highlight text={result.Body.substring(0, 500)} query={query} />
                        {result.Body.length > 500 && '...'}
                    </p>
                )}
            </div>

            <div className="result-footer">
                {result.category && (
                    <span className="category-badge">{result.category}</span>
                )}
                <span className="result-id">ID: {result.id} • {t('results.sourceFile')}: {result.filename}</span>
            </div>

            <button className="view-full-btn" onClick={() => setExpanded(!expanded)}>
                {expanded ? t('results.collapse') : t('results.viewFull')}
            </button>

            {expanded && (
                <div className="full-body">
                    <h6>{t('results.fullEmailBody')}</h6>
                    <div className="body-content">
                        <Highlight text={result.Body} query={query} />
                    </div>
                </div>
            )}
            <hr />
        </div>
    );
};

export default ResultItem;
