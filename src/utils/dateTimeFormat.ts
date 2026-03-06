export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return 'Just now';
  }

  // Less than an hour
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`; // e.g., "15m"
  }

  // Less than a day
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`; // e.g., "4h"
  }

  // Less than a week
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d`; // e.g., "2d"
  }

  // Older than a week
  const isCurrentYear = now.getFullYear() === date.getFullYear();
  
  // Use Intl.DateTimeFormat for clean, localized date formatting
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: isCurrentYear ? undefined : 'numeric' // Only show year if it's from a past year
  }).format(date);
}