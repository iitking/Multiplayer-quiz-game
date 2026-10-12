/**
 * Score calculation service adhering to README-3.md specifications
 * Base points: 1000
 * Speed bonus: Math.round(500 * (1 - timeTaken / duration))
 * Points: isCorrect ? base + speedBonus : 0
 * Multiplier: Applied if 2x Double Points power-up is active
 */
export function calculateScore({
  isCorrect,
  timeTakenMs,
  durationMs,
  multiplier = 1
}) {
  if (!isCorrect) {
    return {
      points: 0,
      base: 0,
      speedBonus: 0,
      multiplier: 1,
      isCorrect: false
    };
  }

  const base = 1000;
  // Clamp timeTaken to duration bounds
  const clampedTimeTaken = Math.max(0, Math.min(timeTakenMs, durationMs));
  const timeRatio = durationMs > 0 ? clampedTimeTaken / durationMs : 1;
  const speedBonus = Math.max(0, Math.round(500 * (1 - timeRatio)));

  const totalPoints = Math.round((base + speedBonus) * (multiplier || 1));

  return {
    points: totalPoints,
    base,
    speedBonus,
    multiplier: multiplier || 1,
    isCorrect: true
  };
}
