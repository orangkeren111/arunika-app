// lib/ddaHelper.ts

// Configure this based on your difficulty scale (e.g., Bobot 1-5 or 1-10)
const MIN_ELO = 800;
const MAX_ELO = 2000;
const K_FACTOR = 32; // Volatility factor. Higher = faster ELO changes.

export const DDAHelper = {
  /**
   * Maps a 1-10 difficulty rating (bobot) to an ELO rating.
   */
  mapDifficultyToElo: (difficulty: number): number => {
    // Assuming difficulty is 1 to 10
    const normalized = Math.max(1, Math.min(10, difficulty));
    return MIN_ELO + ((normalized - 1) * (MAX_ELO - MIN_ELO)) / 9;
  },

  /**
   * Calculates the expected probability of a student getting a question right.
   * Returns a float between 0.0 and 1.0
   */
  calculateExpectedScore: (studentElo: number, questionElo: number): number => {
    return 1 / (1 + Math.pow(10, (questionElo - studentElo) / 400));
  },

  /**
   * Calculates the new student ELO after answering a question.
   */
  calculateNewElo: (
    currentElo: number,
    questionDifficulty: number,
    isCorrect: boolean,
  ): number => {
    const questionElo = DDAHelper.mapDifficultyToElo(questionDifficulty);
    const expectedScore = DDAHelper.calculateExpectedScore(
      currentElo,
      questionElo,
    );
    const actualScore = isCorrect ? 1 : 0;

    const newElo = currentElo + K_FACTOR * (actualScore - expectedScore);

    // Ensure ELO doesn't drop below a minimum threshold
    return Math.max(0, Math.round(newElo));
  },

  determineTargetBloomLevel: (
    questionsAnswered: number,
    criteria?: { reqC1: number; reqC2: number; reqC3: number; reqC4: number },
  ): string => {
    const c1 = criteria?.reqC1 ?? 10;
    const c2 = criteria?.reqC2 ?? 10;
    const c3 = criteria?.reqC3 ?? 10;

    if (questionsAnswered < c1) return "C1";
    if (questionsAnswered < c1 + c2) return "C2";
    if (questionsAnswered < c1 + c2 + c3) return "C3";
    return "C4";
  },
};
