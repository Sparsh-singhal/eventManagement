import axios from 'axios';

const api = axios.create({
    baseURL: 'https://eventmanagement-0tom.onrender.com/eventRoute',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
