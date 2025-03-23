/**
 * Helper functions for consistent date handling throughout the app
 */

/**
 * Convert an ISO date string to a local date string in YYYY-MM-DD format
 */
export function getLocalDateString(isoString: string): string {
  const date = new Date(isoString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Get a Date object representing only the date portion (year, month, day) in local time
 */
export function getLocalDateOnly(isoString: string): Date {
  const date = new Date(isoString);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Get today's date as a string in YYYY-MM-DD format in local time
 */
export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Get yesterday's date as a string in YYYY-MM-DD format in local time
 */
export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
}

/**
 * Create a date with the specified local date (YYYY-MM-DD) but preserve the time from another date
 */
export function createDateWithLocalDateAndTime(localDateString: string, timeFromDate: Date): Date {
  const [year, month, day] = localDateString.split('-').map(num => parseInt(num, 10));
  const result = new Date(timeFromDate.getTime());
  
  result.setFullYear(year);
  result.setMonth(month - 1); // JavaScript months are 0-indexed
  result.setDate(day);
  
  return result;
}

/**
 * Compare two dates to check if they are the same day in local time
 */
export function isSameLocalDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Format a date for display according to the user's locale
 */
export function formatDateForDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}