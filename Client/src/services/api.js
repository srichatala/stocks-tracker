import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

/**
 * Fetches stock data for a given symbol and parameters.
 * @param {string} symbol - Stock symbol (e.g., RY.TO)
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} interval - Data interval (e.g., 1m, 1d)
 * @returns {Promise<Object>} - The API response data
 */
export const fetchStockData = async (symbol, startDate, endDate, interval) => {
    try {
        const response = await axios.get(`${BASE_URL}/symbol/${symbol}`, {
            params: {
                start_date: startDate,
                end_date: endDate,
                interval: interval
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching stock data:", error);
        throw error;
    }
};

/**
 * Fetches top stocks for a given country.
 * @param {string} country - Country code (e.g., US, CA)
 * @param {number} top - Number of stocks to fetch
 * @returns {Promise<Object>} - The API response
 */
export const fetchTopStocks = async (country, top = 10) => {
    try {
        const response = await axios.get(`${BASE_URL}/stocks`, {
            params: {
                country: country,
                top: top
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching top stocks:", error);
        throw error;
    }
};
/**
 * Fetches available stock symbols.
 * @param {string[]} countries - List of country codes (e.g. ['US', 'CA'])
 * @returns {Promise<Object>} - The API response containing symbol lists
 */
export const fetchSymbols = async (countries = ['US', 'CA']) => {
    try {
        // Construct query params: ?country=US&country=CA
        const params = new URLSearchParams();
        countries.forEach(c => params.append('country', c));

        const response = await axios.get(`${BASE_URL}/symbols`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching symbols:", error);
        return { data: [] }; // Return empty structure on fail
    }
};
/**
 * Fetches intraday 'live' stock data for a given symbol.
 * @param {string} symbol - Stock symbol
 * @param {string} interval - Interval (e.g. '1m')
 * @returns {Promise<Object>} - The API response
 */
export const fetchLiveStockData = async (symbol, interval = '1m') => {
    try {
        const response = await axios.get(`${BASE_URL}/symbol/${symbol}/today`, {
            params: {
                interval,
                _t: Date.now() // Cache buster
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching live stock data:", error);
        throw error;
    }
};

/**
 * Fetches user's saved/watched stocks.
 * @returns {Promise<Object>} - The API response
 */
export const fetchMyStocks = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/mystocks`);
        return response.data;
    } catch (error) {
        console.error("Error fetching my stocks:", error);
        throw error;
    }
};
