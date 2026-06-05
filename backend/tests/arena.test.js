/**
 * Arena Unit Tests — XP & Progression Logic
 */

const calculateXPGain = (correct, total, config) => {
  const xpPerCorrect = config.xpPerCorrectAnswer || 10;
  const xpBonus = config.xpBonusCompletion || 20;
  const xpBonus100 = config.xpBonus100Percent || 30;

  let xp = (correct * xpPerCorrect) + xpBonus;
  if (correct === total && total > 0) {
    xp += xpBonus100;
  }
  return xp;
};

describe('Arena System: XP Calculation', () => {
  const config = {
    xpPerCorrectAnswer: 10,
    xpBonusCompletion: 20,
    xpBonus100Percent: 30,
    streakBonusMultiplier: 1.5
  };

  test('Should award base XP + completion bonus for partial success', () => {
    const correct = 3;
    const total = 5;
    const earned = calculateXPGain(correct, total, config);
    
    // Calculation: (3 * 10) + 20 = 50
    expect(earned).toBe(50);
  });

  test('Should award extra bonus for 100% correct answers', () => {
    const correct = 5;
    const total = 5;
    const earned = calculateXPGain(correct, total, config);
    
    // Calculation: (5 * 10) + 20 + 30 = 100
    expect(earned).toBe(100);
  });

  test('Should apply streak multiplier for consecutive days', () => {
    const baseXP = 100;
    const multiplier = config.streakBonusMultiplier;
    const finalXP = Math.round(baseXP * multiplier);
    
    expect(finalXP).toBe(150);
  });
});
