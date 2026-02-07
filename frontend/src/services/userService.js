import { invoke } from '@tauri-apps/api/core';

export const userService = {
    getAll: async () => {
        return await invoke('get_users');
    },
    createQuick: async (name, color, icon, nickname = "") => {
        return await invoke('create_user', { name, color, icon, nickname });
    },
    update: async (id, name, color, icon) => {
        // Rust expects integer ID, ensure it is converted if it's a string
        return await invoke('update_user', { id: Number(id), name, color, icon });
    },
    checkHealth: async () => {
        // Since it's local, we assume it's healthy if we can call invoke.
        // We could call a ping command, but getAll users is lightweight enough for now.
        try {
            await invoke('get_users');
            return true;
        } catch {
            return false;
        }
    },
    getUserStatistics: async (userId) => {
        return await invoke('get_user_statistics', { userId: Number(userId) });
    }
};
