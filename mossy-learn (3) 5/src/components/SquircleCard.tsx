import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, ArrowUpRight, Plus, FileEdit, TrendingUp, Sparkles, Trees } from 'lucide-react';

interface SquircleCardProps {
  index: number;
  isLibrary?: boolean;
  isNotesStats?: boolean;
  isAchievement?: boolean;
  bookCount?: number;
  notesCount?: number;
  doneCount?: number;
  progressCount?: number;
  onClick: () => void;
}

export const SquircleCard: React.FC<SquircleCardProps> = ({
  index,
  isLibrary = false,
  isNotesStats = false,
  isAchievement = false,
  bookCount = 0,
  notesCount = 0,
  doneCount = 0,
  progressCount = 0,
  onClick,
}) => {
  const isInteractive = isLibrary || isNotesStats || isAchievement;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={isInteractive ? { y: -6, transition: { duration: 0.25 } } : { y: -2 }}
      className={`relative group squircle-card flex flex-col justify-between p-7 md:p-8 select-none transition-all duration-300 aspect-square w-full max-w-[340px] mx-auto min-h-[300px] md:min-h-[330px] ${
        isInteractive
          ? 'bg-white hover:bg-neutral-50/90 border border-neutral-200/90 hover:border-[#3A5A40]/40 shadow-[0_4px_20px_rgba(58,90,64,0.04)] hover:shadow-[0_16px_36px_rgba(58,90,64,0.08)] cursor-pointer'
          : 'bg-neutral-50/70 border border-neutral-200/80 border-dashed text-neutral-400 opacity-80 hover:opacity-100'
      }`}
      onClick={onClick}
    >
      {/* Top Row: Index indicator with Soft Olive/Gold accent (#A3B18A / #D4A373) & Arrow */}
      <div className="flex items-center justify-between w-full">
        <span
          className={`font-mono text-xs font-semibold tracking-widest px-2.5 py-1 rounded-full border transition-colors ${
            isInteractive
              ? 'text-[#3A5A40] border-[#A3B18A]/50 bg-[#E8EFE9]/40 group-hover:border-[#3A5A40]/60 group-hover:bg-[#E8EFE9]'
              : 'text-neutral-400 border-neutral-200 bg-transparent'
          }`}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        {isInteractive ? (
          <div className="p-2 rounded-full border border-[#A3B18A]/40 bg-[#E8EFE9]/60 text-[#3A5A40] group-hover:bg-[#3A5A40] group-hover:text-white group-hover:border-[#3A5A40] transition-all duration-300 group-hover:scale-105 shadow-2xs">
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        ) : (
          <div className="p-2 rounded-full opacity-30 text-neutral-400">
            <Plus className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Middle: Content with #E8EFE9 icon background and #3A5A40 Moss Green */}
      {isLibrary ? (
        <div className="my-auto flex flex-col items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-[#A3B18A]/50 bg-[#E8EFE9] text-[#3A5A40] group-hover:bg-[#3A5A40] group-hover:text-white transition-all duration-300 shadow-xs">
            <BookOpen className="w-5 h-5 stroke-[2]" />
          </div>

          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-neutral-950 transition-colors">
              Library
            </h3>
          </div>
        </div>
      ) : isNotesStats ? (
        <div className="my-auto flex flex-col items-start gap-3.5">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-[#A3B18A]/50 bg-[#E8EFE9] text-[#3A5A40] group-hover:bg-[#3A5A40] group-hover:text-white transition-all duration-300 shadow-xs">
              <FileEdit className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-[#A3B18A]/40 bg-[#E8EFE9]/80 text-[#3A5A40]">
              <TrendingUp className="w-4 h-4 stroke-[2]" />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-neutral-950 transition-colors">
              Notes / Stats
            </h3>
          </div>
        </div>
      ) : isAchievement ? (
        <div className="my-auto flex flex-col items-start gap-3.5">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-[#A3B18A]/50 bg-[#E8EFE9] text-[#3A5A40] group-hover:bg-[#3A5A40] group-hover:text-white transition-all duration-300 shadow-xs">
              <Trees className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-[#A3B18A]/40 bg-[#E8EFE9]/80 text-[#3A5A40]">
              <Sparkles className="w-4 h-4 stroke-[2]" />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-neutral-950 transition-colors">
              Achievement
            </h3>
            <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
              Visual 3D Pixel Progres
            </p>
          </div>
        </div>
      ) : (
        <div className="my-auto flex flex-col items-center justify-center text-center gap-2 py-4">
          <div className="w-10 h-10 rounded-2xl border border-neutral-200 bg-white text-neutral-400 flex items-center justify-center shadow-xs">
            <Plus className="w-4 h-4 opacity-40" />
          </div>
          <span className="text-xs font-mono tracking-wide text-neutral-500">
            Menunggu Fitur
          </span>
        </div>
      )}

      {/* Bottom Row: Book/Notes/Achievement count in #3A5A40 Moss Green */}
      <div
        className={`pt-3 border-t w-full flex items-center justify-between text-xs transition-colors ${
          isInteractive
            ? 'border-[#A3B18A]/25 text-neutral-500'
            : 'border-neutral-200/80 text-neutral-400'
        }`}
      >
        {isLibrary ? (
          <>
            <span className="text-[11px] font-mono tracking-tight text-neutral-500">
              Koleksi
            </span>
            <span className="font-mono font-bold text-xs text-[#3A5A40]">
              {bookCount} Buku
            </span>
          </>
        ) : isNotesStats ? (
          <>
            <span className="text-[11px] font-mono tracking-tight text-neutral-500">
              Catatan & Statistik
            </span>
            <span className="font-mono font-bold text-xs text-[#3A5A40]">
              {notesCount} Catatan
            </span>
          </>
        ) : isAchievement ? (
          <>
            <span className="text-[11px] font-mono tracking-tight text-neutral-500">
              Pohon Pencapaian
            </span>
            <span className="font-mono font-bold text-xs text-[#3A5A40]">
              {doneCount} Tamat · {progressCount} Progres
            </span>
          </>
        ) : (
          <span className="text-[10px] font-mono opacity-60 mx-auto text-neutral-400">
            Slot Kosong
          </span>
        )}
      </div>
    </motion.div>
  );
};
