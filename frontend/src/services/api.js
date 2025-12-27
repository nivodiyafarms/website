import axios from 'axios';
import {
  transformCropCycleRequest,
  transformTaskRequest,
  transformWorkOrderRequest,
  transformCropCycleResponse,
  transformTaskResponse,
  transformWorkOrderResponse,
  transformResponseArray,
  isCropCycleIncidentUrl,
  isTaskUrl,
  isWorkOrderUrl,
  isCreateOrUpdate,
} from '../utils/apiTransformers';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token and transform requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Transform request data for crop-cycle-incidents endpoints
    if (config.data && isCropCycleIncidentUrl(config.url)) {
      // Skip transformation for FormData (voice upload)
      if (config.data instanceof FormData) {
        return config;
      }

      const method = config.method?.toLowerCase();
      if (isCreateOrUpdate(method)) {
        try {
          if (isTaskUrl(config.url)) {
            // Transform task request
            config.data = transformTaskRequest(config.data);
          } else if (isWorkOrderUrl(config.url)) {
            // Transform work order request
            config.data = transformWorkOrderRequest(config.data);
          } else {
            // Transform crop cycle request
            config.data = transformCropCycleRequest(config.data);
          }
        } catch (error) {
          console.error('Error transforming request data:', error);
          // Continue with original data if transformation fails
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and transform responses
api.interceptors.response.use(
  (response) => {
    // Transform response data for crop-cycle-incidents endpoints
    if (response.data && isCropCycleIncidentUrl(response.config.url)) {
      try {
        if (isTaskUrl(response.config.url)) {
          // Transform task response
          if (Array.isArray(response.data)) {
            response.data = response.data.map(transformTaskResponse);
          } else {
            response.data = transformTaskResponse(response.data);
          }
        } else if (isWorkOrderUrl(response.config.url)) {
          // Transform work order response
          if (Array.isArray(response.data)) {
            response.data = response.data.map(transformWorkOrderResponse);
          } else {
            response.data = transformWorkOrderResponse(response.data);
          }
        } else {
          // Transform crop cycle response
          if (Array.isArray(response.data)) {
            response.data = response.data.map(transformCropCycleResponse);
          } else {
            response.data = transformCropCycleResponse(response.data);
          }
        }
      } catch (error) {
        console.error('Error transforming response data:', error);
        // Continue with original data if transformation fails
      }
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (phone, password) => api.post('/api/auth/login', { phone, password }),
  getCurrentUser: () => api.get('/api/users/me'),
};

// User APIs
export const userAPI = {
  getAll: () => api.get('/api/users/'),
  create: (userData) => api.post('/api/users/', userData),
};

// Field APIs
export const fieldAPI = {
  getAll: () => api.get('/api/fields/'),
  getById: (id) => api.get(`/api/fields/${id}`),
  create: (fieldData) => api.post('/api/fields/', fieldData),
  update: (id, fieldData) => api.put(`/api/fields/${id}`, fieldData),
  delete: (id) => api.delete(`/api/fields/${id}`),
};

// Crop Cycle APIs
export const cropCycleAPI = {
  getAll: () => api.get('/api/crop-cycles/'),
  getById: (id) => api.get(`/api/crop-cycles/${id}`),
  create: (cropCycleData) => api.post('/api/crop-cycles/', cropCycleData),
  update: (id, cropCycleData) => api.put(`/api/crop-cycles/${id}`, cropCycleData),
  delete: (id) => api.delete(`/api/crop-cycles/${id}`),
};

// Crop APIs
export const cropAPI = {
  getAll: () => api.get('/api/crops/'),
};

// Material APIs
export const materialAPI = {
  getAll: () => api.get('/api/materials/'),
  create: (materialData) => api.post('/api/materials/', materialData),
};

// Equipment APIs
export const equipmentAPI = {
  getAll: () => api.get('/api/equipment/'),
  create: (equipmentData) => api.post('/api/equipment/', equipmentData),
};

// Crop Cycle Incident APIs
export const cropCycleIncidentAPI = {
  // Crop Cycles (Parent)
  getAllCycles: (params) => api.get('/crop-cycle-incidents/', { params }),
  getCycleById: (id) => api.get(`/crop-cycle-incidents/${id}`),
  createCycle: (data) => api.post('/crop-cycle-incidents/', data),
  updateCycle: (id, data) => api.put(`/crop-cycle-incidents/${id}`, data),
  deleteCycle: (id) => api.delete(`/crop-cycle-incidents/${id}`),
  
  // Tasks (Children)
  getTasks: (cycleId, params) => api.get(`/crop-cycle-incidents/${cycleId}/tasks`, { params }),
  getTaskById: (cycleId, taskId) => api.get(`/crop-cycle-incidents/${cycleId}/tasks/${taskId}`),
  createTask: (cycleId, data) => api.post(`/crop-cycle-incidents/${cycleId}/tasks`, data),
  updateTask: (cycleId, taskId, data) => api.put(`/crop-cycle-incidents/${cycleId}/tasks/${taskId}`, data),
  deleteTask: (cycleId, taskId) => api.delete(`/crop-cycle-incidents/${cycleId}/tasks/${taskId}`),
  uploadVoiceTask: (cycleId, formData) => {
    return api.post(`/crop-cycle-incidents/${cycleId}/tasks/voice/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Work Orders
  getWorkOrders: (cycleId) => api.get(`/crop-cycle-incidents/${cycleId}/work-orders`),
  getWorkOrderById: (cycleId, orderId) => api.get(`/crop-cycle-incidents/${cycleId}/work-orders/${orderId}`),
  createWorkOrder: (cycleId, data) => api.post(`/crop-cycle-incidents/${cycleId}/work-orders`, data),
  updateWorkOrder: (cycleId, orderId, data) => api.put(`/crop-cycle-incidents/${cycleId}/work-orders/${orderId}`, data),
  deleteWorkOrder: (cycleId, orderId) => api.delete(`/crop-cycle-incidents/${cycleId}/work-orders/${orderId}`),
};

export default api;

