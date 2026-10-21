import React, { useState, useEffect } from 'react';
import { Flame, User, LogIn } from 'lucide-react';
import { UserProfile, StreakState } from '../types.ts';

interface HeaderProps {
  userProfile: UserProfile;
  streakState: StreakState;
  onOpenProfile: () => void;
  onOpenStreak: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  streakState,
  onOpenProfile,
  onOpenStreak,
  onOpenAuth,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [timeFormat24, setTimeFormat24] = useState<boolean>(true);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format real-time date
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !timeFormat24,
  }).format(currentTime);

  return (
    <header className="w-full pt-6 md:pt-8 pb-4 px-6 md:px-12 flex items-center justify-between select-none max-w-7xl mx-auto">
      {/* Pojok Kiri Atas: Profil / Akun */}
      {userProfile.isLoggedIn ? (
        <button
          onClick={onOpenProfile}
          className="group flex items-center gap-3 py-2 px-3.5 squircle-badge border border-neutral-200 hover:border-neutral-400 bg-white hover:bg-neutral-50 text-neutral-900 transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
          title="Lihat Profil (P)"
          aria-label="Buka Profil Pengguna"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs tracking-wider bg-[#3A5A40] text-white transition-colors shadow-xs">
              {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <div className="text-left flex flex-col">
            <span className="text-xs font-semibold tracking-wide capitalize text-neutral-900">
              {userProfile.username || 'mossy'}
            </span>
            <span className="text-[10px] tracking-tight text-neutral-500 truncate max-w-[110px]">
              {userProfile.email}
            </span>
          </div>
        </button>
      ) : (
        <button
          onClick={onOpenAuth}
          className="group flex items-center gap-2.5 py-2 px-3.5 squircle-badge border border-neutral-200 hover:border-neutral-400 bg-white hover:bg-neutral-50 text-neutral-900 transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
          title="Masuk atau Buat Akun"
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-neutral-100 text-neutral-800 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
            <LogIn className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-mono font-medium tracking-tight">
            Masuk / Buat Password
          </span>
        </button>
      )}

      {/* Pojok Kanan Atas: Streak (Api) & Tanggal Saat Ini (Real-Time) */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Streak Button with Fire Icon */}
        <button
          onClick={onOpenStreak}
          className="group flex items-center gap-2 py-2 px-3.5 squircle-badge border border-neutral-200 hover:border-neutral-400 bg-white hover:bg-neutral-50 text-neutral-900 transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
          title="Detail Streak & Chance Harian"
          aria-label="Streak Harian"
        >
          {/* Flame Icon with subtle warm accent */}
          <div className="relative flex items-center justify-center">
            <Flame className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform duration-200 fill-amber-500/20" />
            <span className="absolute inset-0 rounded-full bg-amber-500/20 blur-xs -z-10 group-hover:opacity-100 opacity-60 transition-opacity" />
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-xs font-semibold font-mono tracking-tight text-neutral-900">
              {streakState.currentStreak}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
              Hari
            </span>
          </div>
        </button>

        {/* Real-time Date and Time */}
        <div
          onClick={() => setTimeFormat24(!timeFormat24)}
          className="hidden md:flex flex-col items-end py-1.5 px-3 rounded-2xl border border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 transition-colors cursor-pointer select-none shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
          title="Klik untuk ganti format 12j/24j"
        >
          <div className="text-[11px] font-mono font-semibold tracking-tight flex items-center gap-1.5 text-neutral-900">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{formattedTime}</span>
          </div>
          <div className="text-[10px] tracking-wide text-neutral-500 capitalize">
            {formattedDate}
          </div>
        </div>

        {/* Mobile Clock Pill display */}
        <div
          onClick={() => setTimeFormat24(!timeFormat24)}
          className="flex md:hidden items-center gap-1.5 py-1.5 px-2.5 rounded-full border border-neutral-200/90 bg-white text-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] font-mono text-[11px] font-semibold cursor-pointer active:scale-95 transition-transform select-none"
          title="Klik untuk ganti format 12j/24j"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{formattedTime.slice(0, 5)}</span>
        </div>
      </div>
    </header>
  );
};
