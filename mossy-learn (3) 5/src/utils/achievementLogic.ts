import type { BookItem } from '../types.ts';

export type TimeOfDay = 'pagi' | 'siang' | 'sore' | 'malam';

export interface SkyPalette {
  skyTop: string;
  skyBottom: string;
  groundColor: string;
  mountainFar: string;
  mountainNear: string;
  treeFoliage: string;
  treeTrunk: string;
  sunMoonColor: string;
  ambientLight: string;
  lightIntensity: number;
  isNight: boolean;
  label: string;
}

/**
 * Determines time of day based on 24-hour hour (0-23).
 * Pagi: 05:00 - 10:59
 * Siang: 11:00 - 15:59
 * Sore: 16:00 - 18:59
 * Malam: 19:00 - 04:59
 */
export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 11) return 'pagi';
  if (hour >= 11 && hour < 16) return 'siang';
  if (hour >= 16 && hour < 19) return 'sore';
  return 'malam';
}

/**
 * Returns color palette for each time of day.
 */
export function getSkyPalette(time: TimeOfDay): SkyPalette {
  switch (time) {
    case 'pagi':
      return {
        skyTop: '#78A1BB',
        skyBottom: '#FCE7C8',
        groundColor: '#4A7C59',
        mountainFar: '#8D9DA8',
        mountainNear: '#5C7A67',
        treeFoliage: '#3A5A40',
        treeTrunk: '#5A3D28',
        sunMoonColor: '#FFAA44',
        ambientLight: '#FFEEDD',
        lightIntensity: 1.1,
        isNight: false,
        label: 'Pagi (Fajar Emas)',
      };
    case 'siang':
      return {
        skyTop: '#4B88A2',
        skyBottom: '#B4D6DF',
        groundColor: '#3E6B48',
        mountainFar: '#6A8995',
        mountainNear: '#466854',
        treeFoliage: '#2E5033',
        treeTrunk: '#4A3220',
        sunMoonColor: '#FFF4D0',
        ambientLight: '#FFFFFF',
        lightIntensity: 1.3,
        isNight: false,
        label: 'Siang (Cerah Hangat)',
      };
    case 'sore':
      return {
        skyTop: '#4C3B4D',
        skyBottom: '#E88873',
        groundColor: '#36533C',
        mountainFar: '#5D4954',
        mountainNear: '#3C4D40',
        treeFoliage: '#244028',
        treeTrunk: '#3B271A',
        sunMoonColor: '#E05A47',
        ambientLight: '#FFCCAA',
        lightIntensity: 0.95,
        isNight: false,
        label: 'Sore (Senja Jingga)',
      };
    case 'malam':
      return {
        skyTop: '#0F172A',
        skyBottom: '#1E293B',
        groundColor: '#1B2E21',
        mountainFar: '#1A233A',
        mountainNear: '#142028',
        treeFoliage: '#132818',
        treeTrunk: '#2A1A10',
        sunMoonColor: '#FFFBEA',
        ambientLight: '#7E92B0',
        lightIntensity: 0.55,
        isNight: true,
        label: 'Malam (Bintang & Rembulan)',
      };
  }
}

/**
 * Finds the latest reading activity / tracked progress for the floating badge.
 */
export function getLastTrackedActivity(
  books: BookItem[]
): { bookTitle: string; pagesAdded: number; currentPage: number } {
  // 1. Look for newest reading notes
  let latestNoteTimestamp = 0;
  let candidate: { bookTitle: string; pagesAdded: number; currentPage: number } | null = null;

  for (const b of books) {
    if (b.readingNotes && b.readingNotes.length > 0) {
      const topNote = b.readingNotes[0];
      if (topNote.timestamp && topNote.timestamp > latestNoteTimestamp) {
        latestNoteTimestamp = topNote.timestamp;
        const diff = topNote.toPage - topNote.fromPage;
        candidate = {
          bookTitle: b.title,
          pagesAdded: diff > 0 ? diff : 5,
          currentPage: topNote.toPage,
        };
      }
    }
  }

  if (candidate) return candidate;

  // 2. Fallback to first book in progress
  const progressBook = books.find((b) => b.status === 'progress') || books[0];
  if (progressBook) {
    return {
      bookTitle: progressBook.title,
      pagesAdded: 5,
      currentPage: progressBook.currentPage || 5,
    };
  }

  return {
    bookTitle: 'Sapiens',
    pagesAdded: 5,
    currentPage: 105,
  };
}

/**
 * Calculates reading tier / achievement rank based on completed books.
 */
export function calculateReadingTier(doneCount: number): {
  title: string;
  rank: string;
  nextThreshold: number;
  progressToNext: number;
} {
  if (doneCount <= 0) {
    return { title: 'Pemula Pencari Hikmah', rank: 'Tingkat 1', nextThreshold: 1, progressToNext: 0 };
  } else if (doneCount < 3) {
    return { title: 'Pembaca Setia Alam', rank: 'Tingkat 2', nextThreshold: 3, progressToNext: Math.round((doneCount / 3) * 100) };
  } else if (doneCount < 5) {
    return { title: 'Pemberi Nutrisi Jiwa', rank: 'Tingkat 3', nextThreshold: 5, progressToNext: Math.round((doneCount / 5) * 100) };
  } else if (doneCount < 10) {
    return { title: 'Sang Penjelajah Literasi', rank: 'Tingkat 4', nextThreshold: 10, progressToNext: Math.round((doneCount / 10) * 100) };
  } else {
    return { title: 'Cendekiawan Pohon Pengetahuan', rank: 'Tingkat 5 (Maksimal)', nextThreshold: doneCount, progressToNext: 100 };
  }
}

/**
 * Splits a total number of books into stacks where each stack has at most maxPerStack (default 5) books.
 * Example: 7 books => [5, 2]; 12 books => [5, 5, 2]
 */
export function calculateBookStacks(totalBooks: number, maxPerStack: number = 5): number[] {
  if (totalBooks <= 0) return [];
  const stacks: number[] = [];
  let remaining = totalBooks;
  while (remaining > 0) {
    const countInThisStack = Math.min(remaining, maxPerStack);
    stacks.push(countInThisStack);
    remaining -= countInThisStack;
  }
  return stacks;
}
