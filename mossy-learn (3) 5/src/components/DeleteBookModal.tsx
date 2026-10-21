import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, Trash2, AlertTriangle } from 'lucide-react';
import { BookItem } from '../types.ts';

interface DeleteBookModalProps {
  book: BookItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (bookId: string) => void;
  isDarkMode?: boolean;
}

export const DeleteBookModal: React.FC<DeleteBookModalProps> = ({
  book,
  isOpen,
  onClose,
  onConfirmDelete,
  isDarkMode = false,
}) => {
  const [confirmCode, setConfirmCode] = useState('');

  if (!isOpen || !book) return null;

  const REQUIRED_CODE = 'hapus buku';
  const isMatch = confirmCode.trim().toLowerCase() === REQUIRED_CODE;

  const handleDelete = () => {
    if (isMatch) {
      onConfirmDelete(book.id);
      setConfirmCode('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`relative w-full max-w-sm rounded-[2.25rem] p-6 sm:p-7 border shadow-2xl ${
          isDarkMode
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            setConfirmCode('');
            onClose();
          }}
          className={`absolute top-5 right-5 p-2 rounded-full border transition-colors cursor-pointer ${
            isDarkMode
              ? 'border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
              : 'border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
          aria-label="Batal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon & Heading */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center border border-red-500/20 bg-red-500/10 text-red-400">
            <Trash2 className="w-5 h-5 stroke-[2]" />
          </div>

          <h3 className="text-base font-semibold tracking-tight">
            Apa kamu yakin menghapusnya?
          </h3>
          <p className="text-xs opacity-60 mt-1 max-w-xs mx-auto">
            Buku <span className="font-semibold text-neutral-300">"{book.title}"</span> akan dihapus permanen dari perpustakaan Anda.
          </p>
        </div>

        {/* Code instruction */}
        <div className="space-y-3 mb-6">
          <div className="text-center">
            <span className="text-[11px] font-mono opacity-50 block mb-1">
              Ketik kode di bawah ini:
            </span>
            <span
              className={`inline-block font-mono text-xs font-semibold px-3 py-1 rounded-lg border ${
                isDarkMode
                  ? 'border-neutral-700 bg-neutral-950 text-neutral-200'
                  : 'border-neutral-300 bg-neutral-100 text-neutral-900'
              }`}
            >
              hapus buku
            </span>
          </div>

          <input
            type="text"
            autoFocus
            placeholder="Ketik 'hapus buku' di sini..."
            value={confirmCode}
            onChange={(e) => setConfirmCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isMatch) {
                handleDelete();
              }
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-center text-xs font-mono outline-none transition-colors ${
              isMatch
                ? 'border-red-500/80 bg-red-500/10 text-red-400'
                : isDarkMode
                  ? 'bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600 focus:border-neutral-600'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-neutral-400'
            }`}
          />
        </div>

        {/* Aesthetic Checkmark Button to Confirm Deletion */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleDelete}
            disabled={!isMatch}
            className={`w-full py-3 px-4 rounded-2xl font-mono text-xs font-semibold flex items-center justify-center gap-2.5 border transition-all duration-200 ${
              isMatch
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-md cursor-pointer'
                : isDarkMode
                  ? 'bg-neutral-950 border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed opacity-50'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                isMatch ? 'border-white bg-white/20' : 'border-neutral-600'
              }`}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>Hapus Buku Ini</span>
          </button>

          <button
            onClick={() => {
              setConfirmCode('');
              onClose();
            }}
            className={`w-full py-2 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
              isDarkMode
                ? 'text-neutral-400 hover:text-white'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            Batal
          </button>
        </div>
      </motion.div>
    </div>
  );
};
