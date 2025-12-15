from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional, Union
from datetime import datetime, date
from functools import lru_cache
import yfinance as yf
import pandas as pd
import requests
import io

app = FastAPI(
    title="Stocks API",
    description="A simple API to fetch stock data by country",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Map of country codes to their major stock indices
INDICES = {
    'US': {'symbol': '^GSPC', 'name': 'S&P 500', 'components': ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'BRK-B', 'NVDA', 'JPM', 'JNJ']},
    'JP': {'symbol': '^N225', 'name': 'Nikkei 225', 'components': ['7203.T', '8306.T', '9432.T', '9984.T', '6861.T', '6758.T', '9433.T', '8035.T', '9437.T', '7201.T']},
    'UK': {'symbol': '^FTSE', 'name': 'FTSE 100', 'components': ['HSBA.L', 'SHEL.L', 'AZN.L', 'ULVR.L', 'RIO.L', 'BP.L', 'GSK.L', 'DGE.L', 'LSEG.L', 'BATS.L']},
    'CA': {'symbol': '^GSPTSE', 'name': 'S&P/TSX', 'components': ['RY.TO', 'TD.TO', 'ENB.TO', 'SHOP.TO', 'CNR.TO', 'BMO.TO', 'BNS.TO', 'CP.TO', 'TRI.TO', 'BAM.TO']},
    'DE': {'symbol': '^GDAXI', 'name': 'DAX', 'components': ['SAP.DE', 'SIE.DE', 'ALV.DE', 'DTE.DE', 'DTG.DE', 'FRE.DE', 'MBG.DE', 'MRK.DE', 'RWE.DE', 'VOW3.DE']},
    'FR': {'symbol': '^FCHI', 'name': 'CAC 40', 'components': ['OR.PA', 'AIR.PA', 'SAN.PA', 'MC.PA', 'AI.PA', 'BNP.PA', 'CS.PA', 'DSY.PA', 'EL.PA', 'GLE.PA']},
    'HK': {'symbol': '^HSI', 'name': 'Hang Seng', 'components': ['0700.HK', '1299.HK', '0005.HK', '0941.HK', '2318.HK', '3690.HK', '1211.HK', '1810.HK', '9618.HK', '9988.HK']},
    'CN': {'symbol': '000001.SS', 'name': 'SSE Composite', 'components': ['601318.SS', '600519.SS', '601398.SS', '601288.SS', '601988.SS', '601628.SS', '600036.SS', '601166.SS', '600000.SS', '601328.SS']},
    'IN': {'symbol': '^BSESN', 'name': 'BSE SENSEX', 'components': ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'HINDUNILVR.NS', 'ITC.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS', 'LICI.NS']},
    'AU': {'symbol': '^AXJO', 'name': 'S&P/ASX 200', 'components': ['BHP.AX', 'CSL.AX', 'CBA.AX', 'NAB.AX', 'WBC.AX', 'ANZ.AX', 'WOW.AX', 'WES.AX', 'FMG.AX', 'TLS.AX']}
}

def get_country_name(country_code: str) -> str:
    """Get the full country name from country code"""
    countries = {
        'US': 'United States',
        'JP': 'Japan',
        'UK': 'United Kingdom',
        'CA': 'Canada',
        'DE': 'Germany',
        'FR': 'France',
        'HK': 'Hong Kong',
        'CN': 'China',
        'IN': 'India',
        'AU': 'Australia'
    }
    return countries.get(country_code, 'Unknown')

def get_top_stocks(country_code: str = 'US', top_n: int = 100) -> Dict:
    """
    Get top stocks from a specific country's major index
    """
    if country_code not in INDICES:
        return {
            'status': 'error',
            'message': f'Country code {country_code} not supported',
            'supported_countries': [{'code': code, 'name': info['name']} for code, info in INDICES.items()]
        }
    
    index = INDICES[country_code]
    stocks = []
    
    # Get info for each component
    for symbol in index['components'][:top_n]:
        try:
            stock = yf.Ticker(symbol)
            info = stock.info
            stocks.append({
                'symbol': symbol,
                'name': info.get('shortName', info.get('longName', 'N/A')),
                'sector': info.get('sector', 'N/A'),
                'industry': info.get('industry', 'N/A'),
                'price': info.get('currentPrice', info.get('regularMarketPrice', 'N/A')),
                'market_cap': info.get('marketCap', 'N/A'),
                'currency': info.get('currency', 'N/A')
            })
        except Exception as e:
            print(f"Error getting info for {symbol}: {str(e)}")
            continue
    
    return {
        'status': 'success',
        'country_code': country_code,
        'country_name': get_country_name(country_code),
        'index': {
            'symbol': index['symbol'],
            'name': index['name']
        },
        'count': len(stocks),
        'stocks': stocks
    }

