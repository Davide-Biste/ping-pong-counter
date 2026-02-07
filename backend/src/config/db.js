import mongoose from 'mongoose';
import { seedGameModes } from '../utils/seed.js';

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/pingpong';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected');
    await seedGameModes();
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

export default connectDB;
