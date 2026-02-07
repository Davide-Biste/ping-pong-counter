import express from 'express';
import { getUsers, createQuickUser, updateUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/', getUsers);
router.post('/quick', createQuickUser);
router.put('/:id', updateUser);

export default router;