@app.get("/")
async def root():
    return {"message": "Welcome to the Stocks API. Use /stocks?country=JP&top=5 to get started."}

@app.get("/stocks")
async def get_stocks(
    country: str = Query('US', description="Country code (e.g., US, JP, UK)"),
    top: int = Query(100, description="Number of top stocks to return", ge=1, le=100)
):
    """
    Get top stocks by country
    
    - **country**: ISO 3166-1 alpha-2 country code (e.g., US, JP, UK)
    - **top**: Number of top stocks to return (1-100)
    """
    result = get_top_stocks(country.upper(), top)
    if result.get('status') == 'error':
        raise HTTPException(status_code=400, detail=result.get('message'))
    return result


@app.get("/symbol/{symbol}")
async def get_symbol_data(
    symbol: str,
    start_date: date = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: date = Query(datetime.now().date(), description="End date in YYYY-MM-DD format"),
    interval: str = Query('1d', description="Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)")
):
    """
    Get historical stock data for a specific symbol
    
    - **symbol**: Stock symbol (e.g., AAPL, MSFT, 7203.T)
    - **start_date**: Start date for historical data (YYYY-MM-DD)
    - **end_date**: End date for historical data (YYYY-MM-DD, defaults to today)
    - **interval**: Data interval (default: 1d for daily)
    """
    try:
        # Convert dates to string in YYYY-MM-DD format
        start_str = start_date.strftime('%Y-%m-%d')
        end_str = end_date.strftime('%Y-%m-%d')
        
        # Validate interval
        valid_intervals = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo']
        if interval not in valid_intervals:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid interval. Must be one of: {', '.join(valid_intervals)}"
            )
        
        # Get historical data
        stock = yf.Ticker(symbol)
        hist = stock.history(start=start_str, end=end_str, interval=interval)
        
        if hist.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for symbol {symbol} in the specified date range"
            )
        
        # Convert the DataFrame to a list of dictionaries for JSON serialization
        data = []
        for index, row in hist.iterrows():
            data.append({
                'date': index.strftime('%Y-%m-%d %H:%M:%S'),
                'open': row['Open'],
                'high': row['High'],
                'low': row['Low'],
                'close': row['Close'],
                'volume': int(row['Volume']),
                'dividends': row.get('Dividends', 0),
                'stock_splits': row.get('Stock Splits', 0)
            })
        
        return {
            'status': 'success',
            'symbol': symbol,
            'company_name': stock.info.get('shortName', stock.info.get('longName', symbol)),
            'currency': stock.info.get('currency', 'USD'),
            'start_date': start_str,
            'end_date': end_str,
            'interval': interval,
            'data': data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error fetching data for symbol {symbol}: {str(e)}"
        )

@app.get("/symbol/{symbol}/today")
async def get_symbol_data_today(
    symbol: str,
    interval: str = Query('5m', description="Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h)")
):
    """
    Get stock data for the current trading day
    
    - **symbol**: Stock symbol (e.g., AAPL, MSFT, 7203.T)
    - **interval**: Data interval (default: 5m)
    """
    try:
        # Validate interval
        valid_intervals = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h']
        if interval not in valid_intervals:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid interval for intraday data. Must be one of: {', '.join(valid_intervals)}"
            )
        
        # Get historical data for today (1d period)
        stock = yf.Ticker(symbol)
        # period="1d" gets data for the most recent trading day
        hist = stock.history(period="1d", interval=interval)
        
        if hist.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for symbol {symbol} for today"
            )
        
        # Convert the DataFrame to a list of dictionaries for JSON serialization
        data = []
        for index, row in hist.iterrows():
            data.append({
                'date': index.strftime('%Y-%m-%d %H:%M:%S'),
                'open': row['Open'],
                'high': row['High'],
                'low': row['Low'],
                'close': row['Close'],
                'volume': int(row['Volume']),
                'dividends': row.get('Dividends', 0),
                'stock_splits': row.get('Stock Splits', 0)
            })
        
        return {
            'status': 'success',
            'symbol': symbol,
            'company_name': stock.info.get('shortName', stock.info.get('longName', symbol)),
            'currency': stock.info.get('currency', 'USD'),
            'period': '1d',
            'interval': interval,
            'data': data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error fetching data for symbol {symbol}: {str(e)}"
        )

