import React, { useState, useEffect } from 'react';
import { fetchTopStocks } from '../services/api';
import './TopStocks.css';

const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IN', name: 'India' }
];

const TopStocks = ({ onSelectSymbol, selectedSymbol, country, setCountry }) => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadTopStocks();
    }, [country]);

    const loadTopStocks = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchTopStocks(country, 10);
            // API returns object: { country_code, country_name, index, count, stocks: [...] }
            if (data && Array.isArray(data.stocks)) {
                setStocks(data.stocks);
            } else {
                setStocks([]);
                console.warn("Unexpected top stocks data format:", data);
            }
        } catch (err) {
            setError("Failed to load top stocks.");
            setStocks([]);
        } finally {
            setLoading(false);
        }
    };

    const formatMarketCap = (num) => {
        if (!num) return 'N/A';
        if (num >= 1.0e+12) return `$${(num / 1.0e+12).toFixed(2)}T`;
        if (num >= 1.0e+9) return `$${(num / 1.0e+9).toFixed(2)}B`;
        if (num >= 1.0e+6) return `$${(num / 1.0e+6).toFixed(2)}M`;
        return `$${num.toLocaleString()}`;
    }

    return (
        <div className="top-stocks-container">
            <div className="top-stocks-header">
                <h2>Top 10 Stocks</h2>
                <div className="country-selector">
                    <label htmlFor="country-select">Country:</label>
                    <select
                        id="country-select"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="country-select"
                    >
                        {COUNTRIES.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && <div className="loading-state">Loading market movers...</div>}

            {error && <div className="error-message">{error}</div>}

            {!loading && !error && (
                <div className="stocks-table-wrapper">
                    <table className="stocks-table">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Name</th>
                                <th>Sector</th>
                                <th>Industry</th>
                                <th>Price</th>
                                <th>Market Cap</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stocks.map((stock, index) => (
                                <tr
                                    key={stock.symbol || index}
                                    onClick={() => onSelectSymbol(stock.symbol)}
                                    className={`clickable-row ${selectedSymbol === stock.symbol ? 'selected-row' : ''}`}
                                >
                                    <td className="symbol-cell">{stock.symbol}</td>
                                    <td>{stock.name || stock.company_name || 'N/A'}</td>
                                    <td>{stock.sector || 'N/A'}</td>
                                    <td>{stock.industry || 'N/A'}</td>
                                    <td>${stock.price?.toFixed(2) || 'N/A'} {stock.currency}</td>
                                    <td>{formatMarketCap(stock.market_cap)}</td>
                                    <td>
                                        <button className="analyze-btn">Analyze</button>
                                    </td>
                                </tr>
                            ))}
                            {stocks.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No stocks found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TopStocks;
