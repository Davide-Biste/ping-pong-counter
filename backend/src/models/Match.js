import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  type: { type: String, enum: ['point', 'undo'], required: true },
  elementId: { type: String }, // User ID for points
  timestamp: { type: Date, default: Date.now },
  scoreSnapshot: {
    p1: { type: Number },
    p2: { type: Number }
  }
});

const MatchSchema = new mongoose.Schema({
  player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameMode: { type: mongoose.Schema.Types.ObjectId, ref: 'GameMode', required: true },

  status: { type: String, enum: ['in_progress', 'finished', 'abandoned'], default: 'in_progress' },

  score: {
    p1: { type: Number, default: 0 },
    p2: { type: Number, default: 0 }
  },

  events: [EventSchema], // Log of everything that happened

  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },

  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  firstServer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Match Specific Rules (snapshots from GameMode or Overrides)
  matchRules: {
    servesInDeuce: { type: Number, default: 1 },
    serveType: { type: String, enum: ['free', 'cross'], default: 'free' }
  }
});

export default mongoose.model('Match', MatchSchema);
