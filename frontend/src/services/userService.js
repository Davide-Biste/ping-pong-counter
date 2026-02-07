import api from './api';

export const userService = {
    getAll: async () => {
        const response = await api.get('/users');
        return response.data;
    },
    createQuick: async (name, color, icon) => {
        const response = await api.post('/users/quick', { name, color, icon });
        return response.data;
    },
    update: async (id, name, color, icon) => {
        const response = await api.put(`/users/${id}`, { name, color, icon });
        return response.data;
    },
    checkHealth: async () => {
        try {
            await api.get('/users'); // Simple check
            return true;
        } catch {
            return false;
        }
    }
};
