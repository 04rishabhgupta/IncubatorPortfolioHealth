/**
 * System Clock & Date Utilities
 * Returns the real current date (YYYY-MM-DD).
 * Can be fixed to a mock date during unit tests or demos if NEXT_PUBLIC_DEMO_CLOCK is set.
 */

export function getTodayDateString(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_DEMO_CLOCK === 'true') {
    return '2026-10-05';
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Current date string in YYYY-MM-DD format (e.g. 2026-10-08).
 */
export const TODAY = getTodayDateString();

/**
 * Backwards-compatible alias for TODAY
 */
export const DEMO_TODAY = TODAY;

/**
 * Returns current Date object for calculations
 */
export function getTodayDate(): Date {
  return new Date(getTodayDateString());
}

export function getDemoDate(): Date {
  return getTodayDate();
}
