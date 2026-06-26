import axios from "axios";
import API_BASE_URL from "../config/api";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});

/* ======================
   INTERCEPTORS
====================== */

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Logout only on actual 401 (invalid/expired token). Not on network error or timeout.
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* ======================
   AUTH
====================== */

export const authAPI = {
  login: (phone, password) =>
    api.post("/auth/login", { phone, password }),
  getCurrentUser: () => api.get("/users/me"),
};

/* ======================
   USERS
====================== */

export const userAPI = {
  getAll: () => api.get("/users/"),
  create: (data) => api.post("/users/", data),
};

/* ======================
   FIELDS  ✅ (RESTORED)
====================== */

export const fieldAPI = {
  getAll: () => api.get("/fields/"),
  getById: (id) => api.get(`/fields/${id}`),
  create: (data) => api.post("/fields/", data),
  update: (id, data) => api.put(`/fields/${id}`, data),
  delete: (id) => api.delete(`/fields/${id}`),
};

/* ======================
   SEASONS
====================== */

export const seasonsAPI = {
  getSummary: () => api.get("/seasons/summary"),
  getSeasonSummary: (season, crop_year) =>
    api.get(`/seasons/${season}/${crop_year}/summary`),
};

/* ======================
   CROP CYCLES (CORE)
====================== */

const _cropCycleAPI = {
  getAllCycles: (params) =>
    api.get("/crop-cycles/", { params }),

  getCycleById: (id) =>
    api.get(`/crop-cycles/${id}`),

  getCycleExpenditure: (cycleId) =>
    api.get(`/crop-cycles/${cycleId}/expenditure`),

  createCycle: (data) =>
    api.post("/crop-cycles/", data),

  getCropNames: () =>
    api.get("/crop-cycles/crop-names"),

  updateCycle: (id, data) =>
    api.put(`/crop-cycles/${id}`, data),

  deleteCycle: (id) =>
    api.delete(`/crop-cycles/${id}`),

  // Tasks
  getTasks: (cycleId) =>
    api.get(`/crop-cycles/${cycleId}/tasks`),

  createTask: (cycleId, data) =>
    api.post(`/crop-cycles/${cycleId}/tasks`, data),

  updateTask: (cycleId, taskId, data) =>
    api.put(`/crop-cycles/${cycleId}/tasks/${taskId}`, data),

  deleteTask: (cycleId, taskId) =>
    api.delete(`/crop-cycles/${cycleId}/tasks/${taskId}`),

  // Work Orders (Task-level)
  getWorkOrders: (taskId) =>
    api.get(`/tasks/${taskId}/work-orders/`),

  createWorkOrder: (taskId, data) =>
    api.post(`/tasks/${taskId}/work-orders/`, data),

  updateWorkOrder: (taskId, workOrderId, data) =>
    api.patch(`/tasks/${taskId}/work-orders/${workOrderId}`, data),

  // Work Order Resources
  getWorkOrderResources: (workOrderId) =>
    api.get(`/work-orders/${workOrderId}/resources`),

  createWorkOrderResource: (workOrderId, data) =>
    api.post(`/work-orders/${workOrderId}/resources`, data),

  updateWorkOrderResource: (workOrderId, resourceId, data) =>
    api.patch(`/work-orders/${workOrderId}/resources/${resourceId}`, data),

  deleteWorkOrderResource: (workOrderId, resourceId) =>
    api.delete(`/work-orders/${workOrderId}/resources/${resourceId}`),
};

/* ======================
   WORKERS
====================== */

export const workersAPI = {
  list: () => api.get("/workers/"),
};

/* ======================
   WORK ORDER LIFECYCLE ACTIONS
====================== */

export const woActionsAPI = {
  assign:            (woId, workerId) => api.patch(`/work-orders/${woId}/assign`, { worker_id: workerId }),
  submitCompletion:  (woId, notes)    => api.patch(`/work-orders/${woId}/submit-completion`, { notes: notes ?? null }),
  close:             (woId)           => api.patch(`/work-orders/${woId}/close`),
  reopen:            (woId)           => api.patch(`/work-orders/${woId}/reopen`),
};

/* ======================
   EXPORT ALIASES (CRITICAL)
====================== */

// ✅ New name
export const cropCycleAPI = _cropCycleAPI;

// ✅ Old name (DO NOT REMOVE)
export const cropCycleIncidentAPI = _cropCycleAPI;

export default api;
