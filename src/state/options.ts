/** The discrete choices the UI offers. Kept in one place so schema and views agree. */

export const WINDOW_SIZES = [3, 5, 6, 8, 10, 12] as const;
export const SPRINT_LENGTHS_DAYS = [7, 14, 21] as const;
export const TRIAL_COUNTS = [1000, 5000, 10000] as const;

export const MAX_SPRINTS = 500;
export const MAX_NAME_LENGTH = 60;
