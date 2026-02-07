import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  funNickname: { type: String, default: "" },
  avatar: { type: String, default: "" },
  color: { type: String, default: "blue" }, // e.g., 'blue', 'red', 'green'
  icon: { type: String, default: "user" }, // e.g., 'User', 'Smile'
  wins: { type: Number, default: 0 },
  matchesPlayed: { type: Number, default: 0 }
});

export default mongoose.model('User', UserSchema);
