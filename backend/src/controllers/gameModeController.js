import GameMode from '../models/GameMode.js';

export const getGameModes = async (req, res) => {
  try {
    const modes = await GameMode.find({});
    res.json(modes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createGameMode = async (req, res) => {
  try {
    const newMode = new GameMode(req.body);
    await newMode.save();
    res.json(newMode);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
