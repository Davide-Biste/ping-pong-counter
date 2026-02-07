import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

import userRoutes from './routes/userRoutes.js';
import gameModeRoutes from './routes/gameModeRoutes.js';
import matchRoutes from './routes/matchRoutes.js';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/gamemodes', gameModeRoutes);
app.use('/api/match', matchRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
