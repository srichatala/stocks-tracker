import { useEffect, useState } from 'react';
import ControlPanel from './components/ControlPanel';
import StockChart from './components/StockChart';
import LiveStockMonitor from './components/LiveStockMonitor';
import TopStocks from './components/TopStocks';
import { fetchStockData, fetchLiveStockData, fetchMyStocks } from './services/api';
import './index.css';

function App() {
    const [stockData, setStockData] = useState([]);
    const [currentSymbol, setCurrentSymbol] = useState('');
    const [currentCurrency, setCurrentCurrency] = useState('USD');
    const [currentInterval, setCurrentInterval] = useState('1m');
    const [recentStocks, setRecentStocks] = useState([]);
    const [myStocks, setMyStocks] = useState([]);
    const [searchedStocks, setSearchedStocks] = useState([]);
    const [portfolioData, setPortfolioData] = useState({});
    const [topStocksCountry, setTopStocksCountry] = useState('US');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [view, setView] = useState('dashboard');

    const [selectedRange, setSelectedRange] = useState('1M');

    useEffect(() => {
        const loadMyStocks = async () => {
            try {
                const data = await fetchMyStocks();
                if (data && data.stocks && Array.isArray(data.stocks)) {
                    if (data.stocks.length > 0) {
                        setMyStocks(data.stocks);

                        if (!currentSymbol) {
                            handleSymbolSelect(data.stocks[0].symbol);
                        }
                    }
                }
            } catch (err) {
                console.warn("Could not load my stocks:", err);
            }
        };
        loadMyStocks();
    }, []);

    const handleSearch = async (params) => {
        setLoading(true);
        setError(null);
        setSelectedRange('1M');

        try {
            const endDate = new Date()
            endDate.setDate(endDate.getDate() + 1);
            const endStr = endDate.toISOString().split('T')[0];
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            const startStr = startDate.toISOString().split('T')[0];
            const interval = '1d';

            setCurrentInterval(interval);

            const response = await fetchStockData(params.symbol, startStr, endStr, interval);

            if (response && Array.isArray(response.data)) {
                const sortedData = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));
                setStockData(sortedData);

                const foundSymbol = response.symbol || params.symbol;
                setCurrentSymbol(foundSymbol);

                if (response.currency) {
                    setCurrentCurrency(response.currency);
                }

                if (foundSymbol) {
                    setRecentStocks(prev => {
                        const filtered = prev.filter(s => s !== foundSymbol);
                        return [foundSymbol, ...filtered];
                    });

                    if (!myStocks.some(s => (typeof s === 'string' ? s : s.symbol) === foundSymbol)) {
                        setSearchedStocks(prev => {
                            if (!prev.includes(foundSymbol)) {
                                return [foundSymbol, ...prev];
                            }
                            return prev;
                        });
                    }
                }
            } else {
                console.warn("No data found for:", params.symbol);
                setStockData([]);
                setError("No data available for this symbol.");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to fetch stock data.");
            setStockData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRangeChange = async (range) => {
        if (!currentSymbol) return;

        setSelectedRange(range);
        setLoading(true);
        setError(null);

        try {
            if (range === '1D') {
                setCurrentInterval('1m');
                const response = await fetchLiveStockData(currentSymbol, '1m');
                const sortedData = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));
                setStockData(sortedData);
            } else {
                let startDate = new Date();
                let interval = '1d';
                const endDate = new Date().toISOString().split('T')[0];

                switch (range) {
                    case '5D':
                        startDate.setDate(startDate.getDate() - 5);
                        interval = '15m';
                        break;
                    case '1M':
                        startDate.setMonth(startDate.getMonth() - 1);
                        interval = '1d';
                        break;
                    case '3M':
                        startDate.setMonth(startDate.getMonth() - 3);
                        interval = '1d';
                        break;
                    case '6M':
                        startDate.setMonth(startDate.getMonth() - 6);
                        interval = '1d';
                        break;
                    case 'YTD':
                        startDate = new Date(new Date().getFullYear(), 0, 1);
                        interval = '1d';
                        break;
                    case '1Y':
                        startDate.setFullYear(startDate.getFullYear() - 1);
                        interval = '1d';
                        break;
                    case '3Y':
                        startDate.setFullYear(startDate.getFullYear() - 3);
                        interval = '1wk';
                        break;
                    case '5Y':
                        startDate.setFullYear(startDate.getFullYear() - 5);
                        interval = '1wk';
                        break;
                    case 'Max':
                        startDate.setFullYear(startDate.getFullYear() - 20);
                        interval = '1mo';
                        break;
                    default:
                        startDate.setDate(startDate.getDate() - 1);
                }

                setCurrentInterval(interval);
                const startStr = startDate.toISOString().split('T')[0];

                const response = await fetchStockData(currentSymbol, startStr, endDate, interval);
                if (response && response.data) {
                    const sorted = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));
                    setStockData(sorted);
                } else {
                    setStockData([]);
                }
            }
        } catch (err) {
            console.error("Error fetching range data:", err);
            setError("Failed to fetch data for selected range.");
        } finally {
            setLoading(false);
        }
    };

    const handleSymbolSelect = (symbol) => {
        setView('dashboard');
        const today = new Date();
        const past = new Date();
        past.setDate(past.getDate() - 7);

        const params = {
            symbol: symbol,
            startDate: past.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0],
            interval: '1d'
        };

        setCurrentSymbol(symbol);
        handleSearch(params);
    };

    const handlePriceUpdate = (symbol, priceData) => {
        setPortfolioData(prev => ({
            ...prev,
            [symbol]: priceData
        }));
    };

    const totalDailyPnL = myStocks.reduce((acc, stock) => {
        const sym = typeof stock === 'string' ? stock : stock.symbol;
        const count = typeof stock === 'object' ? stock.count : 0;
        const data = portfolioData[sym];

        if (data && count > 0) {
            return acc + (data.change * count);
        }
        return acc;
    }, 0);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Stocks Tracker</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Real-time market analysis</p>
                </div>
                <nav className="nav-buttons">
                    <button
                        onClick={() => setView('dashboard')}
                        className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setView('top-stocks')}
                        className={`nav-btn ${view === 'top-stocks' ? 'active' : ''}`}
                    >
                        Top Stocks
                    </button>
                </nav>
            </header>

            <main>
                {view === 'dashboard' ? (
                    <>
                        {error && (
                            <div style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid var(--error-color)',
                                color: '#fca5a5',
                                padding: '1rem',
                                borderRadius: '8px',
                                marginBottom: '1.5rem'
                            }}>
                                {error}
                            </div>
                        )}

                        <ControlPanel onSearch={handleSearch} loading={loading} initialSymbol={currentSymbol} />

                        <StockChart
                            data={stockData}
                            symbol={currentSymbol}
                            interval={currentInterval}
                            currency={currentCurrency}
                            selectedRange={selectedRange}
                            onRangeChange={handleRangeChange}
                        />

                        <div style={{ marginBottom: '3rem' }}></div>

                        {myStocks.length > 0 && (
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>My Stocks</h2>
                                    <div style={{ fontSize: '1.1rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Daily P&L:</span>
                                        <strong style={{
                                            marginLeft: '0.5rem',
                                            color: totalDailyPnL >= 0 ? '#10b981' : '#ef4444'
                                        }}>
                                            {totalDailyPnL >= 0 ? '+' : ''}${totalDailyPnL.toFixed(2)}
                                        </strong>
                                    </div>
                                </div>
                                <LiveStockMonitor
                                    symbols={myStocks}
                                    onPriceUpdate={handlePriceUpdate}
                                    onRemove={(sym) => setMyStocks(prev => prev.filter(s => (typeof s === 'string' ? s : s.symbol) !== sym))}
                                    onSelect={handleSymbolSelect}
                                    onUpdate={(sym, data) => {
                                        if (sym === currentSymbol && selectedRange === '1D') {
                                            setStockData(data);
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {searchedStocks.length > 0 && (
                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Searched Stocks</h2>
                                <LiveStockMonitor
                                    symbols={searchedStocks}
                                    onRemove={(sym) => setSearchedStocks(prev => prev.filter(s => s !== sym))}
                                    onSelect={handleSymbolSelect}
                                    onUpdate={(sym, data) => {
                                        if (sym === currentSymbol && selectedRange === '1D') {
                                            setStockData(data);
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {recentStocks.length > 0 && (
                            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Recent:</span>
                                {recentStocks.map(sym => (
                                    <button
                                        key={sym}
                                        onClick={() => handleSymbolSelect(sym)}
                                        style={{
                                            background: 'var(--surface-color)',
                                            border: '1px solid var(--border-color)',
                                            color: 'var(--primary-color)',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '16px',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {sym}
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        setRecentStocks([]);
                                        setSearchedStocks([]);
                                        setCurrentSymbol('');
                                        setStockData([]);
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        marginLeft: '0.5rem',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                        )}


                    </>
                ) : (
                    <TopStocks
                        onSelectSymbol={handleSymbolSelect}
                        selectedSymbol={currentSymbol}
                        country={topStocksCountry}
                        setCountry={setTopStocksCountry}
                    />
                )}
            </main>
        </div>
    );
}

export default App;
