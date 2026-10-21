import test from 'node:test';
import assert from 'node:assert/strict';
import {
  processCheckIn,
  consumeChanceToRescueDate,
  calculateProgressPercentage,
  applyBookProgress,
} from './streakLogic.ts';
import type { StreakState, BookItem } from '../types.ts';

const initialMockStreak: StreakState = {
  currentStreak: 5,
  bestStreak: 10,
  activeDates: ['2026-10-18', '2026-10-19'],
  chanceSavedDates: [],
  missedDates: ['2026-10-17'],
  remainingChances: 3,
  chanceMonth: '2026-10',
  todayCheckedIn: false,
};

test('processCheckIn increments streak and sets activeDate', () => {
  const result = processCheckIn(initialMockStreak, '2026-10-20');
  assert.equal(result.currentStreak, 6);
  assert.equal(result.bestStreak, 10);
  assert.equal(result.todayCheckedIn, true);
  assert.ok(result.activeDates.includes('2026-10-20'));
});

test('processCheckIn updates bestStreak if current exceeds it', () => {
  const highStreakState: StreakState = {
    ...initialMockStreak,
    currentStreak: 10,
    bestStreak: 10,
  };
  const result = processCheckIn(highStreakState, '2026-10-20');
  assert.equal(result.currentStreak, 11);
  assert.equal(result.bestStreak, 11);
});

test('consumeChanceToRescueDate rescues a missed date when >= 5 pages read', () => {
  const outcome = consumeChanceToRescueDate(initialMockStreak, '2026-10-17', 5);
  assert.equal(outcome.success, true);
  assert.equal(outcome.state.remainingChances, 2);
  assert.equal(outcome.state.missedDates.includes('2026-10-17'), false);
  assert.equal(outcome.state.chanceSavedDates.includes('2026-10-17'), true);
});

test('consumeChanceToRescueDate fails when reading less than 5 pages', () => {
  const outcome = consumeChanceToRescueDate(initialMockStreak, '2026-10-17', 3);
  assert.equal(outcome.success, false);
  assert.equal(outcome.state.remainingChances, 3);
});

test('consumeChanceToRescueDate fails when remaining chances is 0', () => {
  const noChances: StreakState = { ...initialMockStreak, remainingChances: 0 };
  const outcome = consumeChanceToRescueDate(noChances, '2026-10-17', 5);
  assert.equal(outcome.success, false);
});

test('calculateProgressPercentage correctly calculates progress', () => {
  assert.equal(calculateProgressPercentage(50, 100), 50);
  assert.equal(calculateProgressPercentage(100, 200), 50);
  assert.equal(calculateProgressPercentage(150, 100), 100);
  assert.equal(calculateProgressPercentage(0, 300), 0);
  assert.equal(calculateProgressPercentage(10, 0), 0);
});

test('applyBookProgress updates page and marks done when total pages reached', () => {
  const book: BookItem = {
    id: 'test-1',
    title: 'Test Book',
    status: 'progress',
    currentPage: 90,
    totalPages: 100,
    dateAdded: '2026-10-01',
  };

  const updated1 = applyBookProgress(book, 95);
  assert.equal(updated1.currentPage, 95);
  assert.equal(updated1.status, 'progress');

  const updated2 = applyBookProgress(book, 100);
  assert.equal(updated2.currentPage, 100);
  assert.equal(updated2.status, 'done');
});
