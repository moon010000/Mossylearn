import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Plus,
  TrendingUp,
  FileEdit,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Maximize2,
  Minimize2,
  Copy,
} from 'lucide-react';
import { BookItem, ReadingNoteEntry, StatsTimeframe, DailyActivityRecord } from '../types.ts';
import { NoteDateScrollPickerModal } from './NoteDateScrollPickerModal.tsx';

interface NotesStatsViewProps {
  onBack: () => void;
  books: BookItem[];
  onAddNoteToBook?: (bookId: string, note: Omit<ReadingNoteEntry, 'id' | 'timestamp'>) => void;
  onAddNote?: (bookId: string, note: Omit<ReadingNoteEntry, 'id' | 'timestamp'>) => void;
}

type MainTab = 'notes' | 'stats';

export const NotesStatsView: React.FC<NotesStatsViewProps> = ({
  onBack,
  books,
  onAddNoteToBook,
  onAddNote,
}) => {
  const saveNoteHandler = onAddNoteToBook || onAddNote;
  const [activeTab, setActiveTab] = useState<MainTab>('notes');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number>(0);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState<boolean>(false);

  // Fitur Perbesar Catatan (Tampilan Luas)
  const [isExpandedNoteOpen, setIsExpandedNoteOpen] = useState<boolean>(false);
  const [copiedNote, setCopiedNote] = useState<boolean>(false);

  // Timeframe selector for Stats: 'week' | 'month' | '6months' | '1year' | 'all'
  const [statsTimeframe, setStatsTimeframe] = useState<StatsTimeframe>('week');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // New Note Form State
  const [newNoteFromPage, setNewNoteFromPage] = useState<string>('');
  const [newNoteToPage, setNewNoteToPage] = useState<string>('');
  const [newNoteContent, setNewNoteContent] = useState<string>('');

  // Collect books that have notes
  const booksWithNotes = books.filter(
    (b) => b.readingNotes && b.readingNotes.length > 0
  );

  // Selected book for detail view
  const currentBook = books.find((b) => b.id === selectedBookId) || null;
  const currentNotes = currentBook?.readingNotes || [];
  const currentNote = currentNotes[selectedNoteIndex] || currentNotes[0] || null;

  const handleSelectBook = (bookId: string) => {
    setSelectedBookId(bookId);
    setSelectedNoteIndex(0);
  };

  const handleSaveNewNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBook || !newNoteContent.trim()) return;

    const fromP = parseInt(newNoteFromPage, 10) || currentBook.currentPage || 0;
    const toP = parseInt(newNoteToPage, 10) || fromP + 5;
    const now = new Date();
    const dateFormatted = `${now.getDate()}, ${String(now.getMonth() + 1).padStart(2, '0')} ${now.getFullYear()}`;

    if (saveNoteHandler) {
      saveNoteHandler(currentBook.id, {
        date: dateFormatted,
        formattedDate: dateFormatted,
        fromPage: fromP,
        toPage: toP,
        content: newNoteContent.trim(),
      });
    }

    setNewNoteFromPage('');
    setNewNoteToPage('');
    setNewNoteContent('');
    setIsNewNoteModalOpen(false);
    setSelectedNoteIndex(0);
  };

  const handleCopyNote = () => {
    if (!currentNote) return;
    navigator.clipboard.writeText(currentNote.content);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  // Compute aggregated overall metrics
  const totalNotesCount = books.reduce(
    (acc, b) => acc + (b.readingNotes?.length || 0),
    0
  );
  const totalPagesRead = books.reduce(
    (acc, b) => acc + (b.currentPage || 0),
    0
  );
  const completedBooksCount = books.filter((b) => b.status === 'done').length;
  const inProgressBooksCount = books.filter((b) => b.status === 'progress').length;

  /* =========================================================================
     STATISTICS TIMEFRAME DATA CALCULATION
     ========================================================================= */
  const activityData: DailyActivityRecord[] = useMemo(() => {
    if (statsTimeframe === 'week') {
      return [
        {
          id: 'w-1',
          dateStr: '2026-10-15',
          label: '15 Okt',
          dayName: 'Kamis',
          pagesRead: 18,
          bookTitle: 'Filosofi Teras',
          noteSnippet: 'Dikotomi kendali rasional & kebahagiaan batin.',
        },
        {
          id: 'w-2',
          dateStr: '2026-10-16',
          label: '16 Okt',
          dayName: 'Jumat',
          pagesRead: 30,
          bookTitle: 'Atomic Habits',
          noteSnippet: 'Fokus pada identitas pembelajar jangka panjang.',
        },
        {
          id: 'w-3',
          dateStr: '2026-10-17',
          label: '17 Okt',
          dayName: 'Sabtu',
          pagesRead: 10,
          bookTitle: 'Sapiens',
          noteSnippet: 'Pemahaman mendalam tentang alam purba.',
        },
        {
          id: 'w-4',
          dateStr: '2026-10-18',
          label: '18 Okt',
          dayName: 'Minggu',
          pagesRead: 22,
          bookTitle: 'Sapiens',
          noteSnippet: 'Revolusi Kognitif dan bahasa fiksi manusia.',
        },
        {
          id: 'w-5',
          dateStr: '2026-10-19',
          label: '19 Okt',
          dayName: 'Senin',
          pagesRead: 28,
          bookTitle: 'Deep Work',
          noteSnippet: 'Fokus intens tanpa interupsi dangkal.',
        },
        {
          id: 'w-6',
          dateStr: '2026-10-20',
          label: '20 Okt',
          dayName: 'Selasa',
          pagesRead: 22,
          bookTitle: 'Atomic Habits',
          noteSnippet: 'Desain lingkungan pemicu kebiasaan baik.',
        },
        {
          id: 'w-7',
          dateStr: '2026-10-21',
          label: '21 Okt (Hari Ini)',
          dayName: 'Rabu',
          pagesRead: 16,
          bookTitle: 'Sapiens',
          noteSnippet: 'Manusia mampu bekerja sama dalam jumlah besar.',
        },
      ];
    } else if (statsTimeframe === 'month') {
      return [
        { id: 'm-1', dateStr: '2026-10-01', label: '1 Okt', dayName: 'Kamis', pagesRead: 14, bookTitle: 'Filosofi Teras' },
        { id: 'm-2', dateStr: '2026-10-04', label: '4 Okt', dayName: 'Minggu', pagesRead: 20, bookTitle: 'Filosofi Teras' },
        { id: 'm-3', dateStr: '2026-10-07', label: '7 Okt', dayName: 'Rabu', pagesRead: 18, bookTitle: 'Show Your Work!' },
        { id: 'm-4', dateStr: '2026-10-10', label: '10 Okt', dayName: 'Sabtu', pagesRead: 25, bookTitle: 'Deep Work' },
        { id: 'm-5', dateStr: '2026-10-12', label: '12 Okt', dayName: 'Senin', pagesRead: 34, bookTitle: 'Sapiens', noteSnippet: 'Puncak membaca sesi Revolusi Kognitif.' },
        { id: 'm-6', dateStr: '2026-10-14', label: '14 Okt', dayName: 'Rabu', pagesRead: 20, bookTitle: 'Sapiens' },
        { id: 'm-7', dateStr: '2026-10-16', label: '16 Okt', dayName: 'Jumat', pagesRead: 30, bookTitle: 'Atomic Habits' },
        { id: 'm-8', dateStr: '2026-10-18', label: '18 Okt', dayName: 'Minggu', pagesRead: 22, bookTitle: 'Sapiens' },
        { id: 'm-9', dateStr: '2026-10-19', label: '19 Okt', dayName: 'Senin', pagesRead: 28, bookTitle: 'Deep Work' },
        { id: 'm-10', dateStr: '2026-10-20', label: '20 Okt', dayName: 'Selasa', pagesRead: 22, bookTitle: 'Atomic Habits' },
        { id: 'm-11', dateStr: '2026-10-21', label: '21 Okt', dayName: 'Rabu', pagesRead: 16, bookTitle: 'Sapiens' },
      ];
    } else if (statsTimeframe === '6months') {
      return [
        { id: 'sm-1', dateStr: '2026-05', label: 'Mei', pagesRead: 120, bookTitle: 'Filosofi Teras', noteSnippet: '120 halaman terselesaikan' },
        { id: 'sm-2', dateStr: '2026-06', label: 'Jun', pagesRead: 165, bookTitle: 'Atomic Habits', noteSnippet: 'Mulai habit loop membaca' },
        { id: 'sm-3', dateStr: '2026-07', label: 'Jul', pagesRead: 210, bookTitle: 'Deep Work', noteSnippet: 'Sesi fokus pagi hari' },
        { id: 'sm-4', dateStr: '2026-08', label: 'Agu', pagesRead: 175, bookTitle: 'Show Your Work!', noteSnippet: 'Mencatat ide kreatif' },
        { id: 'sm-5', dateStr: '2026-09', label: 'Sep', pagesRead: 320, bookTitle: 'Sapiens', noteSnippet: 'Rekor streak terpanjang 32 hari!' },
        { id: 'sm-6', dateStr: '2026-10', label: 'Okt', pagesRead: 249, bookTitle: 'Sapiens & Atomic Habits', noteSnippet: 'Bulan berjalan saat ini' },
      ];
    } else if (statsTimeframe === '1year') {
      return [
        { id: 'y-1', dateStr: '2025-11', label: 'Nov 25', pagesRead: 95, bookTitle: 'Dasar Berpikir Kritis' },
        { id: 'y-2', dateStr: '2025-12', label: 'Des 25', pagesRead: 140, bookTitle: 'Filosofi Teras' },
        { id: 'y-3', dateStr: '2026-01', label: 'Jan 26', pagesRead: 180, bookTitle: 'Atomic Habits' },
        { id: 'y-4', dateStr: '2026-02', label: 'Feb 26', pagesRead: 135, bookTitle: 'Ego Is The Enemy' },
        { id: 'y-5', dateStr: '2026-03', label: 'Mar 26', pagesRead: 160, bookTitle: 'Grit' },
        { id: 'y-6', dateStr: '2026-04', label: 'Apr 26', pagesRead: 145, bookTitle: 'Make Time' },
        { id: 'y-7', dateStr: '2026-05', label: 'Mei 26', pagesRead: 120, bookTitle: 'Filosofi Teras' },
        { id: 'y-8', dateStr: '2026-06', label: 'Jun 26', pagesRead: 165, bookTitle: 'Atomic Habits' },
        { id: 'y-9', dateStr: '2026-07', label: 'Jul 26', pagesRead: 210, bookTitle: 'Deep Work' },
        { id: 'y-10', dateStr: '2026-08', label: 'Agu 26', pagesRead: 175, bookTitle: 'Show Your Work!' },
        { id: 'y-11', dateStr: '2026-09', label: 'Sep 26', pagesRead: 320, bookTitle: 'Sapiens', noteSnippet: 'Bulan puncak 32 hari streak' },
        { id: 'y-12', dateStr: '2026-10', label: 'Okt 26', pagesRead: 249, bookTitle: 'Sapiens & Koleksi' },
      ];
    } else {
      return [
        { id: 'a-1', dateStr: '2025-Q1', label: 'Awal 2025', pagesRead: 240, bookTitle: 'Mulai Kebiasaan Baca' },
        { id: 'a-2', dateStr: '2025-Q2', label: 'Q2 2025', pagesRead: 390, bookTitle: 'Membaca Non-Fiksi' },
        { id: 'a-3', dateStr: '2025-Q3', label: 'Q3 2025', pagesRead: 520, bookTitle: 'Koleksi Produktivitas' },
        { id: 'a-4', dateStr: '2025-Q4', label: 'Akhir 2025', pagesRead: 610, bookTitle: 'Target 5 Buku Selesai' },
        { id: 'a-5', dateStr: '2026-Q1', label: 'Q1 2026', pagesRead: 475, bookTitle: 'Eksplorasi Filosofi' },
        { id: 'a-6', dateStr: '2026-Q2', label: 'Q2 2026', pagesRead: 495, bookTitle: 'Atomic Habits & Mindset' },
        { id: 'a-7', dateStr: '2026-Q3', label: 'Q3 2026', pagesRead: 705, bookTitle: 'Sapiens & Rekor 32 Hari' },
        { id: 'a-8', dateStr: '2026-NOW', label: 'Sekarang', pagesRead: 249, bookTitle: 'mossy learn Track Aktif' },
      ];
    }
  }, [statsTimeframe]);

  // Aggregate statistics for the selected timeframe
  const timeframeTotalPages = useMemo(
    () => activityData.reduce((acc, p) => acc + p.pagesRead, 0),
    [activityData]
  );

  const timeframeAvgDaily = useMemo(() => {
    if (statsTimeframe === 'week') {
      return Math.round(timeframeTotalPages / 7);
    } else if (statsTimeframe === 'month') {
      const dayOfMonth = new Date().getDate() || 21;
      return Math.round(timeframeTotalPages / dayOfMonth);
    } else if (statsTimeframe === '6months') {
      return Math.round(timeframeTotalPages / 6);
    } else if (statsTimeframe === '1year') {
      return Math.round(timeframeTotalPages / 12);
    } else {
      return Math.round(timeframeTotalPages / Math.max(1, activityData.length));
    }
  }, [timeframeTotalPages, statsTimeframe, activityData.length]);

  const peakPoint = useMemo(() => {
    return activityData.reduce((prev, curr) =>
      curr.pagesRead > prev.pagesRead ? curr : prev,
      activityData[0]
    );
  }, [activityData]);

  // Active highlighted point
  const activePointIndex = hoveredPointIndex !== null ? hoveredPointIndex : activityData.indexOf(peakPoint);
  const activePoint = activityData[activePointIndex] || activityData[0];

  // SVG Chart Geometry
  const svgWidth = 600;
  const svgHeight = 180;
  const padLeft = 45;
  const padRight = 555;
  const padTop = 45;
  const padBottom = 150;

  const maxVal = Math.max(...activityData.map((d) => d.pagesRead), 10);

  // Compute (x, y) coordinates for all points
  const points = useMemo(() => {
    const len = activityData.length;
    return activityData.map((d, i) => {
      const x = padLeft + (i / Math.max(1, len - 1)) * (padRight - padLeft);
      const ratio = d.pagesRead / maxVal;
      const y = padBottom - ratio * (padBottom - padTop);
      return { x, y, data: d, index: i };
    });
  }, [activityData, maxVal]);

  // Build SVG smooth bezier curve
  const { pathD, areaD } = useMemo(() => {
    if (points.length < 2) return { pathD: '', areaD: '' };
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const mx = (curr.x + next.x) / 2;
      d += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
    }
    const area = `${d} L ${points[points.length - 1].x} ${padBottom} L ${points[0].x} ${padBottom} Z`;
    return { pathD: d, areaD: area };
  }, [points]);

  const activeCoord = points[activePointIndex] || points[0];

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-6 md:py-10 animate-fadeIn">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between mb-8 md:mb-10">
        <button
          onClick={() => {
            if (selectedBookId) {
              setSelectedBookId(null);
            } else {
              onBack();
            }
          }}
          className="group flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 hover:text-black hover:border-neutral-400 shadow-xs transition-all duration-200 cursor-pointer"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-[#3A5A40]" />
          <span className="font-mono text-xs font-semibold tracking-tight">
            {selectedBookId ? 'Kembali ke Notes' : 'Back'}
          </span>
        </button>

        {/* Top Switcher: Notes vs Stats */}
        {!selectedBookId && (
          <div className="flex items-center p-1 rounded-2xl border border-[#A3B18A]/35 bg-[#E8EFE9]/50 shadow-2xs">
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-[#3A5A40] text-white shadow-xs'
                  : 'text-neutral-700 hover:text-[#3A5A40]'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Notes</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-[#3A5A40] text-white shadow-xs'
                  : 'text-neutral-700 hover:text-[#3A5A40]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Stats.</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {selectedBookId && currentBook ? (
          /* =========================================================================
             VIEW 3: DETAIL CATATAN BUKU (Latar #F4F6F4, Latar Catatan Krem #FAF6EE)
             ========================================================================= */
          <motion.div
            key="book-note-detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-2xl mx-auto"
          >
            {/* Main Card with #997950 background as requested */}
            <div className="relative rounded-[2.25rem] p-7 sm:p-9 md:p-10 border border-[#7e613c] bg-[#997950] text-white shadow-md">
              {/* Top Row: Judul Buku di kiri, Ikon/Sampul Buku di kanan (sesuai Your Book) */}
              <div className="flex items-start justify-between gap-4 pb-6 border-b border-white/20">
                <div className="min-w-0 flex-1">
                  <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white font-sans leading-tight">
                    {currentBook.title}.
                  </h2>
                  {currentBook.author && (
                    <p className="text-xs font-mono text-amber-100/85 mt-1">
                      {currentBook.author}
                    </p>
                  )}
                </div>

                {/* Ikon Sampul Buku sesuai Your Book */}
                {currentBook.coverImage ? (
                  <div className="w-16 h-24 shrink-0 rounded-2xl overflow-hidden border border-white/30 shadow-sm bg-black/20">
                    <img
                      src={currentBook.coverImage}
                      alt={currentBook.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-24 shrink-0 rounded-2xl border border-white/25 bg-black/25 text-amber-100 flex flex-col items-center justify-center shadow-xs select-none p-1.5 text-center">
                    <BookOpen className="w-5 h-5 mb-1 text-amber-200" />
                    <span className="text-[10px] font-mono font-semibold truncate max-w-[54px] text-white">
                      {currentBook.title.slice(0, 5)}
                    </span>
                    <span className="text-[8px] font-mono tracking-widest uppercase opacity-70 mt-0.5 text-amber-100">
                      Buku
                    </span>
                  </div>
                )}
              </div>

              {currentNotes.length > 0 && currentNote ? (
                <>
                  {/* Row: Tanggal dan Halaman (tanpa tulisan "Gulir") */}
                  <div className="mt-6 mb-3 flex items-center justify-between flex-wrap gap-2">
                    <button
                      onClick={() => setIsDatePickerOpen(true)}
                      className="group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-white/25 hover:border-white/50 bg-black/20 hover:bg-black/30 text-white transition-all cursor-pointer shadow-2xs"
                      title="Pencet untuk atur tanggal yang pernah ditrack"
                    >
                      <Calendar className="w-4 h-4 text-amber-200 transition-colors" />
                      <div className="font-mono text-sm md:text-base font-semibold tracking-tight text-white flex items-center gap-2">
                        <span>{currentNote.date}</span>
                        <span className="text-white/40 font-normal">|</span>
                        <span className="text-amber-200">
                          {currentNote.fromPage} - {currentNote.toPage}
                        </span>
                      </div>
                    </button>

                    {/* Stepper between dates if multiple notes exist */}
                    {currentNotes.length > 1 && (
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <button
                          onClick={() =>
                            setSelectedNoteIndex((prev) =>
                              prev > 0 ? prev - 1 : currentNotes.length - 1
                            )
                          }
                          className="p-2 rounded-xl border border-white/25 bg-black/20 hover:bg-black/30 text-white cursor-pointer transition-colors"
                          title="Catatan Sebelumnya"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[11px] text-amber-100/90 px-1 font-semibold">
                          {selectedNoteIndex + 1} / {currentNotes.length}
                        </span>
                        <button
                          onClick={() =>
                            setSelectedNoteIndex((prev) =>
                              prev < currentNotes.length - 1 ? prev + 1 : 0
                            )
                          }
                          className="p-2 rounded-xl border border-white/25 bg-black/20 hover:bg-black/30 text-white cursor-pointer transition-colors"
                          title="Catatan Selanjutnya"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Catatan Card: Latar #997950 bahkan di bagian dalamnya & Teks Krem #FAF6EE Lembaran Buku */}
                  <div
                    onClick={() => setIsExpandedNoteOpen(true)}
                    className="mt-3 p-5 sm:p-6 rounded-2xl bg-[#997950] border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer relative group shadow-inner overflow-hidden"
                    title="Perbesar catatan ini"
                  >
                    {/* Header bar di dalam lembaran catatan */}
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/15">
                      <div className="flex items-center gap-2">
                        <FileEdit className="w-4 h-4 text-amber-200 stroke-[2]" />
                        <span className="text-xs font-semibold tracking-tight text-white font-sans">
                          Catatan
                        </span>
                        <span className="text-[10px] font-mono text-amber-100/60">·</span>
                        <span className="text-[10px] font-mono text-amber-100/80">
                          {currentNote.content.split(/\s+/).filter(Boolean).length} kata
                        </span>
                      </div>

                      {/* Tombol Perbesar Catatan */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExpandedNoteOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-mono font-semibold bg-black/25 border border-white/25 text-amber-100 hover:bg-black/40 hover:text-white transition-all shadow-2xs cursor-pointer"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Perbesar Catatan</span>
                      </button>
                    </div>

                    {/* Note text: warna krem lembaran buku (#FAF6EE) sesuai permintaan */}
                    <p className="whitespace-pre-wrap line-clamp-3 sm:line-clamp-4 leading-relaxed text-xs sm:text-sm text-[#FAF6EE] font-sans selection:bg-[#3B270C] selection:text-white">
                      {currentNote.content}
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-amber-100/90">
                  <FileEdit className="w-8 h-8 mx-auto mb-2 opacity-80 text-amber-200" />
                  <p className="text-xs font-semibold text-white">Belum Ada Catatan untuk Buku Ini.</p>
                  <p className="text-[11px] mt-1 text-amber-100/80">
                    Track halaman di Progres atau klik tombol di bawah untuk menulis catatan pertama.
                  </p>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="mt-8 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => setIsNewNoteModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-black/30 hover:bg-black/45 border border-white/25 text-white text-xs font-mono font-semibold transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Catatan untuk Buku Ini</span>
                </button>

                <button
                  onClick={() => setSelectedBookId(null)}
                  className="w-full sm:w-auto text-xs font-mono text-amber-100/80 hover:text-white transition-colors cursor-pointer"
                >
                  Lihat Semua Buku
                </button>
              </div>
            </div>

            {/* Date Scroll Picker Modal */}
            <NoteDateScrollPickerModal
              notes={currentNotes}
              currentNoteId={currentNote?.id || ''}
              bookTitle={currentBook.title}
              isOpen={isDatePickerOpen}
              onClose={() => setIsDatePickerOpen(false)}
              onSelectNote={(note) => {
                const idx = currentNotes.findIndex((n) => n.id === note.id);
                if (idx >= 0) setSelectedNoteIndex(idx);
              }}
            />
          </motion.div>
        ) : activeTab === 'notes' ? (
          /* =========================================================================
             VIEW 2: GRID BUKU DI BAGIAN NOTES (Latar #F4F6F4)
             ========================================================================= */
          <motion.div
            key="notes-grid"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {/* Title: Notes */}
            <div className="mb-8 md:mb-10 text-left flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-neutral-950 font-sans">
                  Notes
                </h1>
                <p className="text-xs text-neutral-500 font-mono mt-1">
                  Pilih buku untuk melihat catatan dan riwayat tanggal baca
                </p>
              </div>

              {/* Total Books with Notes Badge */}
              <div className="font-mono text-xs px-3 py-1.5 rounded-2xl border border-[#A3B18A]/35 bg-[#E8EFE9]/60 text-[#3A5A40] shadow-xs">
                <span className="text-neutral-600 font-medium">Total: </span>
                <span className="font-bold">{booksWithNotes.length} Buku</span>
              </div>
            </div>

            {/* Grid of Books with Book Icon matching Your Book and #997950 background */}
            {booksWithNotes.length === 0 ? (
              <div className="py-16 px-6 rounded-3xl border border-[#7e613c] bg-[#997950] text-white text-center shadow-sm">
                <FileEdit className="w-10 h-10 mx-auto mb-3 text-amber-200" />
                <h3 className="text-sm font-semibold text-white">
                  Belum Ada Catatan Tersimpan
                </h3>
                <p className="text-xs text-amber-100/85 max-w-md mx-auto mt-1 leading-relaxed">
                  Saat Anda melakukan update halaman di menu <strong>Library → Progres</strong>, Anda dapat mengisi catatan refleksi yang otomatis tersimpan di sini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
                {booksWithNotes.map((book) => {
                  const noteCount = book.readingNotes?.length || 0;
                  const latestNote = book.readingNotes?.[0];

                  return (
                    <motion.div
                      key={book.id}
                      whileHover={{ y: -6, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectBook(book.id)}
                      className="group p-5 md:p-6 rounded-[2rem] border border-[#7e613c] hover:border-white/40 bg-[#997950] hover:bg-[#8f7048] shadow-[0_4px_16px_rgba(153,121,80,0.18)] hover:shadow-[0_12px_28px_rgba(153,121,80,0.28)] cursor-pointer flex flex-col justify-between select-none transition-all duration-300 min-h-[200px]"
                    >
                      {/* Top: Book Cover / Icon matching Your Book */}
                      <div className="flex items-start justify-between w-full">
                        {book.coverImage ? (
                          <div className="w-14 h-20 shrink-0 rounded-xl overflow-hidden border border-white/25 shadow-xs bg-black/20 group-hover:scale-105 transition-transform">
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-20 shrink-0 rounded-xl border border-white/20 bg-black/25 text-amber-100 flex flex-col items-center justify-center text-center p-1.5 font-mono text-[10px] shadow-2xs group-hover:scale-105 transition-transform select-none">
                            <BookOpen className="w-4 h-4 mb-1 text-amber-200" />
                            <span className="truncate max-w-[48px] font-semibold text-white">
                              {book.title.slice(0, 4)}
                            </span>
                          </div>
                        )}

                        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-white/20 bg-black/20 text-white">
                          {noteCount} Catatan
                        </span>
                      </div>

                      {/* Middle: Judul Buku */}
                      <div className="my-3">
                        <h3 className="text-base font-semibold text-white truncate group-hover:text-amber-100 transition-colors">
                          {book.title}
                        </h3>
                        {book.author && (
                          <p className="text-xs text-amber-100/80 truncate mt-0.5">
                            {book.author}
                          </p>
                        )}
                      </div>

                      {/* Bottom: Latest Date & Page info */}
                      <div className="pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] font-mono text-amber-100/90">
                        <span>{latestNote ? latestNote.date : 'Belum Ada'}</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-white" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Other books list without notes */}
            {books.filter((b) => !b.readingNotes || b.readingNotes.length === 0).length > 0 && (
              <div className="mt-12 pt-8 border-t border-[#A3B18A]/25">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-500 mb-4 font-medium">
                  Buku Lain yang Belum Memiliki Catatan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {books
                    .filter((b) => !b.readingNotes || b.readingNotes.length === 0)
                    .map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleSelectBook(b.id)}
                        className="p-3 rounded-2xl border border-[#7e613c] bg-[#997950] hover:bg-[#8f7048] text-left flex items-center justify-between text-xs cursor-pointer shadow-2xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {b.coverImage ? (
                            <img
                              src={b.coverImage}
                              alt={b.title}
                              className="w-8 h-11 object-cover rounded-md border border-white/20 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-11 rounded-md bg-black/25 text-amber-200 flex items-center justify-center shrink-0">
                              <BookOpen className="w-3.5 h-3.5 text-amber-200" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{b.title}</p>
                            <p className="text-[11px] text-amber-100/80 truncate">{b.author || 'Penulis'}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-white font-semibold px-2 py-0.5 rounded-lg bg-black/25 border border-white/20 shrink-0">
                          + Tulis
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* =========================================================================
             VIEW 4: STATISTIK MEMBACA & GRAFIK (Latar #F4F6F4, "Halaman", dsb.)
             ========================================================================= */
          <motion.div
            key="stats-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {/* Header Title & Timeframe Selector */}
            <div className="mb-6 md:mb-8 text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-neutral-950 font-sans">
                  Stats
                </h1>
                <p className="text-xs text-neutral-500 font-mono mt-1">
                  Statistik track bacaan dan aktivitas halaman yang dibaca
                </p>
              </div>

              {/* 5-Option Timeframe Filter */}
              <div className="flex items-center p-1 rounded-2xl border border-[#A3B18A]/35 bg-[#E8EFE9]/60 shadow-2xs overflow-x-auto no-scrollbar">
                {[
                  { key: 'week' as StatsTimeframe, label: 'Minggu Ini' },
                  { key: 'month' as StatsTimeframe, label: 'Bulan Ini' },
                  { key: '6months' as StatsTimeframe, label: '6 Bulan' },
                  { key: '1year' as StatsTimeframe, label: '1 Tahun' },
                  { key: 'all' as StatsTimeframe, label: 'All Time' },
                ].map((tf) => {
                  const isSelected = statsTimeframe === tf.key;
                  return (
                    <button
                      key={tf.key}
                      onClick={() => {
                        setStatsTimeframe(tf.key);
                        setHoveredPointIndex(null);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#3A5A40] text-white font-semibold shadow-xs'
                          : 'text-neutral-700 hover:text-black hover:bg-white/60'
                      }`}
                    >
                      {tf.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metric Summary Cards (Latar #F4F6F4, Font Sentence-case as requested) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
              <div className="p-4 sm:p-5 rounded-2xl border border-[#A3B18A]/35 bg-[#F4F6F4] shadow-xs">
                <span className="text-xs font-mono font-medium text-neutral-600 block mb-1">
                  Halaman bertambah
                </span>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-neutral-950">
                  +{timeframeTotalPages}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 block mt-0.5">
                  {statsTimeframe === 'week' ? 'Minggu ini' : statsTimeframe === 'month' ? 'Bulan ini' : 'Periode ini'}
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl border border-[#A3B18A]/35 bg-[#F4F6F4] shadow-xs">
                <span className="text-xs font-mono font-medium text-neutral-600 block mb-1">
                  Rata-rata halaman
                </span>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-neutral-950">
                  {timeframeAvgDaily}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 block mt-0.5">
                  {statsTimeframe === 'week' ? 'hlm / hari (Minggu ini)' : statsTimeframe === 'month' ? 'hlm / hari (Bulan ini)' : statsTimeframe === '6months' ? 'hlm / bulan (6 Bulan)' : statsTimeframe === '1year' ? 'hlm / bulan (1 Tahun)' : 'hlm / periode'}
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl border border-[#A3B18A]/35 bg-[#F4F6F4] shadow-xs">
                <span className="text-xs font-mono font-semibold text-[#3A5A40] block mb-1">
                  Peak Reading!
                </span>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-[#3A5A40]">
                  +{peakPoint?.pagesRead || 0}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 block mt-0.5 truncate">
                  {peakPoint?.label || '-'}
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl border border-[#A3B18A]/35 bg-[#F4F6F4] shadow-xs">
                <span className="text-xs font-mono font-medium text-neutral-600 block mb-1">
                  Total buku selesai
                </span>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-neutral-950">
                  {completedBooksCount}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 block mt-0.5">
                  dari {books.length} buku
                </span>
              </div>
            </div>

            {/* Main Interactive Curve Chart Card (Latar #F4F6F4) */}
            <div className="p-6 md:p-8 rounded-[2.25rem] border border-[#A3B18A]/35 bg-[#F4F6F4] shadow-sm mb-8">
              {/* Chart Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#A3B18A]/20">
                <div>
                  <h3 className="text-base font-semibold text-neutral-950 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#3A5A40]" />
                    <span>Kurva Aktivitas Halaman Membaca</span>
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">
                    Sentuh atau arahkan mouse pada titik kurva untuk melihat jumlah halaman
                  </p>
                </div>

                {/* Deskripsi status aktif dekat kurva */}
                <div className="px-3.5 py-1.5 rounded-xl border border-[#A3B18A]/30 bg-white text-xs font-mono flex items-center gap-2 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#3A5A40]" />
                  <span className="text-neutral-500">Terpilih:</span>
                  <span className="font-bold text-[#3A5A40]">
                    +{activePoint?.pagesRead} Halaman
                  </span>
                  <span className="text-neutral-400">({activePoint?.label})</span>
                </div>
              </div>

              {/* Responsive SVG Chart with Moss Green Curve */}
              <div className="w-full h-56 md:h-64 relative flex items-center justify-center pt-2 pb-2">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3A5A40" stopOpacity="0.20" />
                      <stop offset="100%" stopColor="#3A5A40" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="30" y1="45" x2="570" y2="45" stroke="#e6eae6" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="30" y1="80" x2="570" y2="80" stroke="#e6eae6" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="30" y1="115" x2="570" y2="115" stroke="#e6eae6" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="30" y1={padBottom} x2="570" y2={padBottom} stroke="#d1dbd1" strokeWidth="1.2" />

                  {/* Area fill under curve */}
                  {areaD && <path d={areaD} fill="url(#curveGradient)" />}

                  {/* Main Smooth Bezier Curve Line with #3A5A40 Moss Green */}
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#3A5A40"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Vertical Guideline to Active/Hovered Point */}
                  {activeCoord && (
                    <line
                      x1={activeCoord.x}
                      y1={padTop - 10}
                      x2={activeCoord.x}
                      y2={padBottom}
                      stroke="#4F6F52"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* All Points along the curve */}
                  {points.map((p) => {
                    const isActive = p.index === activePointIndex;

                    return (
                      <g key={p.data.id} className="cursor-pointer">
                        {/* Invisible larger hit area for easy hover/tap */}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="16"
                          fill="transparent"
                          onMouseEnter={() => setHoveredPointIndex(p.index)}
                          onClick={() => setHoveredPointIndex(p.index)}
                        />

                        {/* Outer Pulse Halo for active point */}
                        {isActive && (
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="9"
                            fill="#3A5A40"
                            fillOpacity="0.22"
                          />
                        )}

                        {/* Visible node circle */}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isActive ? 5.5 : 4}
                          fill={isActive ? '#3A5A40' : '#ffffff'}
                          stroke="#3A5A40"
                          strokeWidth={isActive ? '3' : '2'}
                          onMouseEnter={() => setHoveredPointIndex(p.index)}
                          onClick={() => setHoveredPointIndex(p.index)}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Deskripsi berapa halaman di dekat garis kurva (hanya bilang "Halaman") */}
                {activeCoord && (
                  <motion.div
                    key={activePoint.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      left: `${(activeCoord.x / svgWidth) * 100}%`,
                      top: `${(activeCoord.y / svgHeight) * 100}%`,
                      transform: 'translate(-50%, -125%)',
                    }}
                    className="pointer-events-none z-20 flex flex-col items-center"
                  >
                    <div className="bg-[#3A5A40] text-white px-3.5 py-1.5 rounded-xl shadow-xl text-center border border-[#4F6F52] whitespace-nowrap">
                      <div className="text-xs font-mono font-bold tracking-tight text-[#E8EFE9]">
                        +{activePoint.pagesRead} Halaman
                      </div>
                      <div className="text-[10px] font-mono text-white/80 mt-0.5">
                        {activePoint.label} · {activePoint.bookTitle}
                      </div>
                    </div>
                    {/* Arrow */}
                    <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#3A5A40] -mt-px" />
                  </motion.div>
                )}
              </div>

              {/* X Axis Date Labels */}
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-[#A3B18A]/20 px-1 overflow-x-auto no-scrollbar">
                {activityData.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => setHoveredPointIndex(i)}
                    className={`transition-colors cursor-pointer px-1 py-0.5 rounded ${
                      i === activePointIndex
                        ? 'text-[#3A5A40] font-bold bg-[#E8EFE9]'
                        : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Daily Activity Breakdown List for Selected Timeframe */}
            <div className="p-6 md:p-8 rounded-[2.25rem] border border-[#A3B18A]/35 bg-[#F4F6F4] shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h4 className="text-base font-semibold text-neutral-950">
                    Aktivitas Membaca Harian
                  </h4>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">
                    Rincian halaman yang dibaca pada periode ini
                  </p>
                </div>

                <div className="text-xs font-mono text-[#3A5A40] font-semibold px-3 py-1 rounded-xl bg-white border border-[#A3B18A]/30 shadow-2xs">
                  {activityData.length} Catatan Tanggal
                </div>
              </div>

              <div className="space-y-3">
                {activityData.map((item, idx) => {
                  const isHovered = idx === activePointIndex;
                  const ratio = Math.min(100, Math.round((item.pagesRead / maxVal) * 100));

                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      onClick={() => setHoveredPointIndex(idx)}
                      className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                        isHovered
                          ? 'border-[#3A5A40] bg-white shadow-xs'
                          : 'border-neutral-200/80 hover:border-[#A3B18A] bg-white/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                              isHovered
                                ? 'bg-[#3A5A40] text-white'
                                : 'bg-[#E8EFE9] text-[#3A5A40]'
                            }`}
                          >
                            {item.dayName ? item.dayName.slice(0, 3) : item.label.slice(0, 3)}
                          </div>

                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-neutral-900 truncate block">
                              {item.bookTitle}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500">
                              {item.label} {item.dayName ? `· ${item.dayName}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Description of added pages in bold (hanya bilang Halaman) */}
                        <div className="text-right shrink-0">
                          <span className="text-sm font-mono font-bold text-[#3A5A40] block">
                            +{item.pagesRead} Halaman
                          </span>
                        </div>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full h-1.5 rounded-full bg-neutral-200/70 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isHovered ? 'bg-[#3A5A40]' : 'bg-[#A3B18A]'
                          }`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>

                      {/* Optional note reflection snippet */}
                      {item.noteSnippet && (
                        <p className="mt-2 text-xs text-neutral-600 font-sans italic line-clamp-1 border-t border-neutral-100 pt-1.5">
                          "{item.noteSnippet}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
         MODAL PERBESAR CATATAN (TAMPILAN LUAS)
         - Latar Catatan Krem #FAF6EE Lembaran Buku
         - Tanpa tulisan "Est. ~X mnt baca"
         ========================================================================= */}
      <AnimatePresence>
        {isExpandedNoteOpen && currentBook && currentNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-3xl rounded-[2.5rem] p-7 sm:p-9 md:p-11 border border-[#7e613c] bg-[#997950] text-white shadow-2xl max-h-[92vh] flex flex-col justify-between overflow-hidden"
            >
              {/* Header bar of expanded view */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/20 shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-3 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-black/25 text-white border border-white/20">
                      Catatan
                    </span>
                    <span className="text-[11px] font-mono text-white/40">·</span>
                    <span className="text-[11px] font-mono text-amber-100/90 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-200" />
                      {currentNote.date}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans truncate">
                    {currentBook.title}
                  </h2>

                  <div className="flex items-center gap-2 text-xs font-mono text-amber-100/80 mt-1 flex-wrap">
                    <span>{currentBook.author || 'Penulis'}</span>
                    <span>·</span>
                    <span className="font-semibold text-white">
                      Halaman {currentNote.fromPage} - {currentNote.toPage}
                    </span>
                    <span>·</span>
                    <span className="text-amber-200 font-semibold">
                      +{currentNote.toPage - currentNote.fromPage} Halaman
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyNote}
                    className="p-2.5 rounded-2xl border border-white/25 bg-black/20 hover:bg-black/30 text-white transition-colors cursor-pointer shadow-2xs"
                    title="Salin Catatan"
                  >
                    {copiedNote ? (
                      <Check className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => setIsExpandedNoteOpen(false)}
                    className="p-2.5 rounded-2xl border border-white/25 bg-black/20 hover:bg-black/30 text-white transition-colors cursor-pointer shadow-2xs"
                    title="Tutup Tampilan Luas"
                    aria-label="Tutup"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Spacious Note Content Area with #997950 background & Krem #FAF6EE Lembaran Buku Text */}
              <div className="flex-1 overflow-y-auto py-6 sm:py-8 px-6 sm:px-8 rounded-2xl bg-[#997950] border border-white/20 my-3 shadow-inner">
                <p className="text-base sm:text-lg md:text-xl font-sans leading-relaxed md:leading-loose text-[#FAF6EE] whitespace-pre-wrap select-text selection:bg-[#3B270C] selection:text-white">
                  {currentNote.content}
                </p>
              </div>

              {/* Footer info in expanded view */}
              <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs font-mono text-amber-100/80 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{currentNote.content.split(/\s+/).filter(Boolean).length} kata</span>
                  <span>·</span>
                  <span>{currentBook.title}</span>
                </div>

                <button
                  onClick={() => setIsExpandedNoteOpen(false)}
                  className="px-5 py-2 rounded-xl bg-black/30 hover:bg-black/45 border border-white/25 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Tambah Catatan Baru Langsung */}
      <AnimatePresence>
        {isNewNoteModalOpen && currentBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-md rounded-[2.25rem] p-6 sm:p-8 border border-[#7e613c] bg-[#997950] text-white shadow-2xl">
              <button
                onClick={() => setIsNewNoteModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full border border-white/25 text-white/80 hover:text-white hover:bg-black/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-5">
                <h3 className="text-xl font-semibold tracking-tight text-white">
                  + Tambah Catatan Bacaan
                </h3>
                <p className="text-xs text-amber-100/80 mt-0.5">
                  Untuk buku <strong className="text-white">{currentBook.title}</strong>
                </p>
              </div>

              <form onSubmit={handleSaveNewNote} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-amber-100/90 block mb-1">
                      Dari Halaman
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder={String(currentBook.currentPage || 0)}
                      value={newNoteFromPage}
                      onChange={(e) => setNewNoteFromPage(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-white/25 bg-black/25 text-white placeholder-white/50 outline-none focus:border-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-amber-100/90 block mb-1">
                      Sampai Halaman
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder={String((currentBook.currentPage || 0) + 5)}
                      value={newNoteToPage}
                      onChange={(e) => setNewNoteToPage(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-white/25 bg-black/25 text-white placeholder-white/50 outline-none focus:border-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-amber-100/90 block mb-1">
                    Isi Catatan *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Tulis catatan atau kutipan dari buku ini..."
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-white/25 bg-[#997950] text-[#FAF6EE] placeholder-amber-100/60 outline-none focus:border-white leading-relaxed shadow-inner selection:bg-[#3B270C] selection:text-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl text-xs font-semibold font-mono tracking-wide bg-black/35 hover:bg-black/50 border border-white/25 text-white cursor-pointer transition-colors shadow-md"
                  >
                    Simpan Catatan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
