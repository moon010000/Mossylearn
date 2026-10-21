import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Lock, Mail, ArrowRight, ShieldCheck, Check, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Masukkan alamat email yang valid.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password minimal harus 6 karakter.');
      return;
    }

    const accountsRaw = localStorage.getItem('mossy_registered_users');
    const accounts: Record<string, { passwordHash: string; createdAt: string }> = accountsRaw
      ? JSON.parse(accountsRaw)
      : {};

    if (isRegisterMode) {
      if (password !== confirmPassword) {
        setErrorMessage('Konfirmasi password tidak cocok.');
        return;
      }
      if (accounts[cleanEmail]) {
        setErrorMessage('Email sudah terdaftar. Silakan pilih "Masuk".');
        return;
      }

      accounts[cleanEmail] = {
        passwordHash: btoa(password),
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('mossy_registered_users', JSON.stringify(accounts));
      setSuccessMessage('Akun berhasil dibuat! Progres belajar Anda kini tersimpan aman.');

      setTimeout(() => {
        onLoginSuccess(cleanEmail);
        onClose();
      }, 900);
    } else {
      if (!accounts[cleanEmail]) {
        accounts[cleanEmail] = {
          passwordHash: btoa(password),
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('mossy_registered_users', JSON.stringify(accounts));
        setSuccessMessage('Akun baru dibuat dan langsung masuk!');
        setTimeout(() => {
          onLoginSuccess(cleanEmail);
          onClose();
        }, 900);
        return;
      }

      if (accounts[cleanEmail].passwordHash !== btoa(password)) {
        setErrorMessage('Password salah. Periksa kembali password Anda.');
        return;
      }

      setSuccessMessage('Berhasil masuk! Selamat datang kembali.');
      setTimeout(() => {
        onLoginSuccess(cleanEmail);
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-md rounded-[2.25rem] p-7 sm:p-9 border border-neutral-200 bg-white text-neutral-900 shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full border border-neutral-200 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand & Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center border border-neutral-200 bg-neutral-100 text-neutral-900 shadow-xs">
            <KeyRound className="w-5 h-5 stroke-[1.8]" />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight lowercase text-neutral-950">
            {isRegisterMode ? 'buat akun baru' : 'masuk akun'}
          </h2>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto font-light leading-relaxed">
            Hanya butuh email & buat password sendiri untuk mengunci dan menyimpan seluruh progres buku Anda.
          </p>
        </div>

        {/* Feedback messages */}
        {errorMessage && (
          <div className="mb-4 py-2.5 px-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-mono">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 py-2.5 px-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {successMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs outline-none focus:border-neutral-900 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1">
              {isRegisterMode ? 'Buat Password Sendiri' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs outline-none focus:border-neutral-900 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {isRegisterMode && (
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1">
                Ulangi Password
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  required
                  placeholder="Ketik ulang password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
            >
              <span>{isRegisterMode ? 'Daftar & Kunci Progres' : 'Masuk Sekarang'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Mode Switcher */}
        <div className="mt-5 pt-4 border-t border-neutral-100 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className="text-xs font-mono text-neutral-500 hover:text-black transition-colors cursor-pointer"
          >
            {isRegisterMode
              ? 'Sudah punya password? Masuk di sini'
              : 'Belum punya akun? Buat password baru di sini'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
