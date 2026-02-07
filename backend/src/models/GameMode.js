import mongoose from 'mongoose';

const GameModeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pointsToWin: { type: Number, required: true, default: 11 },
  servesBeforeChange: { type: Number, required: true, default: 2 },
  rulesDescription: { type: String, default: "" },
  isDeuceEnabled: { type: Boolean, default: true },

  // New Stats Fields
  servesInDeuce: { type: Number, default: 1 },
  serveType: { type: String, enum: ['free', 'cross'], default: 'free' } // 'free' or 'cross'
});

export default mongoose.model('GameMode', GameModeSchema);
