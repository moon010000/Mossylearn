import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { BookItem } from '../types.ts';

interface ProgressScrollPickerModalProps {
  book: BookItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveProgress: (bookId: string, newPage: number, noteContent?: string, fromPage?: number) => void;
  isDarkMode?: boolean;
}

export const ProgressScrollPickerModal: React.FC<ProgressScrollPickerModalProps> = ({
  book,
  isOpen,
  onClose,
  onSaveProgress,
  isDarkMode = false,
}) => {
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [initialPage, setInitialPage] = useState<number>(0);
  const [noteText, setNoteText] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 44; // height of each number item in px

  useEffect(() => {
    if (book) {
      const cur = book.currentPage || 0;
      setSelectedPage(cur);
      setInitialPage(cur);
      setNoteText('');
    }
  }, [book, isOpen]);

  // Center the selected number in the scroll container
  useEffect(() => {
    if (isOpen && containerRef.current && book) {
      const scrollPos = (book.currentPage || 0) * itemHeight;
      containerRef.current.scrollTop = scrollPos;
    }
  }, [isOpen, book]);

  if (!isOpen || !book) return null;

  const total = book.totalPages || 200;
  // Generate all page numbers [0, 1, 2, ..., total]
  const pages = Array.from({ length: total + 1 }, (_, i) => i);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(total, index));
    if (clampedIndex !== selectedPage) {
      setSelectedPage(clampedIndex);
    }
  };

  const scrollToPage = (page: number) => {
    const target = Math.max(0, Math.min(total, page));
    setSelectedPage(target);
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: target * itemHeight,
        behavior: 'smooth',
      });
    }
  };

  const handleConfirm = () => {
    onSaveProgress(book.id, selectedPage, noteText.trim() ? noteText.trim() : undefined, initialPage);
    onClose();
  };

  const pageLeft = Math.max(0, total - selectedPage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.25 }}
        className={`relative w-full max-w-sm rounded-[2.25rem] p-6 sm:p-7 border shadow-2xl flex flex-col items-center select-none ${
          isDarkMode
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-2 rounded-full border transition-colors cursor-pointer ${
            isDarkMode
              ? 'border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
              : 'border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title & Info */}
        <div className="text-center mb-4 max-w-[240px]">
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-50 block mb-1">
            Update Progres Membaca
          </span>
          <h3 className="text-base font-semibold truncate leading-tight">
            {book.title}
          </h3>
          <p className="text-xs font-mono opacity-60 mt-0.5">
            Total {total} Halaman
          </p>
        </div>

        {/* Quick Stepper Up */}
        <button
          onClick={() => scrollToPage(selectedPage - 1)}
          disabled={selectedPage <= 0}
          className={`p-1.5 rounded-full border transition-colors cursor-pointer mb-2 disabled:opacity-20 ${
            isDarkMode ? 'border-neutral-800 hover:bg-neutral-800' : 'border-neutral-200 hover:bg-neutral-100'
          }`}
          aria-label="Halaman Sebelumnya"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        {/* Wheel / Drum Scroll View with Blur Effect */}
        <div className="relative w-full max-w-[200px] h-[220px] my-1 flex items-center justify-center overflow-hidden">
          {/* Top & Bottom Blur Gradient overlays */}
          <div
            className={`pointer-events-none absolute top-0 left-0 right-0 h-16 z-10 backdrop-blur-[2px] ${
              isDarkMode
                ? 'bg-gradient-to-b from-neutral-900 via-neutral-900/80 to-transparent'
                : 'bg-gradient-to-b from-white via-white/80 to-transparent'
            }`}
          />
          <div
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-16 z-10 backdrop-blur-[2px] ${
              isDarkMode
                ? 'bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-transparent'
                : 'bg-gradient-to-t from-white via-white/80 to-transparent'
            }`}
          />

          {/* Active Center Target Highlight Frame */}
          <div
            className={`pointer-events-none absolute left-0 right-0 h-[44px] rounded-2xl border z-5 transition-colors ${
              isDarkMode
                ? 'border-neutral-700 bg-neutral-800/40 shadow-[0_0_15px_rgba(255,255,255,0.03)]'
                : 'border-neutral-300 bg-neutral-100/70 shadow-xs'
            }`}
          />

          {/* Scrollable list */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
            style={{
              paddingTop: '88px', // offset 2 slots
              paddingBottom: '88px', // offset 2 slots
            }}
          >
            {pages.map((p) => {
              const diff = Math.abs(p - selectedPage);
              let visualClasses = '';

              if (diff === 0) {
                // Angka saat ini: jelas, tegas, kontras tinggi
                visualClasses = isDarkMode
                  ? 'text-white text-2xl font-bold opacity-100 scale-110'
                  : 'text-neutral-900 text-2xl font-bold opacity-100 scale-110';
              } else if (diff === 1) {
                // 1 angka sebelumnya / sesudahnya: sedikit blur & transparan
                visualClasses = isDarkMode
                  ? 'text-neutral-400 text-lg font-medium opacity-50 blur-[0.6px] scale-95'
                  : 'text-neutral-600 text-lg font-medium opacity-50 blur-[0.6px] scale-95';
              } else {
                // 2+ angka: sangat blur & redup
                visualClasses = isDarkMode
                  ? 'text-neutral-600 text-sm font-normal opacity-25 blur-[1.5px] scale-90'
                  : 'text-neutral-400 text-sm font-normal opacity-25 blur-[1.5px] scale-90';
              }

              return (
                <div
                  key={p}
                  onClick={() => scrollToPage(p)}
                  className={`h-[44px] flex items-center justify-center font-mono cursor-pointer snap-center transition-all duration-150 ${visualClasses}`}
                >
                  {p}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stepper Down */}
        <button
          onClick={() => scrollToPage(selectedPage + 1)}
          disabled={selectedPage >= total}
          className={`p-1.5 rounded-full border transition-colors cursor-pointer mt-2 disabled:opacity-20 ${
            isDarkMode ? 'border-neutral-800 hover:bg-neutral-800' : 'border-neutral-200 hover:bg-neutral-100'
          }`}
          aria-label="Halaman Selanjutnya"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Dynamic Status Text: e.g. Halaman 99/120 · 21 Page Left */}
        <div className="text-center my-2">
          <div className="font-mono text-xs font-semibold tracking-tight">
            Halaman {selectedPage}/{total}
          </div>
          <div className="text-[11px] font-mono opacity-60 mt-0.5">
            {pageLeft === 0 ? 'Buku Selesai Dibaca!' : `${pageLeft} Page Left`}
          </div>
        </div>

        {/* Rentang Halaman Tracking Info */}
        <div className="w-full mt-2 px-3.5 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-center font-mono text-[11px]">
          <span className="text-neutral-500">Rentang Baca: </span>
          <span className="font-semibold text-neutral-900">
            Halaman {initialPage} → {selectedPage}
          </span>
          <span className="text-neutral-500 ml-1">
            ({selectedPage - initialPage >= 0 ? `+${selectedPage - initialPage}` : selectedPage - initialPage} hlm)
          </span>
        </div>

        {/* Fitur Tambahkan Catatan (Disimpan ke Notes) */}
        <div className="w-full mt-3 text-left">
          <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1 font-medium">
            Tambahkan Catatan (Notes)
          </label>
          <textarea
            rows={2}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Catatan dari halaman ini... (Akan tersimpan ke fitur Notes)"
            className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white outline-none transition-colors"
          />
        </div>

        {/* Aesthetic Checkmark Button to Save Progress as requested */}
        <div className="mt-3.5 w-full flex justify-center">
          <button
            onClick={handleConfirm}
            className={`group w-full flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl font-mono text-xs font-semibold tracking-wide border cursor-pointer transition-all duration-200 ${
              isDarkMode
                ? 'bg-white hover:bg-neutral-200 text-black border-white shadow-[0_4px_20px_rgba(255,255,255,0.15)]'
                : 'bg-[#3A5A40] hover:bg-[#2D4632] text-white border-[#3A5A40] shadow-md'
            }`}
            title="Simpan Progres Halaman & Catatan"
          >
            {/* Aesthetic Checkmark Icon */}
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-white text-[#3A5A40]">
              <Check className={`w-3.5 h-3.5 stroke-[3] ${isDarkMode ? 'text-white' : 'text-[#3A5A40]'}`} />
            </div>
            <span>Simpan Progres ({selectedPage} hlm)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
