import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Flame,
  CheckCircle,
  Sparkles,
  Shield,
  BookOpen,
  Calendar,
  AlertCircle,
  ArrowRight,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { StreakState, BookItem } from '../types.ts';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakState: StreakState;
  books: BookItem[];
  onCheckInToday: () => void;
  onUseChance: (bookId: string) => void;
}

export const StreakModal: React.FC<StreakModalProps> = ({
  isOpen,
  onClose,
  streakState,
  books,
  onCheckInToday,
  onUseChance,
}) => {
  const [showChanceFlow, setShowChanceFlow] = useState(false);
  const [chanceSuccess, setChanceSuccess] = useState(false);

  // Requirement: Only books with status === 'progress' can be used for the 5-page reading requirement!
  const progressBooks = books.filter((b) => b.status === 'progress');
  const [selectedBookId, setSelectedBookId] = useState<string>(progressBooks[0]?.id || '');

  if (!isOpen) return null;

  const selectedBook = progressBooks.find((b) => b.id === selectedBookId) || progressBooks[0];

  const handleActivateChance = () => {
    if (!selectedBook) return;
    onUseChance(selectedBook.id);
    setChanceSuccess(true);
    setTimeout(() => {
      setChanceSuccess(false);
      setShowChanceFlow(false);
    }, 1500);
  };

  // Calendar logic for current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Format date helper: YYYY-MM-DD
  const formatDayString = (day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const currentDayNumber = today.getDate();

  // Condition: Has the user missed an inactive day that needs rescue?
  const hasMissedDay = streakState.missedDates.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-lg rounded-[2.25rem] p-6 sm:p-8 border border-neutral-200 bg-white text-neutral-900 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full border border-neutral-200 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
          aria-label="Tutup Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Centerpiece: Flame & Streak count */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-3xl bg-neutral-50 border border-neutral-200 flex items-center justify-center shadow-xs">
              <Flame className="w-10 h-10 text-amber-500 fill-amber-500/20 animate-pulse" />
            </div>
            <span className="absolute inset-0 rounded-3xl bg-amber-500/15 blur-md -z-10" />
          </div>

          <h2 className="text-4xl font-mono font-bold tracking-tight text-neutral-950">
            {streakState.currentStreak}{' '}
            <span className="text-base font-sans font-normal text-neutral-500">Hari Streak</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs font-light">
            {streakState.todayCheckedIn
              ? 'Api streak hari ini menyala! Terus jaga momentum membaca Anda.'
              : 'Aktifkan streak harian Anda sebelum hari berakhir.'}
          </p>
        </div>

        {/* Check-in Hari Ini Button (Untuk hari aktif) */}
        <div className="mb-6">
          <button
            onClick={onCheckInToday}
            disabled={streakState.todayCheckedIn}
            className={`w-full py-3 px-4 rounded-2xl font-mono text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all duration-300 ${
              streakState.todayCheckedIn
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 cursor-default'
                : 'bg-neutral-900 hover:bg-black text-white shadow-md cursor-pointer'
            }`}
          >
            {streakState.todayCheckedIn ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Streak Hari Ini Sudah Aktif (+1)
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                Nyalakan Streak Hari Ini
              </>
            )}
          </button>
        </div>

        {/* 3 Chance Sebulan Penyelamat System */}
        {/* Chance HANYA muncul/dipakai disaat ada hari di mana user TIDAK mengaktifkannya */}
        <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/80 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold tracking-tight text-neutral-900">
                Penyelamatan Streak (Chance Bulanan)
              </span>
            </div>
            <span className="text-[11px] font-mono font-medium text-neutral-600">
              {streakState.remainingChances} / 3 Chance Tersisa
            </span>
          </div>

          {/* 3 Chance visual dots / badges */}
          <div className="flex items-center gap-2 my-2.5">
            {[1, 2, 3].map((num) => {
              const isAvailable = num <= streakState.remainingChances;
              return (
                <div
                  key={num}
                  className={`flex-1 py-1.5 px-2 rounded-xl border text-center text-[10px] font-mono font-medium transition-colors ${
                    isAvailable
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-neutral-200 bg-neutral-100 text-neutral-400 line-through'
                  }`}
                >
                  Chance {num}
                </div>
              );
            })}
          </div>

          {/* Logic explanation: Chance hanya ada jika ga aktifin streak di suatu hari */}
          {hasMissedDay ? (
            <div className="mt-3 pt-3 border-t border-neutral-200">
              <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mb-3">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Hari Tidak Aktif Terdeteksi</span>
                  Kamu tidak mengaktifkan streak pada hari yang terlewat. Gunakan 1 chance untuk menyelamatkannya dengan membaca 5 halaman dari buku di kategori <strong className="underline">Progres</strong>.
                </div>
              </div>

              {streakState.remainingChances > 0 ? (
                <button
                  onClick={() => setShowChanceFlow(!showChanceFlow)}
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-mono flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    {showChanceFlow
                      ? 'Tutup Form Penyelamatan'
                      : 'Aktifkan Chance (Syarat: Baca 5 Halaman di Progres)'}
                  </span>
                </button>
              ) : (
                <p className="text-center text-[11px] font-mono text-red-600">
                  3 Chance bulan ini telah habis. Streak tereset dari 0.
                </p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-neutral-500 font-light leading-relaxed mt-1">
              Streak Anda saat ini konsisten. Chance penyelamat (3x sebulan) hanya akan tersedia saat Anda melewatkan / tidak mengaktifkan streak pada suatu hari.
            </p>
          )}
        </div>

        {/* Modal/Form: Syarat Membaca 5 Halaman dari Buku di Kategori Progres */}
        <AnimatePresence>
          {showChanceFlow && hasMissedDay && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-2xl border border-emerald-300 bg-emerald-50/50 mb-6 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-emerald-900">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <span>Syarat Chance: Baca 5 Halaman Buku Progres</span>
              </div>
              <p className="text-[11px] text-neutral-600 mb-3">
                Pilih buku yang sedang berjalan di kategori <strong className="text-neutral-900">Progres</strong>. Membaca 5 halaman akan memulihkan streak hari yang terlewat:
              </p>

              {progressBooks.length === 0 ? (
                <div className="p-3 rounded-xl bg-white border border-neutral-200 text-center">
                  <p className="text-xs text-neutral-600 font-medium">
                    Tidak ada buku di kategori Progres.
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Tambahkan atau ubah status buku ke "Progres" di Library terlebih dahulu.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-neutral-600 block mb-1">
                      Pilih Buku dari Kategori Progres
                    </label>
                    <select
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-900 text-xs outline-none font-sans"
                    >
                      {progressBooks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} (Halaman saat ini: {b.currentPage || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedBook && (
                    <div className="p-3 rounded-xl bg-white border border-neutral-200 text-xs font-mono">
                      <div className="flex justify-between text-neutral-600">
                        <span>Halaman saat ini:</span>
                        <span className="font-semibold text-neutral-900">hlm {selectedBook.currentPage || 0}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-semibold mt-1">
                        <span>Setelah membaca 5 hlm:</span>
                        <span>hlm {(selectedBook.currentPage || 0) + 5} (+5 hlm)</span>
                      </div>
                    </div>
                  )}

                  {chanceSuccess ? (
                    <div className="py-2.5 px-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-mono flex items-center justify-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700" />
                      5 Halaman selesai dibaca! Streak hari itu berhasil diselamatkan!
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleActivateChance}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold font-mono flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                    >
                      <span>Konfirmasi Baca 5 Halaman & Pulihkan Streak</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kalender Streak Bulan Ini (Estetik Putih Monokrom) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold tracking-tight capitalize flex items-center gap-1.5 text-neutral-900">
              <Calendar className="w-3.5 h-3.5 opacity-60" />
              {monthName}
            </span>
            <span className="text-[10px] font-mono text-neutral-500">Track Kalender</span>
          </div>

          {/* Grid tanggal bulan ini */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: totalDaysInMonth }, (_, i) => i + 1).map((day) => {
              const dateStr = formatDayString(day);
              const isActive = streakState.activeDates.includes(dateStr);
              const isChanceSaved = streakState.chanceSavedDates.includes(dateStr);
              const isMissed = streakState.missedDates.includes(dateStr);
              const isToday = day === currentDayNumber;

              let styleClasses = 'bg-neutral-50 border-neutral-200 text-neutral-400';

              if (isActive) {
                // Streak yang aktif: berwarna hijau tosca gradient
                styleClasses =
                  'bg-gradient-to-br from-emerald-400 to-teal-500 border-teal-500 text-white font-bold shadow-xs';
              } else if (isChanceSaved) {
                // Hari dimana ga aktifkan streak diselamatkan chance: berwarna hijau tua
                styleClasses =
                  'bg-emerald-800 border-emerald-900 text-white font-bold shadow-xs';
              } else if (isMissed || day < currentDayNumber) {
                // Hari dimana streak gada / chance habis: tidak ada warna, cuma default aja
                styleClasses = 'bg-neutral-100 border-neutral-200 text-neutral-400 font-normal';
              }

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-xs font-mono relative transition-all ${styleClasses} ${
                    isToday ? 'ring-2 ring-neutral-900 font-bold' : ''
                  }`}
                  title={`${dateStr}: ${
                    isActive
                      ? 'Streak Aktif (Hijau Tosca Gradient)'
                      : isChanceSaved
                        ? 'Diselamatkan Chance (Hijau Tua)'
                        : 'Tidak Aktif (Default)'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-current" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend Warna Sesuai Permintaan User */}
          <div className="mt-4 pt-3 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-neutral-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 border border-teal-500" />
              <span>Hijau Tosca: Streak Aktif</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-800 border border-emerald-900" />
              <span>Hijau Tua: Chance Dipakai</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-neutral-100 border border-neutral-200" />
              <span>Default: Tidak Aktif</span>
            </div>
          </div>
        </div>

        {/* Catatan Streak Berakhir (jika pernah terputus) */}
        {streakState.lastEndedStreak ? (
          <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50 text-xs font-mono text-neutral-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Catatan Riwayat</span>
              Streak berakhir di tanggal{' '}
              <strong className="text-neutral-900">{streakState.lastEndedStreak.date}</strong> dengan total{' '}
              <strong className="text-amber-700 font-bold">{streakState.lastEndedStreak.totalStreak} streak</strong>.
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl border border-neutral-200 bg-neutral-50 text-center text-[11px] font-mono text-neutral-600">
            Rekor streak terpanjang: <span className="text-neutral-900 font-bold">{streakState.bestStreak} Hari</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
