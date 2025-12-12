import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Clock, X, Maximize2, Minimize2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, CartesianGrid, Tooltip } from 'recharts';
import { fetchLiveStockData } from '../services/api';

const LiveStockData = ({ symbol, count, onClose, onUpdate, onSelect, onPriceUpdate }) => {
    const [data, setData] = useState([]);
    const [latestPrice, setLatestPrice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const hasLoadedRef = useRef(false);

    useEffect(() => {
        if (!symbol) return;

        let timeoutId;
        let intervalId;

        const fetchData = async () => {
            // Check if market is open (Mon-Fri, 09:30 - 16:00)
            const now = new Date();
            const day = now.getDay();
            const hour = now.getHours();
            const minute = now.getMinutes();
            const minutesOfDay = hour * 60 + minute;
            const startMinutes = 9 * 60 + 30; // 09:30
            const endMinutes = 16 * 60;       // 16:00

            // Allow initial fetch (if data empty) or if forced, but primarily restrict live updates
            // Users might want to see cached/last data, but for "live" updates we check time.

            // NOTE: User asked strictly for "9:30 PM to 4 PM". 
            // Assuming 9:30 AM (09:30) to 4 PM (16:00) is the intent for US markets.
            const isMarketOpen = (day >= 1 && day <= 5) && (minutesOfDay >= startMinutes && minutesOfDay < endMinutes);

            // If we have no data, we should probably fetch at least once regardless of time 
            // to populate the view with *last available* data (api usually returns last session if closed).
            // But if we already have data, and market is closed, we skip.
            // Use ref to avoid stale closure issues with interval
            if (hasLoadedRef.current && !isMarketOpen) {
                // Market closed, no new data expected
                return;
            }

            setLatestPrice(prev => {
                if (!prev) setLoading(true);
                return prev;
            });

            try {
                // If strictly restricting calls:
                if (!isMarketOpen && hasLoadedRef.current) return;

                // We'll proceed if it's the first load OR market is open.

                console.log(`Fetching live data for ${symbol}...`);
                const result = await fetchLiveStockData(symbol, '1m');
                if (result && Array.isArray(result.data)) {
                    const sorted = result.data.sort((a, b) => new Date(a.date) - new Date(b.date));
                    const processed = sorted.map(d => ({
                        ...d,
                        range: [d.low, d.high]
                    }));
                    setData(processed);
                    if (processed.length > 0) {
                        setLatestPrice(processed[processed.length - 1]);
                    }
                    setLastUpdated(new Date());
                    if (onUpdate) {
                        onUpdate(processed);
                    }
                    if (onPriceUpdate && processed.length > 0) {
                        const latest = processed[processed.length - 1];
                        const open = processed[0].open;
                        onPriceUpdate(symbol, {
                            close: latest.close,
                            open: open,
                            change: latest.close - open,
                            percent: ((latest.close - open) / open) * 100
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to load live data", err);
            } finally {
                setLoading(false);
                if (!error) hasLoadedRef.current = true;
            }
        };

        fetchData();

        const now = new Date();
        const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
        timeoutId = setTimeout(() => {
            fetchData();
            intervalId = setInterval(fetchData, 60000);
        }, delay);

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, [symbol]);

    if (!symbol) return null;

    if (loading && !latestPrice) {
        return (
            <div className="live-data-card" style={{
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                minHeight: '100px',
                position: 'relative'
            }}>
                <div style={{ color: 'var(--text-muted)' }}>Loading live data for {symbol}...</div>
                {onClose && (
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={20} />
                    </button>
                )}
            </div>
        );
    }

    if (!latestPrice) return null;

    const priceChange = data.length > 1 ? latestPrice.close - data[0].open : 0;
    const priceChangePercent = data.length > 1 ? (priceChange / data[0].open) * 100 : 0;
    const isPositive = priceChange >= 0;

    return (
        <div className="live-data-card" style={{
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            transition: 'all 0.3s ease'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: isExpanded ? '1rem' : '0'
            }}>
                <div className="live-data-info">
                    <h3
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            marginBottom: '0.25rem',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            textDecorationColor: 'var(--text-muted)'
                        }}
                        onClick={() => onSelect && onSelect(symbol)}
                        title="Click to view details in main chart"
                    >
                        {symbol}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
                            ${latestPrice.close.toFixed(2)}
                        </span>
                        <span style={{
                            color: isPositive ? '#10b981' : '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            fontWeight: '600'
                        }}>
                            {isPositive ? <TrendingUp size={20} style={{ marginRight: '4px' }} /> : <TrendingDown size={20} style={{ marginRight: '4px' }} />}
                            {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title={isExpanded ? "Minimize" : "Maximize"}
                    >
                        {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            className="close-btn"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div style={{ flex: 1, minHeight: '300px', width: '100%', transition: 'all 0.3s ease' }}>
                    {data.length > 1 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--text-muted)"
                                    tick={{ fill: 'var(--text-muted)' }}
                                    tickFormatter={(str) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    minTickGap={50}
                                />
                                <YAxis
                                    domain={['dataMin', 'dataMax']}
                                    stroke="var(--text-muted)"
                                    tick={{ fill: 'var(--text-muted)' }}
                                    tickFormatter={(num) => `$${num.toFixed(2)}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                                    labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                                    formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="close"
                                    stroke={isPositive ? "#10b981" : "#ef4444"}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem'
                        }}>
                            Not enough data for chart
                        </div>
                    )}
                </div>
            )}

            {count > 0 && latestPrice && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem'
                }}>
                    <div>
                        <span style={{ color: 'var(--text-muted)' }}>Holdings:</span> <strong style={{ color: 'var(--text-color)' }}>{count}</strong>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-muted)' }}>Today's P&L:</span>
                        <strong style={{
                            marginLeft: '0.5rem',
                            color: (latestPrice.close - data[0].open) * count >= 0 ? '#10b981' : '#ef4444'
                        }}>
                            {((latestPrice.close - data[0].open) * count >= 0 ? '+' : '')}$
                            {((latestPrice.close - data[0].open) * count).toFixed(2)}
                        </strong>
                    </div>
                </div>
            )}

            <div className="live-data-meta" style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <Clock size={14} />
                    Last update: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}
                </div>
                <div>Volume: {latestPrice.volume ? latestPrice.volume.toLocaleString() : 'N/A'}</div>
            </div>
        </div >
    );
};

export default LiveStockData;
