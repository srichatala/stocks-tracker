import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock } from 'lucide-react';
import { fetchSymbols } from '../services/api';
import './ControlPanel.css';

const INTERVALS = [
    '1m', '2m', '5m', '15m', '30m', '60m', '90m',
    '1h', '1d', '5d', '1wk', '1mo', '3mo'
];

const ControlPanel = ({ onSearch, loading, initialSymbol }) => {
    // Current date logic
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    // Format to YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split('T')[0];

    // Use initialSymbol if provided, otherwise default helper empty
    const [symbol, setSymbol] = useState(initialSymbol || '');
    const [startDate, setStartDate] = useState(formatDate(today));
    const [endDate, setEndDate] = useState(formatDate(today));
    const [interval, setInterval] = useState('1d');

    const [availableSymbols, setAvailableSymbols] = useState([]);
    const [filteredSymbols, setFilteredSymbols] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Update symbol if initialSymbol changes
    useEffect(() => {
        setSymbol(initialSymbol || '');
    }, [initialSymbol]);

    // Fetch symbols on mount
    useEffect(() => {
        const loadSymbols = async () => {
            const data = await fetchSymbols();
            // Consolidate all symbols from all countries
            if (data && Array.isArray(data.data)) {
                const allSyms = data.data.flatMap(group => group.symbols || []);
                setAvailableSymbols(allSyms);
            }
        };
        loadSymbols();
    }, []);

    // Filter suggestions when symbol changes
    useEffect(() => {
        if (symbol && symbol.length > 0) {
            const matches = availableSymbols
                .filter(s => s.toLowerCase().includes(symbol.toLowerCase()))
                .slice(0, 10); // Limit to 10
            setFilteredSymbols(matches);
        } else {
            setFilteredSymbols([]);
        }
    }, [symbol, availableSymbols]);

    const handleStartDateChange = (e) => {
        const newDate = e.target.value;
        setStartDate(newDate);
        if (symbol) {
            onSearch({ symbol, startDate: newDate, endDate, interval });
        }
    };

    const handleEndDateChange = (e) => {
        const newDate = e.target.value;
        setEndDate(newDate);
        if (symbol) {
            onSearch({ symbol, startDate, endDate: newDate, interval });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowSuggestions(false);
        onSearch({ symbol, startDate, endDate, interval });
    };

    const handleSuggestionClick = (sym) => {
        setSymbol(sym);
        setShowSuggestions(false);
        onSearch({ symbol: sym, startDate, endDate, interval });
    };

    const handleIntervalChange = (e) => {
        const newInterval = e.target.value;
        setInterval(newInterval);
        if (symbol) {
            onSearch({ symbol, startDate, endDate, interval: newInterval });
        }
    };

    return (
        <div className="control-panel">
            <form onSubmit={handleSubmit} className="control-form">
                <div className="input-group symbol-group" style={{ position: 'relative', width: '100%' }}>
                    <label className="input-label">
                        <Search size={16} /> Symbol
                    </label>
                    <input
                        type="text"
                        value={symbol}
                        onChange={(e) => {
                            setSymbol(e.target.value.toUpperCase());
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                        className="input-field big-input"
                        placeholder="Search for a stock symbol (e.g. RY.TO, MMM)..."
                        autoComplete="off"
                        required
                    />
                    {showSuggestions && filteredSymbols.length > 0 && (
                        <ul className="suggestions-list">
                            {filteredSymbols.map(sym => (
                                <li key={sym} onClick={() => handleSuggestionClick(sym)}>
                                    {sym}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ControlPanel;
