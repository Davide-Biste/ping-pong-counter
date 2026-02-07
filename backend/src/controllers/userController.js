import User from '../models/User.js';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createQuickUser = async (req, res) => {
  const { name, color, icon } = req.body;

  const shortName = name || 'Player';
  const funNickname = uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: ' ',
    length: 2,
    style: 'capital'
  });

  try {
    const newUser = new User({
      name: shortName,
      funNickname: funNickname,
      color: color || 'blue',
      icon: icon || 'User'
    });
    await newUser.save();
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, color, icon } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, color, icon },
      { new: true }
    );
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
