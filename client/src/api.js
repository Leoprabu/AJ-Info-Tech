import axios from 'axios';
const api = axios.create({ 'https://aj-info-tech.onrender.com': '/api' });
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('aj_token');
  if (t) cfg.headers.Authorization = 'Bearer ' + t;
  return cfg;
});
api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('aj_token');
    if (!location.pathname.includes('/login')) location.href = '/login';
  }
  return Promise.reject(err);
});
export default api;
