import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
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
    if (error.response?.status === 401) {
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
   CROPS
====================== */

export const cropAPI = {
  getAll: () => api.get("/crops/"),
};

/* ======================
   MATERIALS
====================== */

export const materialAPI = {
  getAll: () => api.get("/materials/"),
  create: (data) => api.post("/materials/", data),
};

/* ======================
   EQUIPMENT
====================== */

export const equipmentAPI = {
  getAll: () => api.get("/equipment/"),
  create: (data) => api.post("/equipment/", data),
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
   EXPORT ALIASES (CRITICAL)
====================== */

// ✅ New name
export const cropCycleAPI = _cropCycleAPI;

// ✅ Old name (DO NOT REMOVE)
export const cropCycleIncidentAPI = _cropCycleAPI;

export default api;
