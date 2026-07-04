/**
 * Conditionally joins CSS class names.
 * @param {...string} classes - Class names to join.
 * @returns {string} - Joined class names.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const formattedSecs = secs < 10 ? `0${secs}` : secs;

  if (hrs > 0) {
    const formattedMins = mins < 10 ? `0${mins}` : mins;
    return `${hrs}:${formattedMins}:${formattedSecs}`;
  }
  return `${mins}:${formattedSecs}`;
}

/**
 * Formats a Date object or ISO string to a human-readable date.
 * @param {Date|string} date - Date to format.
 * @returns {string} - Formatted date.
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
