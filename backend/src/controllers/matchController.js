import Match from '../models/Match.js';
import User from '../models/User.js';
import GameMode from '../models/GameMode.js';

// --- Helpers ---
const checkWinCondition = (p1Score, p2Score, rules) => {
  const { pointsToWin, isDeuceEnabled } = rules;

  // Basic Win
  if (p1Score >= pointsToWin && p1Score > p2Score + 1 && !isDeuceEnabled) return 'p1';
  if (p2Score >= pointsToWin && p2Score > p1Score + 1 && !isDeuceEnabled) return 'p2';

  // Deuce Logic (requires 2 point lead)
  if (isDeuceEnabled) {
    if (p1Score >= pointsToWin && p1Score >= p2Score + 2) return 'p1';
    if (p2Score >= pointsToWin && p2Score >= p1Score + 2) return 'p2';
  }

  // Not strictly preventing non-deuce "win by 2" if not configured,
  // but assuming standard ping pong rules often imply win by 2 if deuce enabled.
  // Standard 11 points: must win by 2.
  if (p1Score >= pointsToWin && p1Score >= p2Score + 2) return 'p1';
  if (p2Score >= pointsToWin && p2Score >= p1Score + 2) return 'p2';

  return null;
};

// --- Controllers ---

/**
 * Start a new match
 * POST /api/match/start
 * Body: { player1Id, player2Id, gameModeId, overrides? }
 */
export const startMatch = async (req, res) => {
  const { player1Id, player2Id, gameModeId, overrides } = req.body;
  try {
    const gameMode = await GameMode.findById(gameModeId);
    if(!gameMode) return res.status(404).json({error: "GameMode not found"});

    const newMatch = new Match({
      player1: player1Id,
      player2: player2Id,
      gameMode: gameModeId,
      status: 'in_progress',
      score: { p1: 0, p2: 0 },
      events: [],
      matchRules: {
          servesInDeuce: overrides?.servesInDeuce || gameMode.servesInDeuce || 1,
          serveType: overrides?.serveType || gameMode.serveType || 'free'
      }
    });

    await newMatch.save();
    // Populate to return full info
    const populatedMatch = await Match.findById(newMatch._id)
      .populate('player1')
      .populate('player2')
      .populate('gameMode');

    res.json(populatedMatch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Register a point
 * POST /api/match/:id/point
 * Body: { playerId }
 */
export const addPoint = async (req, res) => {
  const { id } = req.params;
  const { playerId } = req.body;

  try {
    const match = await Match.findById(id).populate('gameMode');
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.status !== 'in_progress') return res.status(400).json({ error: 'Match is finished' });

    let isP1 = match.player1.toString() === playerId;
    let isP2 = match.player2.toString() === playerId;

    if (!isP1 && !isP2) return res.status(400).json({ error: 'User is not in this match' });

    // Update Score
    if (isP1) match.score.p1 += 1;
    if (isP2) match.score.p2 += 1;

    // Add Event history
    match.events.push({
      type: 'point',
      elementId: playerId,
      scoreSnapshot: { p1: match.score.p1, p2: match.score.p2 }
    });

    // Check Win
    const winnerKey = checkWinCondition(match.score.p1, match.score.p2, match.gameMode);

    if (winnerKey) {
      match.status = 'finished';
      match.endTime = new Date();
      match.winner = winnerKey === 'p1' ? match.player1 : match.player2;

      // Update User Wins
      await User.findByIdAndUpdate(match.winner, { $inc: { wins: 1 } });
    }

    await match.save();

    // Return populated for frontend convenience
    const updatedMatch = await Match.findById(id)
        .populate('player1')
        .populate('player2')
        .populate('gameMode');

    res.json(updatedMatch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Undo last point
 * POST /api/match/:id/undo
 */
export const undoLastPoint = async (req, res) => {
  const { id } = req.params;

  try {
    const match = await Match.findById(id);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    // Allow undo even if finished? Yes, to correct mistakes that ended game.
    // If it was finished, we must revert status.

    if (match.events.length === 0) return res.status(400).json({ error: 'No events to undo' });

    const lastEvent = match.events.pop();

    // Only undo points for now
    if (lastEvent.type === 'point') {
      const playerId = lastEvent.elementId;
      if (match.player1.toString() === playerId) match.score.p1 = Math.max(0, match.score.p1 - 1);
      if (match.player2.toString() === playerId) match.score.p2 = Math.max(0, match.score.p2 - 1);
    }

    // Revert finish status if applicable
    if (match.status === 'finished') {
      match.status = 'in_progress';
      match.endTime = null;
      // Decrement win count for the user who WAS the winner
      if (match.winner) {
         await User.findByIdAndUpdate(match.winner, { $inc: { wins: -1 } });
         match.winner = null;
      }
    }

    await match.save();

    const updatedMatch = await Match.findById(id)
        .populate('player1')
        .populate('player2')
        .populate('gameMode');
    res.json(updatedMatch);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get Match Details
 * GET /api/match/:id
 */
export const getMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('player1')
      .populate('player2')
      .populate('gameMode');
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get Matches by User
 * GET /api/match/user/:userId
 */
export const getUserMatches = async (req, res) => {
  const { userId } = req.params;
  try {
    const matches = await Match.find({
      $or: [{ player1: userId }, { player2: userId }]
    })
    .sort({ startTime: -1 })
    .populate('player1')
    .populate('player2')
    .populate('gameMode');

    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Cancel a match
 * POST /api/match/:id/cancel
 */
export const cancelMatch = async (req, res) => {
  const { id } = req.params;
  try {
    const match = await Match.findById(id);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    if (match.status === 'in_progress') {
        match.status = 'abandoned';
        match.endTime = new Date();
        await match.save();
    }

    res.json({ message: 'Match cancelled', match });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Set the first server of a match
 * POST /api/match/:id/server
 * Body: { playerId }
 */
export const setFirstServer = async (req, res) => {
  const { id } = req.params;
  const { playerId } = req.body;

  try {
    const match = await Match.findById(id);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    if (match.events.length > 0 || (match.score.p1 > 0 || match.score.p2 > 0)) {
       // Ideally we only set this at the start, but for flexibility we might allow it if score is 0-0
       // strict: if (match.events.length > 0) ...
    }

    match.firstServer = playerId;
    await match.save();

    const updatedMatch = await Match.findById(id)
        .populate('player1')
        .populate('player2')
        .populate('gameMode');

    res.json(updatedMatch);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};
