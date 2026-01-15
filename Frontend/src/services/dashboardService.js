import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getDashboardStats = async () => {
    try {
        const response = await axios.get(`${API_URL}/dashboard/stats`);
        return response.data;
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
    }
};
