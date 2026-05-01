import axios from 'axios';
import { message } from 'antd';
const request = axios.create({
    baseURL: 'http://localhost:3000/api',
    timeout: 10000
});
request.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
request.interceptors.response.use((res) => res.data, (err) => {
    if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
    }
    message.error(err.response?.data?.msg || '请求失败');
    return Promise.reject(err);
});
export default request;
