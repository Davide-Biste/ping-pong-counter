import api from './api';

export const matchService = {
    startMatch: async (player1Id, player2Id, gameModeId, overrides = {}) => {
        const response = await api.post('/match/start', { player1Id, player2Id, gameModeId, overrides });
        return response.data;
    },
    addPoint: async (matchId, playerId) => {
        const response = await api.post(`/match/${matchId}/point`, { playerId });
        return response.data;
    },
    undoPoint: async (matchId) => {
        const response = await api.post(`/match/${matchId}/undo`, {});
        return response.data;
    },
    getMatch: async (matchId) => {
        const response = await api.get(`/match/${matchId}`);
        return response.data;
    },
    getUserMatches: async (userId) => {
        const response = await api.get(`/match/user/${userId}`);
        return response.data;
    },
    cancelMatch: async (matchId) => {
        const response = await api.post(`/match/${matchId}/cancel`);
        return response.data;
    },
    setFirstServer: async (matchId, playerId) => {
        const response = await api.post(`/match/${matchId}/server`, { playerId });
        return response.data;
    }
};
