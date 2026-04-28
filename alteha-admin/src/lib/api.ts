import axios from 'axios';

// Base API instance configured for Alteha Backend
export const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to inject the standard JHipster Bearer token from local storage
api.interceptors.request.use(
    (config) => {
        // Retrieve token from frontend storage (set during login)
        const token = typeof window !== 'undefined' ? localStorage.getItem('alteha_admin_token') : null;
        
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Generic CRUD methods to interface directly with the backend entities
export const API = {
    // Read list of entities
    findMany: async (entityName: string, params?: Record<string, any>) => {
        const response = await api.get(`/${entityName}`, { params });
        // JHipster pagination adds 'x-total-count' header
        return {
            data: response.data,
            totalCount: parseInt(response.headers['x-total-count'] || '0', 10),
        };
    },

    // Read single entity
    findOne: async (entityName: string, id: string | number) => {
        const response = await api.get(`/${entityName}/${id}`);
        return response.data;
    },

    // Create entity
    create: async (entityName: string, data: any) => {
        // Ensure no ID is sent for creation
        const { id, ...payload } = data;
        const response = await api.post(`/${entityName}`, payload);
        return response.data;
    },

    // Update entity
    update: async (entityName: string, id: string | number, data: any) => {
        // JHipster standard is PUT /api/entities with the ID in the body
        const payload = { ...data, id };
        const response = await api.put(`/${entityName}`, payload);
        return response.data;
    },

    // Delete entity
    remove: async (entityName: string, id: string | number) => {
        await api.delete(`/${entityName}/${id}`);
        return true;
    }
};
