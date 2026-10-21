import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header.tsx';
import { SquircleCard } from './components/SquircleCard.tsx';
import { LibraryView } from './components/LibraryView.tsx';
import { NotesStatsView } from './components/NotesStatsView.tsx';
import { AchievementView } from './components/AchievementView.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { StreakModal } from './components/StreakModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { BackgroundBooks } from './components/BackgroundBooks.tsx';
import { BookItem, BookStatus, UserProfile, StreakState, ReadingNoteEntry } from './types.ts';
import { processCheckIn, consumeChanceToRescueDate, applyBookProgress } from './utils/streakLogic.ts';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Muhammad Daffa',
  username: 'mossymoon',
  email: 'mossymoon00@gmail.com',
  role: 'Lifelong Learner',
  isLoggedIn: true,
  totalStudyMinutes: 420,
  booksRead: 5,
  lastActiveDate: new Date().toISOString(),
};

// Generate sample active dates for current month up to today
const todayDate = new Date();
const currentMonthStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}`;
const sampleActiveDates: string[] = [];
for (let d = 1; d <= todayDate.getDate(); d++) {
  if (d !== 6 && d !== 11) {
    sampleActiveDates.push(`${currentMonthStr}-${String(d).padStart(2, '0')}`);
  }
}

const DEFAULT_STREAK: StreakState = {
  currentStreak: 14,
  bestStreak: 32,
  activeDates: sampleActiveDates,
  chanceSavedDates: [`${currentMonthStr}-06`],
  missedDates: [`${currentMonthStr}-11`],
  remainingChances: 2, // 1 used previously on the 6th
  chanceMonth: currentMonthStr,
  lastEndedStreak: {
    date: '12 Sep 2026',
    totalStreak: 32,
  },
  todayCheckedIn: true,
};

const INITIAL_BOOKS: BookItem[] = [
  {
    id: 'book-0',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    status: 'progress',
    currentPage: 105,
    totalPages: 498,
    notes: 'Saya jadi belajar bahwa manusia mampu bekerja sama secara fleksibel dalam jumlah besar berkat mitos dan narasi bersama.',
    readingNotes: [
      {
        id: 'note-sapiens-3',
        date: '21, 10 2026',
        formattedDate: '21, 10 2026',
        fromPage: 102,
        toPage: 105,
        content: 'Saya jadi belajar bahwa manusia mampu bekerja sama secara fleksibel dalam jumlah besar karena kemampuan mempercayai mitos bersama.',
        timestamp: Date.now() - 1000 * 60 * 30,
      },
      {
        id: 'note-sapiens-2',
        date: '18, 10 2026',
        formattedDate: '18, 10 2026',
        fromPage: 80,
        toPage: 102,
        content: 'Revolusi Kognitif membuka pintu gerbang bahasa fiksi, memungkinkan kelompok manusia tumbuh melampaui batas 150 individu.',
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
      },
      {
        id: 'note-sapiens-1',
        date: '14, 10 2026',
        formattedDate: '14, 10 2026',
        fromPage: 40,
        toPage: 80,
        content: 'Homo sapiens purba hidup sebagai pemburu-pengumpul dengan pemahaman mendalam tentang alam sekitarnya.',
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 7,
      },
    ],
    dateAdded: '2026-10-12',
  },
  {
    id: 'book-1',
    title: 'Atomic Habits',
    author: 'James Clear',
    status: 'progress',
    currentPage: 142,
    totalPages: 320,
    notes: 'Perubahan 1% setiap hari berdampak eksponensial dalam jangka panjang.',
    readingNotes: [
      {
        id: 'note-atomic-2',
        date: '20, 10 2026',
        formattedDate: '20, 10 2026',
        fromPage: 120,
        toPage: 142,
        content: 'Desain lingkungan Anda agar petunjuk kebiasaan baik terlihat jelas dan hambatan tindakan buruk meningkat.',
        timestamp: Date.now() - 1000 * 60 * 60 * 12,
      },
      {
        id: 'note-atomic-1',
        date: '16, 10 2026',
        formattedDate: '16, 10 2026',
        fromPage: 90,
        toPage: 120,
        content: 'Fokuslah pada identitas siapa yang Anda inginkan, bukan sekadar tujuan hasil jangka pendek.',
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 4,
      },
    ],
    dateAdded: '2026-10-15',
  },
  {
    id: 'book-2',
    title: 'Deep Work',
    author: 'Cal Newport',
    status: 'progress',
    currentPage: 88,
    totalPages: 296,
    notes: 'Fokus intens tanpa distraksi adalah kemampuan super di era modern.',
    readingNotes: [
      {
        id: 'note-deep-1',
        date: '19, 10 2026',
        formattedDate: '19, 10 2026',
        fromPage: 60,
        toPage: 88,
        content: 'Menghilangkan interupsi dangkal memberikan ruang bagi otak untuk menghasilkan nilai tinggi yang sulit ditiru.',
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
    ],
    dateAdded: '2026-10-18',
  },
  {
    id: 'book-3',
    title: 'Filosofi Teras',
    author: 'Henry Manampiring',
    status: 'done',
    currentPage: 320,
    totalPages: 320,
    notes: 'Fokus pada dikotomi kendali: apa yang ada dalam kendali kita vs luar kendali.',
    readingNotes: [
      {
        id: 'note-teras-1',
        date: '15, 10 2026',
        formattedDate: '15, 10 2026',
        fromPage: 280,
        toPage: 320,
        content: 'Kebahagiaan sejati hadir ketika kita mengikhlaskan hal di luar kendali dan memaksimalkan respon rasional.',
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5,
      },
    ],
    dateAdded: '2026-10-01',
  },
  {
    id: 'book-4',
    title: 'Show Your Work!',
    author: 'Austin Kleon',
    status: 'wishlist',
    currentPage: 0,
    totalPages: 224,
    notes: 'Membagikan proses belajar dan berkarya secara transparan.',
    dateAdded: '2026-10-19',
  },
];

export default function App() {
  // Navigation: 'home' | 'library' | 'notes-stats' | 'achievement'
  const [activeView, setActiveView] = useState<'home' | 'library' | 'notes-stats' | 'achievement'>('home');

  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mossy_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });

  // Streak state with 3-chance system & calendar records
  const [streakState, setStreakState] = useState<StreakState>(() => {
    const saved = localStorage.getItem('mossy_streak_state');
    if (saved) {
      try {
        const parsed: StreakState = JSON.parse(saved);
        // Reset chances if new month has started
        if (parsed.chanceMonth !== currentMonthStr) {
          return {
            ...parsed,
            remainingChances: 3,
            chanceMonth: currentMonthStr,
          };
        }
        return parsed;
      } catch {
        return DEFAULT_STREAK;
      }
    }
    return DEFAULT_STREAK;
  });

  // Books in library
  const [books, setBooks] = useState<BookItem[]>(() => {
    const saved = localStorage.getItem('mossy_books');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_BOOKS;
      }
    }
    return INITIAL_BOOKS;
  });

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isStreakOpen, setIsStreakOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Toast / notification for empty squircle clicks
  const [slotNotice, setSlotNotice] = useState<string | null>(null);

  // Ensure pure aesthetic white monochrome styles on document body
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.style.background = 'linear-gradient(180deg, #FDFBF7 0%, #F8F4EA 50%, #EFE7D6 100%)';
    document.body.style.color = '#18181b';
  }, []);

  // Sync books
  useEffect(() => {
    localStorage.setItem('mossy_books', JSON.stringify(books));
    const doneBooks = books.filter((b) => b.status === 'done').length;
    setUserProfile((prev) => ({ ...prev, booksRead: doneBooks }));
  }, [books]);

  // Sync profile
  useEffect(() => {
    localStorage.setItem('mossy_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Sync streak
  useEffect(() => {
    localStorage.setItem('mossy_streak_state', JSON.stringify(streakState));
  }, [streakState]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Escape') {
        if (isProfileOpen) setIsProfileOpen(false);
        else if (isStreakOpen) setIsStreakOpen(false);
        else if (isAuthModalOpen) setIsAuthModalOpen(false);
        else if (activeView !== 'home') setActiveView('home');
      } else if (e.key === 'p' || e.key === 'P') {
        setIsProfileOpen((prev) => !prev);
      } else if (e.key === '1' && activeView === 'home') {
        setActiveView('library');
      } else if (e.key === '2' && activeView === 'home') {
        setActiveView('notes-stats');
      } else if (e.key === '3' && activeView === 'home') {
        setActiveView('achievement');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, isProfileOpen, isStreakOpen, isAuthModalOpen]);

  // Streak check-in today
  const handleCheckInToday = () => {
    const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(
      todayDate.getDate()
    ).padStart(2, '0')}`;

    setStreakState((prev) => processCheckIn(prev, todayStr));
  };

  // Use 1 Chance: requirement is reading 5 pages from a book in progress
  const handleUseChance = (bookId: string) => {
    // 1. Update book progress (+5 pages)
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        return applyBookProgress(b, (b.currentPage || 0) + 5);
      })
    );

    // 2. Consume 1 chance, rescue the missed date (move from missedDates to chanceSavedDates)
    setStreakState((prev) => {
      const missedToRescue =
        prev.missedDates[0] ||
        `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(
          Math.max(1, todayDate.getDate() - 1)
        ).padStart(2, '0')}`;
      const res = consumeChanceToRescueDate(prev, missedToRescue, 5);
      return res.success ? res.state : prev;
    });
  };

  // Auth Handlers
  const handleLoginSuccess = (email: string) => {
    const namePart = email.split('@')[0];
    setUserProfile((prev) => ({
      ...prev,
      email,
      username: namePart,
      name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
      isLoggedIn: true,
    }));
  };

  const handleLogout = () => {
    setUserProfile((prev) => ({
      ...prev,
      isLoggedIn: false,
    }));
    setIsProfileOpen(false);
  };

  // Book Handlers
  const handleAddBook = (newBookData: Omit<BookItem, 'id' | 'dateAdded'>) => {
    const newBook: BookItem = {
      ...newBookData,
      id: `book-${Date.now()}`,
      dateAdded: new Date().toISOString().split('T')[0],
    };
    setBooks((prev) => [newBook, ...prev]);
  };

  const handleUpdateBookStatus = (id: string, status: BookStatus) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        return {
          ...b,
          status,
          currentPage: status === 'done' && b.totalPages ? b.totalPages : b.currentPage,
        };
      })
    );
  };

  const handleUpdateBookProgress = (
    id: string,
    currentPage: number,
    noteContent?: string,
    fromPage?: number
  ) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const isNowDone = b.totalPages ? currentPage >= b.totalPages : false;

        const updatedNotes = [...(b.readingNotes || [])];
        if (noteContent && noteContent.trim()) {
          const now = new Date();
          const formattedDate = `${now.getDate()}, ${String(now.getMonth() + 1).padStart(2, '0')} ${now.getFullYear()}`;
          updatedNotes.unshift({
            id: `note-${Date.now()}`,
            date: formattedDate,
            formattedDate: formattedDate,
            fromPage: fromPage ?? (b.currentPage || 0),
            toPage: currentPage,
            content: noteContent.trim(),
            timestamp: Date.now(),
          });
        }

        return {
          ...b,
          currentPage,
          status: isNowDone ? 'done' : b.status,
          readingNotes: updatedNotes,
          notes: noteContent ? noteContent : b.notes,
        };
      })
    );
  };

  const handleAddNoteToBook = (
    bookId: string,
    noteData: Omit<ReadingNoteEntry, 'id' | 'timestamp'>
  ) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        const newEntry: ReadingNoteEntry = {
          ...noteData,
          id: `note-${Date.now()}`,
          timestamp: Date.now(),
        };
        return {
          ...b,
          readingNotes: [newEntry, ...(b.readingNotes || [])],
          notes: newEntry.content,
        };
      })
    );
  };

  const totalNotesCount = books.reduce(
    (acc, b) => acc + (b.readingNotes ? b.readingNotes.length : b.notes ? 1 : 0),
    0
  );

  const handleDeleteBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleEmptySquircleClick = (slotNumber: number) => {
    setSlotNotice(`Squircle ${slotNumber}: Siap diisi fitur berikutnya yang Anda tentukan.`);
    setTimeout(() => setSlotNotice(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#FDFBF7] via-[#F8F4EA] to-[#EFE7D6] text-[#18181b] relative overflow-x-hidden selection:bg-[#3B270C] selection:text-white">
      {/* Background Books Aesthetic Vector & Ambient Light */}
      <BackgroundBooks />

      {/* Header (Top-Left: Profil/Login, Top-Right: Streak Api & Tanggal Real-Time) */}
      <Header
        userProfile={userProfile}
        streakState={streakState}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenStreak={() => setIsStreakOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {activeView === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="flex-1 flex flex-col items-center justify-center px-6 py-10 md:py-16 max-w-7xl mx-auto w-full"
            >
              {/* Title Section: "mossy learn" */}
              <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
                <motion.h1
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.04em] lowercase select-none text-neutral-950"
                >
                  mossy learn
                </motion.h1>

                {/* Primary Quote */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.15 }}
                  className="mt-4 text-xs sm:text-sm font-light leading-relaxed max-w-lg mx-auto text-neutral-700"
                >
                  Buku mengikat waktu, menghubungkan orang-orang yang tidak saling kenal dan membiarkan kita mendengar suara dari masa lalu.
                </motion.p>

                {/* Additional Quote as requested: "Buat jaringan otakmu menebal, berikan nutrisi dari buku." */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.25 }}
                  className="mt-2 text-[11px] sm:text-xs font-mono tracking-tight text-neutral-500 italic"
                >
                  Buat jaringan otakmu menebal, berikan nutrisi dari buku.
                </motion.p>
              </div>

              {/* 3 Kubus Bentuk Squircle */}
              {/* Squircle 1: Library | Squircle 2: Notes / Stats | Squircle 3: Slot Kosong */}
              <div className="w-full max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-center justify-center">
                  {/* Squircle 1 (Kiri): Library */}
                  <SquircleCard
                    index={0}
                    isLibrary={true}
                    bookCount={books.length}
                    onClick={() => setActiveView('library')}
                  />

                  {/* Squircle 2 (Tengah): Notes / Stats (Sesuai Sketsa IMG_3733, IMG_3734, IMG_3735) */}
                  <SquircleCard
                    index={1}
                    isLibrary={false}
                    isNotesStats={true}
                    notesCount={totalNotesCount}
                    onClick={() => setActiveView('notes-stats')}
                  />

                  {/* Squircle 3 (Kanan): Personal Achievement Visual 3D Pixel Progres (sesuai sketsa IMG_3740) */}
                  <SquircleCard
                    index={2}
                    isLibrary={false}
                    isAchievement={true}
                    doneCount={books.filter((b) => b.status === 'done').length}
                    progressCount={books.filter((b) => b.status === 'progress').length}
                    onClick={() => setActiveView('achievement')}
                  />
                </div>
              </div>

              {/* Toast Notice for empty squircle */}
              <AnimatePresence>
                {slotNotice && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-8 px-4 py-2.5 rounded-2xl border border-neutral-200 bg-white text-neutral-800 text-xs font-mono tracking-tight shadow-sm"
                  >
                    {slotNotice}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : activeView === 'library' ? (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* Library View matching the user's sketch */}
              <LibraryView
                onBack={() => setActiveView('home')}
                books={books}
                onAddBook={handleAddBook}
                onUpdateBookStatus={handleUpdateBookStatus}
                onUpdateBookProgress={handleUpdateBookProgress}
                onDeleteBook={handleDeleteBook}
              />
            </motion.div>
          ) : activeView === 'notes-stats' ? (
            <motion.div
              key="notes-stats"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* Notes / Stats View matching user sketch IMG_3733, IMG_3734, IMG_3735 */}
              <NotesStatsView
                onBack={() => setActiveView('home')}
                books={books}
                onAddNoteToBook={handleAddNoteToBook}
              />
            </motion.div>
          ) : (
            <motion.div
              key="achievement"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* Personal Achievement View: 3D Pixel Progress matching user sketch IMG_3740 */}
              <AchievementView
                onBack={() => setActiveView('home')}
                books={books}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Minimalist with Creator Attribution */}
      <footer className="w-full py-6 px-6 text-center select-none border-t border-[#D4A373]/20 bg-[#FDFBF7]/60 backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto text-[11px] font-mono gap-2 text-neutral-600 transition-colors">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-neutral-900">
              by: Muhammad Daffa Asshiddiqie
            </span>
            <span className="opacity-40">·</span>
            <a
              href="https://instagram.com/dfaaash"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black hover:underline transition-opacity font-medium"
            >
              ig: dfaaash
            </a>
          </div>

          <div className="text-neutral-400">
            <span>mossy learn © 2026 · Pure Minimal Monochrome</span>
          </div>
        </div>
      </footer>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <ProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            userProfile={userProfile}
            streakCount={streakState.currentStreak}
            onUpdateProfile={setUserProfile}
            onLogout={handleLogout}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Streak Modal with 3-Chance & Reading Requirement System */}
      <AnimatePresence>
        {isStreakOpen && (
          <StreakModal
            isOpen={isStreakOpen}
            onClose={() => setIsStreakOpen(false)}
            streakState={streakState}
            books={books}
            onCheckInToday={handleCheckInToday}
            onUseChance={handleUseChance}
          />
        )}
      </AnimatePresence>

      {/* Auth Modal (Login & Buat Password Sendiri) */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
