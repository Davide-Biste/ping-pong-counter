import { invoke } from '@tauri-apps/api/core';

export const matchService = {
    startMatch: async (player1Id, player2Id, gameModeId, overrides = {}) => {
        // Note: overrides are currently ignored by the Rust backend in this simple port
        return await invoke('start_match', { 
            player1Id: Number(player1Id), 
            player2Id: Number(player2Id), 
            gameModeId: Number(gameModeId),
            servesInDeuce: overrides.servesInDeuce ? Number(overrides.servesInDeuce) : null,
            serveType: overrides.serveType || null
        });
    },
    addPoint: async (matchId, playerId) => {
        return await invoke('add_point', { matchId: Number(matchId), playerId: Number(playerId) });
    },
    undoPoint: async (matchId) => {
        return await invoke('undo_last_point', { matchId: Number(matchId) });
    },
    getMatch: async (matchId) => {
        return await invoke('get_match', { id: Number(matchId) });
    },
    getUserMatches: async (userId) => {
        return await invoke('get_user_matches', { userId: Number(userId) });
    },
    cancelMatch: async (matchId) => {
        return await invoke('cancel_match', { id: Number(matchId) });
    },
    setFirstServer: async (matchId, playerId) => {
        // Rust expects first_server_id as firstServerId (camelCase)
        return await invoke('set_first_server', { id: Number(matchId), firstServerId: Number(playerId) });
    }
};
