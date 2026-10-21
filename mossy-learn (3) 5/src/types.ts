export type BookStatus = 'wishlist' | 'progress' | 'done';

export type StatsTimeframe = 'week' | 'month' | '6months' | '1year' | 'all';

export interface DailyActivityRecord {
  id: string;
  dateStr: string; // e.g. "2026-10-20"
  label: string; // e.g. "20 Okt"
  dayName?: string; // e.g. "Selasa"
  pagesRead: number;
  bookTitle: string;
  noteSnippet?: string;
}

export interface ReadingNoteEntry {
  id: string;
  date: string; // e.g. "21, 10 2026"
  formattedDate: string; // e.g. "21, 10 2026"
  fromPage: number;
  toPage: number;
  content: string;
  timestamp: number;
}

export interface BookItem {
  id: string;
  title: string;
  author?: string;
  coverImage?: string;
  status: BookStatus;
  currentPage?: number;
  totalPages?: number;
  notes?: string;
  readingNotes?: ReadingNoteEntry[];
  dateAdded: string;
}

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  activeDates: string[]; // YYYY-MM-DD -> Hijau tosca gradient
  chanceSavedDates: string[]; // YYYY-MM-DD -> Hijau tua (diselamatkan baca 5 halaman)
  missedDates: string[]; // YYYY-MM-DD -> Default tanpa warna
  remainingChances: number; // Max 3 dalam sebulan
  chanceMonth: string; // YYYY-MM
  lastEndedStreak?: {
    date: string;
    totalStreak: number;
  };
  todayCheckedIn: boolean;
}

export interface UserAccount {
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  role: string;
  isLoggedIn: boolean;
  totalStudyMinutes: number;
  booksRead: number;
  lastActiveDate: string;
}
