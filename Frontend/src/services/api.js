import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Adjust if backend port changes
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the token and log data
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Debugging: Log all outgoing requests
        console.log(`🚀 [API Request] ${config.method.toUpperCase()} ${config.url}`, config.data || 'No data');

        return config;
    },
    (error) => {
        console.error('❌ [API Request Error]', error);
        return Promise.reject(error);
    }
);

export default api;