@lru_cache(maxsize=1)
def fetch_sp500_symbols() -> List[str]:
    """Fetch S&P 500 symbols from Wikipedia"""
    try:
        url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        tables = pd.read_html(io.StringIO(response.text))
        df = tables[0]
        return df['Symbol'].tolist()
    except Exception as e:
        print(f"Error fetching S&P 500 symbols: {e}")
        return INDICES['US']['components']

@lru_cache(maxsize=1)
def fetch_tsx_symbols() -> List[str]:
    """Fetch S&P/TSX symbols from Wikipedia"""
    try:
        url = "https://en.wikipedia.org/wiki/S%26P/TSX_Composite_Index"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        tables = pd.read_html(io.StringIO(response.text))
        # The table index might vary, usually the one with "Symbol" or "Ticker"
        for table in tables:
            if 'Symbol' in table.columns:
                symbols = table['Symbol'].tolist()
                # Appending .TO for Yahoo Finance
                return [f"{s}.TO" if not str(s).endswith('.TO') else s for s in symbols]
            elif 'Ticker' in table.columns:
                 symbols = table['Ticker'].tolist()
                 return [f"{s}.TO" if not str(s).endswith('.TO') else s for s in symbols]
        return INDICES['CA']['components']
    except Exception as e:
        print(f"Error fetching TSX symbols: {e}")
        return INDICES['CA']['components']

@app.get("/symbols")
async def get_symbols(country: Optional[List[str]] = Query(None, description="Filter by country codes (e.g., US, CA)")):
    """
    Get list of supported stock symbols, optionally filtered by country.
    
    - **country**: List of country codes to filter by (e.g., US, CA)
    """
    result = []
    
    if country:
        # Filter by requested countries
        target_countries = [c.upper() for c in country]
        for code in target_countries:
            if code == 'US':
                 result.append({
                    "country": 'US',
                    "country_name": get_country_name('US'),
                    "index_name": INDICES['US']['name'],
                    "symbols": fetch_sp500_symbols()
                })
            elif code == 'CA':
                result.append({
                    "country": 'CA',
                    "country_name": get_country_name('CA'),
                    "index_name": INDICES['CA']['name'],
                    "symbols": fetch_tsx_symbols()
                })
            elif code in INDICES:
                index_info = INDICES[code]
                result.append({
                    "country": code,
                    "country_name": get_country_name(code),
                    "index_name": index_info['name'],
                    "symbols": index_info['components']
                })
    else:
        # Return all countries (default to hardcoded for speed unless specifically customized)
        for code, index_info in INDICES.items():
            symbols = index_info['components']
            if code == 'US':
                symbols = fetch_sp500_symbols()
            elif code == 'CA':
                symbols = fetch_tsx_symbols()
                
            result.append({
                "country": code,
                "country_name": get_country_name(code),
                "index_name": index_info['name'],
                "symbols": symbols
            })
            
    return {
        "status": "success",
        "count": len(result),
        "data": result
    }


@app.get("/mystocks")
async def get_my_stocks():
    """
    Get a specific list of stocks: BB.TO, PSLV.TO, TD.TO, RY.TO, GOOG, PHYS.TO, ABX.TO
    """
    # structured list with counts
    my_symbols = [
        {'symbol': 'BB.TO', 'count': 65},
        {'symbol': 'PSLV.TO', 'count': 32},
        {'symbol': 'TD.TO', 'count': 11},
        {'symbol': 'RY.TO', 'count': 7},
        {'symbol': 'GOOG', 'count': 7},
        {'symbol': 'PHYS.TO', 'count': 103},
        {'symbol': 'ABX.TO', 'count': 100}
    ]
    stocks = []
    
    for item in my_symbols:
        symbol = item['symbol']
        count = item['count']
        try:
            stock = yf.Ticker(symbol)
            info = stock.info
            price = info.get('currentPrice', info.get('regularMarketPrice', 0))
            
            value = 0
            if isinstance(price, (int, float)):
                value = price * count
                
            stocks.append({
                'symbol': symbol,
                'name': info.get('shortName', info.get('longName', 'N/A')),
                'sector': info.get('sector', 'N/A'),
                'industry': info.get('industry', 'N/A'),
                'price': price,
                'count': count,
                'value': value,
                'market_cap': info.get('marketCap', 'N/A'),
                'currency': info.get('currency', 'N/A')
            })
        except Exception as e:
            print(f"Error getting info for {symbol}: {str(e)}")
            continue
            
    return {
        'status': 'success',
        'count': len(stocks),
        'stocks': stocks
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)