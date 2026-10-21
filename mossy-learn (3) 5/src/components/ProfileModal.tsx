import React, { useState } from 'react';
import { X, Check, Flame, Clock, Award, Mail, LogOut, KeyRound } from 'lucide-react';
import { UserProfile } from '../types.ts';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  streakCount: number;
  onUpdateProfile: (updated: UserProfile) => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  streakCount,
  onUpdateProfile,
  onLogout,
  onOpenAuth,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile.name);
  const [username, setUsername] = useState(userProfile.username);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...userProfile,
      name,
      username,
    });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-[2.25rem] p-6 sm:p-8 border border-neutral-200 bg-white text-neutral-900 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full border border-neutral-200 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
          aria-label="Tutup Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Avatar & Info */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-semibold border border-neutral-900 bg-neutral-900 text-white shadow-xs">
            {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'M'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-neutral-950 truncate">
                {userProfile.name || 'Pengguna'}
              </h2>
              {userProfile.isLoggedIn ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 shrink-0 font-medium">
                  TERHUBUNG
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-neutral-200 bg-neutral-100 text-neutral-500 shrink-0">
                  TAMU
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">@{userProfile.username}</p>
            <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 opacity-60 shrink-0" />
              <span className="truncate">{userProfile.email}</span>
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-4 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" /> Profil berhasil diperbarui
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-3.5 mb-6">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 outline-none focus:border-neutral-900 focus:bg-white font-sans"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 outline-none focus:border-neutral-900 focus:bg-white font-sans"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-900 text-white hover:bg-black cursor-pointer transition-colors shadow-xs"
              >
                Simpan Perubahan
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-2.5 rounded-xl text-xs border border-neutral-300 text-neutral-600 hover:text-black cursor-pointer transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 mb-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50 text-center">
                <Flame className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                <div className="text-base font-semibold font-mono text-neutral-900">{streakCount}d</div>
                <div className="text-[10px] text-neutral-500">Streak Saat Ini</div>
              </div>

              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50 text-center">
                <Clock className="w-4 h-4 mx-auto mb-1 text-neutral-500" />
                <div className="text-base font-semibold font-mono text-neutral-900">{userProfile.totalStudyMinutes}m</div>
                <div className="text-[10px] text-neutral-500">Total Waktu</div>
              </div>

              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50 text-center">
                <Award className="w-4 h-4 mx-auto mb-1 text-neutral-500" />
                <div className="text-base font-semibold font-mono text-neutral-900">{userProfile.booksRead}</div>
                <div className="text-[10px] text-neutral-500">Buku Selesai</div>
              </div>
            </div>

            {/* Weekly Activity Heatmap */}
            <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/70">
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="font-semibold tracking-tight text-neutral-900">Konsistensi Membaca</span>
                <span className="text-[10px] text-neutral-500 font-mono">7 Hari Terakhir</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, idx) => {
                  const isActive = idx < 5;
                  return (
                    <div key={day} className="flex flex-col items-center gap-1.5">
                      <div
                        className={`w-full aspect-square rounded-lg border transition-all ${
                          isActive
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-teal-500 shadow-xs'
                            : 'bg-neutral-200/80 border-neutral-300'
                        }`}
                      />
                      <span className="text-[9px] font-mono text-neutral-500">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium border border-neutral-300 hover:border-neutral-400 bg-white text-neutral-800 hover:text-black cursor-pointer transition-colors shadow-xs"
              >
                Edit Profil
              </button>

              {userProfile.isLoggedIn ? (
                <button
                  onClick={onLogout}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-medium border border-neutral-300 hover:border-red-400 hover:bg-red-50 text-neutral-600 hover:text-red-600 cursor-pointer transition-colors flex items-center gap-1.5"
                  title="Keluar dari Akun"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-neutral-900 text-white hover:bg-black cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Kunci Progres</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="text-center pt-2 border-t border-neutral-100">
          <p className="text-[11px] text-neutral-400 font-mono">
            mossy learn space · v1.2.0
          </p>
        </div>
      </div>
    </div>
  );
};
