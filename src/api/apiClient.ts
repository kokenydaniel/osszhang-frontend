import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useNotificationStore } from '@/stores/useNotificationStore';

/**
 * PénzPilot Central API Client (Axios Instance)
 * Unified endpoint routing with token injects and standard response interceptors.
 */
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Token Management
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const { addNotification } = useNotificationStore.getState();
    
    if (!error.response) {
      addNotification('Hálózati hiba! Ellenőrizd az internetkapcsolatot.', 'error');
      return Promise.reject(error);
    }

    const status = error.response.status;
    const data = error.response.data as any;

    switch (status) {
      case 401:
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          addNotification('A munkamenet lejárt. Kérjük, jelentkezz be újra.', 'error');
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
            window.location.href = '/login';
          }
        }
        break;
      
      case 403:
        addNotification('Nincs jogosultságod a művelethez!', 'error');
        break;

      case 422:
        const errors = data.errors ? Object.values(data.errors).flat().join(' ') : 'Érvénytelen adatok.';
        addNotification(errors, 'error');
        break;

      case 429:
        addNotification('Túl sok kérés! Próbáld újra később.', 'info');
        break;

      case 500:
        addNotification('Szerver hiba történt. Dolgozunk a javításon!', 'error');
        break;

      default:
        addNotification(data.message || 'Váratlan hiba történt.', 'error');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
