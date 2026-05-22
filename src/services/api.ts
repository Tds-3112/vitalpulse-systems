import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ========================
// Axios Instance
// ========================
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ========================
// Request Interceptor — attach JWT
// ========================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('vp_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ========================
// Response Interceptor — handle 401 + refresh
// ========================
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/v1/auth/refresh-token', {}, {
          withCredentials: true,
        });
        const newToken = data.data?.accessToken;
        if (newToken) {
          localStorage.setItem('vp_access_token', newToken);
          processQueue(null, newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('vp_access_token');
        localStorage.removeItem('vp_user');
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ========================
// API Methods
// ========================
export const authAPI = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    bloodGroup?: string;
    phone?: string;
    organizationName?: string;
  }) => api.post('/auth/register', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get('/auth/me'),

  refreshToken: () => api.post('/auth/refresh-token'),
};

export const inventoryAPI = {
  getAll: (params?: { bloodGroup?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/inventory', { params }),

  getById: (id: string) => api.get(`/inventory/${id}`),

  add: (data: { bloodGroup: string; units: number; capacity?: number; source?: string }) =>
    api.post('/inventory', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/inventory/${id}`, data),

  checkAvailability: (bloodGroup: string) =>
    api.get(`/inventory/availability/${encodeURIComponent(bloodGroup)}`),
};

export const donationAPI = {
  getAll: (params?: { bloodGroup?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/donations', { params }),

  getMyDonations: (params?: { page?: number; limit?: number }) =>
    api.get('/donations/my', { params }),

  create: (data: {
    bloodGroup: string;
    units?: number;
    volume?: number;
    donationType?: string;
    notes?: string;
    donor?: string;
  }) => api.post('/donations', data),

  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    api.patch(`/donations/${id}/status`, data),
};

export const requestAPI = {
  getAll: (params?: {
    bloodGroup?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) => api.get('/requests', { params }),

  getMyRequests: (params?: { page?: number; limit?: number }) =>
    api.get('/requests/my', { params }),

  create: (data: {
    bloodGroup: string;
    units: number;
    priority?: string;
    reason?: string;
    patientName?: string;
  }) => api.post('/requests', data),

  updateStatus: (id: string, data: { status: string; notes?: string; eta?: string; rejectionReason?: string }) =>
    api.patch(`/requests/${id}/status`, data),
};

export const userAPI = {
  getAll: (params?: {
    role?: string;
    bloodGroup?: string;
    search?: string;
    isActive?: string;
    page?: number;
    limit?: number;
  }) => api.get('/users', { params }),

  getById: (id: string) => api.get(`/users/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/users/${id}`, data),

  remove: (id: string) => api.delete(`/users/${id}`),
};

export default api;
