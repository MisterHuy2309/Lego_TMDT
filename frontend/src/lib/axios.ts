import axios from 'axios';

export const api = axios.create({
  // 🟢 BASE URL BẮT BUỘC CHỨA /api/v1
  // Giúp đồng bộ hoàn toàn với các file service (cart, products, auth...) chỉ cần gọi đường dẫn ngắn gọn như '/cart', '/products'
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor tự động gắn Token vào Header Request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;