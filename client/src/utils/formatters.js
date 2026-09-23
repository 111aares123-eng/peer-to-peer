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
 * Format date string e.g. "2026-09-25" -> "Fri, Sep 25"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format time range e.g. "14:00" -> "2:00 PM"
 */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Explains ranking score formula components
 */
export function explainRankScore(score, rating, sessions) {
  const quality = (rating * 0.70).toFixed(2);
  const volume = (Math.log10(sessions + 1) * 0.30).toFixed(2);
  return {
    score: score.toFixed(2),
    qualityComponent: quality,
    volumeComponent: volume,
    explanation: `Score = (${rating} × 0.7) + (log(${sessions}+1) × 0.3) = ${quality} + ${volume}`
  };
}
