import express from 'express';
import { getGameModes, createGameMode } from '../controllers/gameModeController.js';

const router = express.Router();

router.get('/', getGameModes);
router.post('/', createGameMode);

export default router;
