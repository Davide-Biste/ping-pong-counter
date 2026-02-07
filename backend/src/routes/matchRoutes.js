import express from 'express';
import { startMatch, addPoint, undoLastPoint, getMatch, getUserMatches, cancelMatch, setFirstServer } from '../controllers/matchController.js';

const router = express.Router();

router.post('/start', startMatch);
router.post('/:id/point', addPoint);
router.post('/:id/undo', undoLastPoint);
router.post('/:id/cancel', cancelMatch);
router.post('/:id/server', setFirstServer);
router.get('/:id', getMatch);
router.get('/user/:userId', getUserMatches);

export default router;
