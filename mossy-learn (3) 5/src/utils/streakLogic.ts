import type { StreakState, BookItem } from '../types.ts';

/**
 * Checks in for today or a specific date.
 */
export function processCheckIn(
  state: StreakState,
  dateStr: string
): StreakState {
  const isAlready = state.activeDates.includes(dateStr);
  const newActive = isAlready ? state.activeDates : [...state.activeDates, dateStr];
  const newStreak = isAlready ? state.currentStreak : state.currentStreak + 1;
  const newBest = Math.max(state.bestStreak, newStreak);

  return {
    ...state,
    currentStreak: newStreak,
    bestStreak: newBest,
    activeDates: newActive,
    todayCheckedIn: true,
  };
}

/**
 * Consumes 1 chance to rescue a missed date by reading 5+ pages from a book in progress.
 */
export function consumeChanceToRescueDate(
  state: StreakState,
  dateToRescue: string,
  pagesRead: number = 5
): { success: boolean; state: StreakState; error?: string } {
  if (state.remainingChances <= 0) {
    return { success: false, state, error: 'Tidak ada kesempatan tersisa bulan ini' };
  }
  if (pagesRead < 5) {
    return { success: false, state, error: 'Minimal harus membaca 5 halaman' };
  }

  const newMissed = state.missedDates.filter((d) => d !== dateToRescue);
  const newChanceSaved = state.chanceSavedDates.includes(dateToRescue)
    ? state.chanceSavedDates
    : [...state.chanceSavedDates, dateToRescue];

  return {
    success: true,
    state: {
      ...state,
      remainingChances: state.remainingChances - 1,
      missedDates: newMissed,
      chanceSavedDates: newChanceSaved,
      currentStreak: state.currentStreak > 0 ? state.currentStreak : 1,
      todayCheckedIn: true,
    },
  };
}

/**
 * Calculates reading progress percentage.
 */
export function calculateProgressPercentage(currentPage: number, totalPages?: number): number {
  if (!totalPages || totalPages <= 0) return 0;
  const clamped = Math.min(Math.max(currentPage, 0), totalPages);
  return Math.round((clamped / totalPages) * 100);
}

/**
 * Updates a book's current page and auto-marks it as done if target reached.
 */
export function applyBookProgress(
  book: BookItem,
  newPage: number
): BookItem {
  const isDone = book.totalPages ? newPage >= book.totalPages : false;
  return {
    ...book,
    currentPage: newPage,
    status: isDone ? 'done' : book.status,
  };
}
