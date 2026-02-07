import api from './api';

export const gameModeService = {
    getAll: async () => {
        const response = await api.get('/gamemodes');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/gamemodes', data);
        return response.data;
    }
};
