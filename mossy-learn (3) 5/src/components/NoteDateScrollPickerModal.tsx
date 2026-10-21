import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Check, ChevronUp, ChevronDown, Calendar, BookOpen } from 'lucide-react';
import { ReadingNoteEntry } from '../types.ts';

interface NoteDateScrollPickerModalProps {
  notes: ReadingNoteEntry[];
  currentNoteId: string;
  bookTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (note: ReadingNoteEntry) => void;
}

export const NoteDateScrollPickerModal: React.FC<NoteDateScrollPickerModalProps> = ({
  notes,
  currentNoteId,
  bookTitle,
  isOpen,
  onClose,
  onSelectNote,
}) => {
  // Sort notes newest to oldest or chronological
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 52; // height of each date item in px

  useEffect(() => {
    if (notes.length > 0) {
      const idx = notes.findIndex((n) => n.id === currentNoteId);
      setSelectedIndex(idx >= 0 ? idx : 0);
    }
  }, [notes, currentNoteId, isOpen]);

  // Center selected item when modal opens
  useEffect(() => {
    if (isOpen && containerRef.current && notes.length > 0) {
      const idx = notes.findIndex((n) => n.id === currentNoteId);
      const targetIdx = idx >= 0 ? idx : 0;
      containerRef.current.scrollTop = targetIdx * itemHeight;
    }
  }, [isOpen, currentNoteId, notes.length]);

  if (!isOpen || notes.length === 0) return null;

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(notes.length - 1, index));
    if (clampedIndex !== selectedIndex) {
      setSelectedIndex(clampedIndex);
    }
  };

  const scrollToIndex = (idx: number) => {
    const target = Math.max(0, Math.min(notes.length - 1, idx));
    setSelectedIndex(target);
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: target * itemHeight,
        behavior: 'smooth',
      });
    }
  };

  const handleConfirm = () => {
    const selected = notes[selectedIndex];
    if (selected) {
      onSelectNote(selected);
      onClose();
    }
  };

  const currentSelection = notes[selectedIndex] || notes[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-sm rounded-[2.25rem] p-6 sm:p-7 border border-[#7e613c] bg-[#997950] text-white shadow-2xl flex flex-col items-center select-none"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full border border-white/20 text-white/80 hover:text-white hover:bg-black/20 transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title & Info */}
        <div className="text-center mb-3 max-w-[240px]">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-100/70 block mb-1">
            Riwayat Tanggal Catatan
          </span>
          <h3 className="text-base font-semibold truncate leading-tight text-white">
            {bookTitle}
          </h3>
          <p className="text-xs font-mono text-amber-100/80 mt-0.5">
            {notes.length} Tanggal Tersimpan
          </p>
        </div>

        {/* Quick Stepper Up */}
        <button
          onClick={() => scrollToIndex(selectedIndex - 1)}
          disabled={selectedIndex <= 0}
          className="p-1.5 rounded-full border border-white/20 text-white hover:bg-black/20 transition-colors cursor-pointer mb-1 disabled:opacity-20"
          aria-label="Tanggal Sebelumnya"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        {/* Wheel / Drum Scroll View with Blur Effect for Dates */}
        <div className="relative w-full max-w-[260px] h-[220px] my-1 flex items-center justify-center overflow-hidden">
          {/* Top & Bottom Blur Gradient overlays */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-16 z-10 backdrop-blur-[2px] bg-gradient-to-b from-[#997950] via-[#997950]/80 to-transparent" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 z-10 backdrop-blur-[2px] bg-gradient-to-t from-[#997950] via-[#997950]/80 to-transparent" />

          {/* Active Center Target Highlight Frame */}
          <div className="pointer-events-none absolute left-0 right-0 h-[52px] rounded-2xl border border-white/30 bg-black/25 shadow-xs z-5" />

          {/* Scrollable list */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
            style={{
              paddingTop: '84px', // offset 1.5 slots
              paddingBottom: '84px',
            }}
          >
            {notes.map((item, idx) => {
              const diff = Math.abs(idx - selectedIndex);
              let visualClasses = '';

              if (diff === 0) {
                // Tanggal saat ini: tegas, kontras tinggi
                visualClasses = 'text-white font-bold opacity-100 scale-105';
              } else if (diff === 1) {
                // 1 tanggal sebelum / sesudahnya: blur & transparan
                visualClasses = 'text-amber-100/70 font-medium opacity-50 blur-[0.6px] scale-95';
              } else {
                // 2+ tanggal: sangat blur & redup
                visualClasses = 'text-amber-100/40 font-normal opacity-25 blur-[1.5px] scale-90';
              }

              return (
                <div
                  key={item.id}
                  onClick={() => scrollToIndex(idx)}
                  className={`h-[52px] flex flex-col items-center justify-center font-mono cursor-pointer snap-center transition-all duration-150 px-2 ${visualClasses}`}
                >
                  <span className="text-xs font-semibold tracking-tight">{item.date}</span>
                  <span className="text-[10px] opacity-75">
                    Halaman {item.fromPage} - {item.toPage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stepper Down */}
        <button
          onClick={() => scrollToIndex(selectedIndex + 1)}
          disabled={selectedIndex >= notes.length - 1}
          className="p-1.5 rounded-full border border-white/20 text-white hover:bg-black/20 transition-colors cursor-pointer mt-1 disabled:opacity-20"
          aria-label="Tanggal Selanjutnya"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Active Selected Date Badge */}
        <div className="text-center my-3 px-3 py-1.5 rounded-xl bg-black/25 border border-white/20 font-mono text-xs text-white">
          <span className="text-amber-100/70">Pilihan: </span>
          <span className="font-semibold text-white">{currentSelection.date}</span>
          <span className="text-amber-200 ml-1.5">
            (Hlm {currentSelection.fromPage} - {currentSelection.toPage})
          </span>
        </div>

        {/* Aesthetic Checkmark Button to Confirm Selection */}
        <div className="mt-2 w-full flex justify-center">
          <button
            onClick={handleConfirm}
            className="group w-full flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl font-mono text-xs font-semibold tracking-wide border cursor-pointer transition-all duration-200 bg-black/35 hover:bg-black/50 text-white border-white/25 shadow-md"
            title="Tampilkan Catatan Tanggal Ini"
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-white text-[#997950]">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>Buka Catatan Tanggal Ini</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
