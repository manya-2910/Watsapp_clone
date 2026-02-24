import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authApi = {
    register: (data: { phone: string; name: string }) => api.post('/auth/register', data),
    login: (data: { phone: string }) => api.post('/auth/login', data),
    refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

export const userApi = {
    getProfile: () => api.get('/users/profile'),
};

export default api;
