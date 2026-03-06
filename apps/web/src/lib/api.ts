import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = Cookies.get('refreshToken');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        Cookies.set('accessToken', data.accessToken, { expires: 1 / 96 }); // 15 min
        Cookies.set('refreshToken', data.refreshToken, { expires: 7 });
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        Cookies.remove('userRole');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
