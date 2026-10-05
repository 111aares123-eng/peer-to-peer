/**
 * Format currency amount to Indian Rupee (₹)
 */
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Format date string e.g. "2026-09-25" or "2026-10-06T14:00:00Z" -> "Fri, Oct 6"
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'Flexible Date';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format time string e.g. "14:00" or "2026-10-06T14:00:00Z" -> "2:00 PM"
 */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  if (typeof timeStr === 'string' && timeStr.includes('T')) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  }
  const parts = String(timeStr).split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
  }
  return String(timeStr);
}

/**
 * Explains ranking score formula components
 */
export function explainRankScore(score = 0, rating = 5.0, sessions = 0) {
  const numScore = Number(score) || 0;
  const numRating = Number(rating) || 5.0;
  const numSessions = Number(sessions) || 0;
  const quality = (numRating * 0.70).toFixed(2);
  const volume = (Math.log10(numSessions + 1) * 0.30).toFixed(2);
  const displayScore = numScore > 0 ? numScore.toFixed(2) : (Number(quality) + Number(volume)).toFixed(2);
  return {
    score: displayScore,
    qualityComponent: quality,
    volumeComponent: volume,
    explanation: `Score = (${numRating} × 0.7) + (log₁₀(${numSessions}+1) × 0.3) = ${quality} + ${volume}`
  };
}
