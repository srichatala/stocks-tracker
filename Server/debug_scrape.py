
import pandas as pd
import requests
import io

try:
    url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    response = requests.get(url, headers=headers)
    print(f"S&P Status: {response.status_code}")
    tables = pd.read_html(io.StringIO(response.text))
    df = tables[0]
    print(f"S&P 500 count: {len(df)}")
    print(df['Symbol'].head().tolist())
except Exception as e:
    print(f"Error S&P: {e}")


try:
    url = "https://en.wikipedia.org/wiki/S%26P/TSX_Composite_Index"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    response = requests.get(url, headers=headers)
    print(f"TSX Status: {response.status_code}")
    tables = pd.read_html(io.StringIO(response.text))
    found = False
    for table in tables:
        if 'Symbol' in table.columns:
            print(f"TSX count (Symbol): {len(table)}")
            print(table['Symbol'].head().tolist())
            found = True
            break
        elif 'Ticker' in table.columns:
            print(f"TSX count (Ticker): {len(table)}")
            print(table['Ticker'].head().tolist())
            found = True
            break
    if not found:
        print("TSX table not found")
except Exception as e:
    print(f"Error TSX: {e}")
