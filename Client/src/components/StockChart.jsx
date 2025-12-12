import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, BarChart2 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label, interval, currency }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const isMinuteInterval = /^\d+m$/.test(interval);

        const dateStr = isMinuteInterval
            ? new Date(label).toLocaleTimeString()
            : new Date(label).toLocaleString();

        return (
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '12px', borderRadius: '8px', color: '#f8fafc' }}>
                <p style={{ color: '#10b981', marginBottom: '8px', fontSize: '1.2rem' }}>${data.close.toFixed(2)} {currency}</p>
                <p style={{ color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>{dateStr}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                    <div style={{ color: '#3b82f6' }}>Open: <span style={{ color: '#fff' }}>${data.open.toFixed(2)}</span></div>
                    <div style={{ color: '#f59e0b' }}>High: <span style={{ color: '#fff' }}>${data.high.toFixed(2)}</span></div>
                    <div style={{ color: '#ef4444' }}>Low: <span style={{ color: '#fff' }}>${data.low.toFixed(2)}</span></div>
                    <div style={{ color: '#10b981' }}>Close: <span style={{ color: '#fff' }}>${data.close.toFixed(2)}</span></div>
                </div>
            </div>
        );
    }
    return null;
};

const CandleStickShape = (props) => {
    const { x, y, width, height, payload } = props;
    const { open, close, high, low } = payload;
    const isGrowing = close > open;
    const color = isGrowing ? '#10b981' : '#ef4444';

    const range = high - low;
    const ratio = range > 0 ? height / range : 0;

    const openY = y + (high - open) * ratio;
    const closeY = y + (high - close) * ratio;

    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(Math.abs(openY - closeY), 1);

    return (
        <g stroke={color} fill={color} strokeWidth="2">
            <path d={`M${x + width / 2},${y} L${x + width / 2},${y + height}`} />
            <rect x={x} y={bodyTop} width={width} height={bodyHeight} stroke="none" />
        </g>
    );
};

const StockChart = ({ data, symbol, interval, currency = 'USD', onRangeChange, selectedRange = '1D' }) => {
    const [chartType, setChartType] = useState('line');

    if (!data || data.length === 0) {
        return (
            <div className="chart-placeholder">
                <p>No data to display. Enter a symbol in the search box.</p>
            </div>
        );
    }


    const chartData = data.map(d => ({
        ...d,
        range: [d.low, d.high]
    }));

    const ranges = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', 'Max'];

    return (
        <div className="chart-container">
            <div className="chart-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h2>{symbol} Price</h2>

                    <div style={{
                        display: 'flex',
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '2px'
                    }}>
                        <button
                            onClick={() => setChartType('line')}
                            style={{
                                background: chartType === 'line' ? 'var(--primary-color)' : 'transparent',
                                color: chartType === 'line' ? '#fff' : 'var(--text-muted)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px',
                                cursor: 'pointer',
                            }}
                            title="Line Chart"
                        >
                            <Activity size={18} />
                        </button>
                        <button
                            onClick={() => setChartType('candle')}
                            style={{
                                background: chartType === 'candle' ? 'var(--primary-color)' : 'transparent',
                                color: chartType === 'candle' ? '#fff' : 'var(--text-muted)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px',
                                cursor: 'pointer',
                            }}
                            title="Candle Chart"
                        >
                            <BarChart2 size={18} />
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {ranges.map(range => (
                        <button
                            key={range}
                            onClick={() => onRangeChange && onRangeChange(range)}
                            style={{
                                background: selectedRange === range ? 'var(--primary-color)' : 'transparent',
                                color: selectedRange === range ? '#fff' : 'var(--text-muted)',
                                border: '1px solid ' + (selectedRange === range ? 'var(--primary-color)' : 'var(--border-color)'),
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ width: '100%', height: 500 }}>
                <ResponsiveContainer>
                    {chartType === 'line' ? (
                        <LineChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                tick={{ fill: '#94a3b8' }}
                                tickFormatter={(str) => {
                                    if (!str) return '';
                                    const date = new Date(str);
                                    if (/^\d+m$/.test(interval)) {
                                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    }
                                    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                }}
                                minTickGap={50}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                tick={{ fill: '#94a3b8' }}
                                domain={['auto', 'auto']}
                                tickFormatter={(num) => `$${num.toFixed(2)}`}
                            />
                            <Tooltip content={<CustomTooltip interval={interval} currency={currency} />} />
                            <Line
                                type="monotone"
                                dataKey="close"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    ) : (
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                tick={{ fill: '#94a3b8' }}
                                tickFormatter={(str) => {
                                    if (!str) return '';
                                    const date = new Date(str);
                                    if (/^\d+m$/.test(interval)) {
                                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    }
                                    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                }}
                                minTickGap={50}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                tick={{ fill: '#94a3b8' }}
                                domain={['auto', 'auto']}
                                tickFormatter={(num) => `$${num.toFixed(2)}`}
                            />
                            <Tooltip content={<CustomTooltip interval={interval} currency={currency} />} />
                            <Bar
                                dataKey="range"
                                shape={<CandleStickShape />}
                                isAnimationActive={false}
                            />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default StockChart;
