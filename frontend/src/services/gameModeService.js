import { invoke } from '@tauri-apps/api/core';

export const gameModeService = {
    getAll: async () => {
        return await invoke('get_game_modes');
    },
    create: async (data) => {
        return await invoke('create_game_mode', { ...data });
    }
};
