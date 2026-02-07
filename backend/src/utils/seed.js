import GameMode from '../models/GameMode.js';

export const seedGameModes = async () => {
  try {
    const count = await GameMode.countDocuments();
    if (count === 0) {
      console.log("Seeding Game Modes...");
      await GameMode.create([
        {
          name: "Standard 11",
          pointsToWin: 11,
          servesBeforeChange: 2,
          rulesDescription: "Classic rules. Win at 11.",
          isDeuceEnabled: true
        },
        {
          name: "Old School 21",
          pointsToWin: 21,
          servesBeforeChange: 5,
          rulesDescription: "Classic rules. Win at 21.",
          isDeuceEnabled: true
        },
        {
          name: "Turbo 7",
          pointsToWin: 7,
          servesBeforeChange: 1,
          rulesDescription: "Fast game. Win at 7. Switch serve every point.",
          isDeuceEnabled: false
        }
      ]);
      console.log("Game Modes Seeded.");
    }
  } catch (error) {
    console.error("Seeding Error:", error);
  }
};
