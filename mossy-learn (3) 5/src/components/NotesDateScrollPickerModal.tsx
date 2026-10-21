import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Check, ChevronUp, ChevronDown, Calendar } from 'lucide-react';
import { ReadingNoteEntry } from '../types.ts';

interface NotesDateScrollPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: ReadingNoteEntry[];
  selectedNoteId: string;
  onSelectNote: (note: ReadingNoteEntry) => void;
}

export const NotesDateScrollPickerModal: React.FC<NotesDateScrollPickerModalProps> = ({
  isOpen,
  onClose,
  notes,
  selectedNoteId,
  onSelectNote,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 44; // height of each date item

  const initialIndex = Math.max(
    0,
    notes.findIndex((n) => n.id === selectedNoteId)
  );
  const [selectedIndex, setSelectedIndex] = useState<number>(initialIndex);

  useEffect(() => {
    const idx = Math.max(
      0,
      notes.findIndex((n) => n.id === selectedNoteId)
    );
    setSelectedIndex(idx >= 0 ? idx : 0);
  }, [selectedNoteId, notes]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      containerRef.current.scrollTop = selectedIndex * itemHeight;
    }
  }, [isOpen, selectedIndex]);

  if (!isOpen || notes.length === 0) return null;

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(notes.length - 1, index));
    if (clamped !== selectedIndex) {
      setSelectedIndex(clamped);
    }
  };

  const scrollToIndex = (index: number) => {
    const target = Math.max(0, Math.min(notes.length - 1, index));
    setSelectedIndex(target);
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: target * itemHeight,
        behavior: 'smooth',
      });
    }
  };

  const handleConfirm = () => {
    const chosenNote = notes[selectedIndex];
    if (chosenNote) {
      onSelectNote(chosenNote);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
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

        {/* Title */}
        <div className="text-center mb-3 max-w-[240px]">
          <div className="w-10 h-10 rounded-2xl mx-auto mb-2 border border-white/20 bg-black/25 flex items-center justify-center text-amber-200 shadow-xs">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-100/70 block mb-0.5">
            Riwayat Tanggal Track
          </span>
          <h3 className="text-base font-semibold leading-tight text-white">
            Pilih Tanggal Catatan
          </h3>
          <p className="text-[11px] font-mono text-amber-100/80 mt-1">
            Scroll ke bawah / atas untuk melihat catatan sebelumnya
          </p>
        </div>

        {/* Quick Stepper Up */}
        <button
          onClick={() => scrollToIndex(selectedIndex - 1)}
          disabled={selectedIndex <= 0}
          className="p-1.5 rounded-full border border-white/20 text-white hover:bg-black/20 transition-colors cursor-pointer mb-2 disabled:opacity-20"
          aria-label="Tanggal Sebelumnya"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        {/* Wheel / Drum Scroll View with Blur Effect matching Progress Scroll */}
        <div className="relative w-full max-w-[240px] h-[220px] my-1 flex items-center justify-center overflow-hidden">
          {/* Top & Bottom Blur Gradient overlays */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-16 z-10 backdrop-blur-[2px] bg-gradient-to-b from-[#997950] via-[#997950]/80 to-transparent" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 z-10 backdrop-blur-[2px] bg-gradient-to-t from-[#997950] via-[#997950]/80 to-transparent" />

          {/* Active Center Target Highlight Frame */}
          <div className="pointer-events-none absolute left-0 right-0 h-[44px] rounded-2xl border border-white/30 bg-black/25 shadow-xs z-5" />

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
            {notes.map((entry, idx) => {
              const diff = Math.abs(idx - selectedIndex);
              let visualClasses = '';

              if (diff === 0) {
                // Tanggal saat ini: tegas, kontras tinggi
                visualClasses = 'text-white text-base font-bold opacity-100 scale-105';
              } else if (diff === 1) {
                // 1 tanggal sebelumnya / sesudahnya: sedikit blur
                visualClasses = 'text-amber-100/70 text-xs font-medium opacity-50 blur-[0.6px] scale-95';
              } else {
                // 2+ tanggal: sangat blur & redup
                visualClasses = 'text-amber-100/40 text-[11px] font-normal opacity-25 blur-[1.5px] scale-90';
              }

              return (
                <div
                  key={entry.id}
                  onClick={() => scrollToIndex(idx)}
                  className={`h-[44px] flex items-center justify-center gap-2 font-mono cursor-pointer snap-center transition-all duration-150 ${visualClasses}`}
                >
                  <span>{entry.formattedDate || entry.date}</span>
                  <span className="text-[10px] opacity-70">
                    · Hlm {entry.fromPage}-{entry.toPage}
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
          className="p-1.5 rounded-full border border-white/20 text-white hover:bg-black/20 transition-colors cursor-pointer mt-2 disabled:opacity-20"
          aria-label="Tanggal Selanjutnya"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Selected Date Summary */}
        <div className="text-center my-3 px-3 py-1.5 rounded-xl bg-black/25 border border-white/20 font-mono text-xs text-white">
          <div className="font-semibold tracking-tight text-white">
            {notes[selectedIndex]?.formattedDate || notes[selectedIndex]?.date}
          </div>
          <div className="text-[11px] text-amber-200 mt-0.5">
            Halaman {notes[selectedIndex]?.fromPage} - {notes[selectedIndex]?.toPage}
          </div>
        </div>

        {/* Aesthetic Checkmark Button to Select Date */}
        <div className="mt-2 w-full flex justify-center">
          <button
            onClick={handleConfirm}
            className="group w-full flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl font-mono text-xs font-semibold tracking-wide border border-white/25 bg-black/35 hover:bg-black/50 text-white shadow-md cursor-pointer transition-all duration-200"
            title="Buka Catatan Tanggal Ini"
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-white text-[#997950]">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>Pilih Tanggal Ini</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
