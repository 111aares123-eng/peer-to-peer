const { RANKING_WEIGHTS } = require('../config');

/**
 * Calculates algorithmic tutor ranking score:
 * Score = (R * W1) + (log10(S + 1) * W2)
 * 
 * @param {number} R - Average student rating (1.0 to 5.0)
 * @param {number} S - Completed session volume
 * @param {object} weights - Optional custom weights { W1, W2 }
 * @returns {number} Score rounded to 2 decimal places
 */
function calculateRankingScore(R, S, weights = RANKING_WEIGHTS) {
  const rating = Math.max(1.0, Math.min(5.0, Number(R) || 5.0));
  const sessions = Math.max(0, Number(S) || 0);
  
  const w1 = weights.W1 ?? 0.70;
  const w2 = weights.W2 ?? 0.30;
  
  // Safe log calculation: log10(S + 1)
  const experienceComponent = Math.log10(sessions + 1);
  const qualityComponent = rating;
  
  const rawScore = (qualityComponent * w1) + (experienceComponent * w2);
  return Number(rawScore.toFixed(3));
}

/**
 * Recalculates and persists tutor ranking score into SQLite
 * @param {object} db - better-sqlite3 instance
 * @param {string} tutorId - tutor profile ID
 */
function updateTutorRanking(db, tutorId) {
  const tutor = db.prepare(`
    SELECT id, average_rating, total_sessions_completed 
    FROM tutor_profiles 
    WHERE id = ?
  `).get(tutorId);

  if (!tutor) return null;

  const score = calculateRankingScore(tutor.average_rating, tutor.total_sessions_completed);
  
  db.prepare(`
    UPDATE tutor_profiles 
    SET ranking_score = ? 
    WHERE id = ?
  `).run(score, tutorId);

  return score;
}

module.exports = {
  calculateRankingScore,
  updateTutorRanking
};
