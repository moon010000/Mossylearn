import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTimeOfDay,
  getSkyPalette,
  getLastTrackedActivity,
  calculateReadingTier,
  calculateBookStacks,
} from './achievementLogic.ts';
import type { BookItem } from '../types.ts';

test('getTimeOfDay maps hours accurately to cycle', () => {
  assert.equal(getTimeOfDay(6), 'pagi');
  assert.equal(getTimeOfDay(10), 'pagi');
  assert.equal(getTimeOfDay(12), 'siang');
  assert.equal(getTimeOfDay(15), 'siang');
  assert.equal(getTimeOfDay(17), 'sore');
  assert.equal(getTimeOfDay(18), 'sore');
  assert.equal(getTimeOfDay(21), 'malam');
  assert.equal(getTimeOfDay(2), 'malam');
});

test('getSkyPalette provides palettes for all 4 periods', () => {
  const morning = getSkyPalette('pagi');
  assert.equal(morning.isNight, false);
  assert.ok(morning.skyTop);

  const night = getSkyPalette('malam');
  assert.equal(night.isNight, true);
  assert.ok(night.sunMoonColor);

  const afternoon = getSkyPalette('sore');
  assert.equal(afternoon.isNight, false);
});

test('getLastTrackedActivity picks newest note or fallback', () => {
  const testBooks: BookItem[] = [
    {
      id: 'b1',
      title: 'Sapiens',
      status: 'progress',
      dateAdded: '2026-10-20',
      currentPage: 105,
      readingNotes: [
        {
          id: 'n1',
          date: '21, 10 2026',
          formattedDate: '21, 10 2026',
          fromPage: 100,
          toPage: 105,
          content: 'Note',
          timestamp: 1000,
        },
      ],
    },
    {
      id: 'b2',
      title: 'Atomic Habits',
      status: 'progress',
      dateAdded: '2026-10-20',
      currentPage: 50,
      readingNotes: [
        {
          id: 'n2',
          date: '22, 10 2026',
          formattedDate: '22, 10 2026',
          fromPage: 30,
          toPage: 50,
          content: 'Habit note',
          timestamp: 2000,
        },
      ],
    },
  ];

  const res = getLastTrackedActivity(testBooks);
  assert.equal(res.bookTitle, 'Atomic Habits');
  assert.equal(res.pagesAdded, 20);
  assert.equal(res.currentPage, 50);
});

test('calculateReadingTier scales with completed books', () => {
  assert.equal(calculateReadingTier(0).rank, 'Tingkat 1');
  assert.equal(calculateReadingTier(2).rank, 'Tingkat 2');
  assert.equal(calculateReadingTier(4).rank, 'Tingkat 3');
  assert.equal(calculateReadingTier(8).rank, 'Tingkat 4');
  assert.ok(calculateReadingTier(12).rank.includes('Tingkat 5'));
});

test('calculateBookStacks limits each stack to max 5 books', () => {
  assert.deepEqual(calculateBookStacks(0), []);
  assert.deepEqual(calculateBookStacks(1), [1]);
  assert.deepEqual(calculateBookStacks(4), [4]);
  assert.deepEqual(calculateBookStacks(5), [5]);
  assert.deepEqual(calculateBookStacks(6), [5, 1]);
  assert.deepEqual(calculateBookStacks(7), [5, 2]);
  assert.deepEqual(calculateBookStacks(10), [5, 5]);
  assert.deepEqual(calculateBookStacks(12), [5, 5, 2]);
});
