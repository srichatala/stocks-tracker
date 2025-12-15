# Stocks API

A simple FastAPI-based API to fetch stock data by country.

## Features

- Get top stocks by country
- Support for multiple countries (US, JP, UK, CA, DE, FR, HK, CN, IN, AU)
- Detailed stock information including price, market cap, and sector
- CORS enabled for frontend integration

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stocks-api
   ```

2. **Create and activate a virtual environment** (recommended)
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

## Running the API

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Get Top Stocks

```
GET /stocks?country={country_code}&top={number}
```

**Parameters:**
- `country`: ISO 3166-1 alpha-2 country code (e.g., US, JP, UK)
- `top`: Number of top stocks to return (1-20, default: 10)

**Example:**
```
GET /stocks?country=JP&top=5
```

**Response:**
```json
{
  "status": "success",
  "country_code": "JP",
  "country_name": "Japan",
  "index": {
    "symbol": "^N225",
    "name": "Nikkei 225"
  },
  "count": 5,
  "stocks": [
    {
      "symbol": "7203.T",
      "name": "TOYOTA MOTOR CORP",
      "sector": "Consumer Cyclical",
      "industry": "Auto Manufacturers",
      "price": 3127.0,
      "market_cap": "40757.12B",
      "currency": "JPY"
    },
    ...
  ]
}
```

## Available Countries

| Code | Country        | Index          |
|------|----------------|----------------|
| US   | United States  | S&P 500        |
| JP   | Japan          | Nikkei 225     |
| UK   | United Kingdom | FTSE 100       |
| CA   | Canada         | S&P/TSX        |
| DE   | Germany        | DAX            |
| FR   | France         | CAC 40         |
| HK   | Hong Kong      | Hang Seng      |
| CN   | China          | SSE Composite  |
| IN   | India          | BSE SENSEX     |
| AU   | Australia      | S&P/ASX 200    |

## Development

- **Auto-reload**: The API supports auto-reload during development when using `uvicorn` with the `--reload` flag.
- **API Documentation**: Visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI).

## License

MIT
