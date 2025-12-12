import React from 'react';
import LiveStockData from './LiveStockData';

const LiveStockMonitor = ({ symbols, onRemove, onUpdate, onSelect, onPriceUpdate }) => {
    if (!symbols || symbols.length === 0) return null;

    return (
        <div className="live-monitor-grid" style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            marginBottom: '1.5rem'
        }}>
            {symbols.map(item => {
                const isObject = typeof item === 'object' && item !== null;
                const sym = isObject ? item.symbol : item;
                const count = isObject ? item.count : 0;

                return (
                    <LiveStockData
                        key={sym}
                        symbol={sym}
                        count={count}
                        onClose={() => onRemove(sym)}
                        onUpdate={(data) => onUpdate && onUpdate(sym, data)}
                        onSelect={onSelect}
                        onPriceUpdate={onPriceUpdate}
                    />
                );
            })}
        </div>
    );
};

export default LiveStockMonitor;
