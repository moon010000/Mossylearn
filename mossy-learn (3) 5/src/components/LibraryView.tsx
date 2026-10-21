import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Trash2,
  Bookmark,
  Clock,
  Check,
  CheckCircle2,
  X,
  Search,
  Image as ImageIcon,
  Sliders,
} from 'lucide-react';
import { BookItem, BookStatus } from '../types.ts';
import { ProgressScrollPickerModal } from './ProgressScrollPickerModal.tsx';
import { DeleteBookModal } from './DeleteBookModal.tsx';

interface LibraryViewProps {
  onBack: () => void;
  books: BookItem[];
  onAddBook: (book: Omit<BookItem, 'id' | 'dateAdded'>) => void;
  onUpdateBookStatus: (id: string, status: BookStatus) => void;
  onUpdateBookProgress: (id: string, currentPage: number, noteContent?: string, fromPage?: number) => void;
  onDeleteBook: (id: string) => void;
}

type TabType = 'all' | 'wishlist' | 'progress' | 'done';

export const LibraryView: React.FC<LibraryViewProps> = ({
  onBack,
  books,
  onAddBook,
  onUpdateBookStatus,
  onUpdateBookProgress,
  onDeleteBook,
}) => {
  // Active Tab: default to 'all' ('Your Book')
  const [selectedTab, setSelectedTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Scroll picker modal state
  const [scrollPickerBook, setScrollPickerBook] = useState<BookItem | null>(null);

  // Delete modal state
  const [bookToDelete, setBookToDelete] = useState<BookItem | null>(null);

  // Add book form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<BookStatus>('progress');
  const [currentPageInput, setCurrentPageInput] = useState<string>('');
  const [totalPagesInput, setTotalPagesInput] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Counts
  const counts = {
    all: books.length,
    wishlist: books.filter((b) => b.status === 'wishlist').length,
    progress: books.filter((b) => b.status === 'progress').length,
    done: books.filter((b) => b.status === 'done').length,
  };

  // Filtered books
  const filteredBooks = books.filter((b) => {
    const matchesTab = selectedTab === 'all' ? true : b.status === selectedTab;
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.author && b.author.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  // Compress image to 50% quality and optimized dimension
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 800;
          const maxHeight = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // 50% compression quality factor
            const compressed = canvas.toDataURL('image/jpeg', 0.5);
            resolve(compressed);
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Photo / File Selection with 50% compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedData = await compressImage(file);
        setCoverImage(compressedData);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCoverImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTotal = totalPagesInput.trim() !== '' ? parseInt(totalPagesInput, 10) : undefined;
    const parsedCurrent =
      currentPageInput.trim() !== '' ? parseInt(currentPageInput, 10) : 0;

    onAddBook({
      title: title.trim(),
      author: author.trim() || undefined,
      coverImage: coverImage || undefined,
      status,
      currentPage: status === 'done' ? (parsedTotal || parsedCurrent) : parsedCurrent,
      totalPages: parsedTotal,
      notes: notes.trim() || undefined,
    });

    // Reset & close
    setTitle('');
    setAuthor('');
    setNotes('');
    setCurrentPageInput('');
    setTotalPagesInput('');
    setCoverImage(null);
    setIsAddModalOpen(false);
  };

  // 4 Tab Definitions based on user request (All capitalized: Your Book, Wishlist, Progres, Done)
  const tabs = [
    { key: 'all' as TabType, label: 'Your Book', count: counts.all, icon: BookOpen },
    { key: 'wishlist' as TabType, label: 'Wishlist', count: counts.wishlist, icon: Bookmark },
    { key: 'progress' as TabType, label: 'Progres', count: counts.progress, icon: Clock },
    { key: 'done' as TabType, label: 'Done', count: counts.done, icon: CheckCircle2 },
  ];

  // Specific status card background color mapping requested by user:
  // Done: #787276 (fossil gray)
  // Progres: #818380
  // Wishlist: #544C4A
  const getCardBgColor = (bookStatus: BookStatus) => {
    switch (bookStatus) {
      case 'done':
        return '#787276';
      case 'progress':
        return '#818380';
      case 'wishlist':
        return '#544C4A';
      default:
        return '#ffffff';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-6 md:py-10 animate-fadeIn">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between mb-8 md:mb-12">
        <button
          onClick={onBack}
          className="group flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 hover:text-black hover:border-neutral-400 shadow-xs transition-all duration-200 cursor-pointer"
          aria-label="Kembali ke Beranda"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="font-mono text-xs font-semibold tracking-tight">Back</span>
        </button>

        {/* Action: + Add New Book */}
        <button
          onClick={() => {
            setStatus(selectedTab === 'all' ? 'progress' : selectedTab);
            setCurrentPageInput('');
            setTotalPagesInput('');
            setCoverImage(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold tracking-wide bg-neutral-900 hover:bg-black text-white shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add New Book</span>
        </button>
      </div>

      {/* Library Title (Capitalized, subtitle removed as requested) */}
      <div className="mb-8 md:mb-10 text-left">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-neutral-950">
          Library
        </h1>
      </div>

      {/* 4 Stacked Horizontal Bars (Capitalized: Your Book, Wishlist, Progres, Done) */}
      <div className="space-y-3 mb-8">
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.key;
          const TabIcon = tab.icon;

          return (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedTab(tab.key)}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                  : 'border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-800 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <TabIcon
                  className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-neutral-500'}`}
                />
                <span className="text-sm md:text-base font-semibold tracking-tight">
                  {tab.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono px-2.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-neutral-800 text-neutral-100 font-medium'
                      : 'bg-neutral-100 text-neutral-600 font-medium'
                  }`}
                >
                  {tab.count}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Content Section: Books List */}
      <div className="mt-8 pt-6 border-t border-neutral-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="text-xs font-mono uppercase tracking-wider text-neutral-600 font-medium">
            Daftar Buku ·{' '}
            <span className="font-semibold text-neutral-900">
              {tabs.find((t) => t.key === selectedTab)?.label || 'Your Book'}
            </span>{' '}
            ({filteredBooks.length})
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari judul atau penulis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none font-sans shadow-xs transition-colors"
            />
          </div>
        </div>

        {/* Books List / Grid */}
        {filteredBooks.length === 0 ? (
          <div className="py-12 px-6 rounded-3xl border border-neutral-200 bg-white text-center shadow-xs">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
            <p className="text-xs font-medium text-neutral-700">Belum Ada Buku di Kategori Ini.</p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Klik tombol "+ Add New Book" di atas untuk menambahkan buku pertama Anda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredBooks.map((book) => {
              const current = book.currentPage || 0;
              const total = book.totalPages || 0;
              const pageLeft = Math.max(0, total - current);
              const progressPercent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
              const cardBg = getCardBgColor(book.status);

              return (
                <div
                  key={book.id}
                  style={{ backgroundColor: cardBg }}
                  className="p-5 rounded-2xl text-white shadow-md flex flex-col justify-between transition-all duration-200 border border-black/10"
                >
                  <div className="flex gap-4">
                    {/* Cover image if available */}
                    {book.coverImage ? (
                      <div className="w-16 h-22 shrink-0 rounded-xl overflow-hidden border border-white/25 shadow-xs bg-black/20">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-20 shrink-0 rounded-xl border border-white/20 bg-black/20 text-white flex flex-col items-center justify-center text-center p-1 font-mono text-[10px]">
                        <BookOpen className="w-4 h-4 mb-1 opacity-70" />
                        <span className="truncate max-w-[48px]">{book.title.slice(0, 4)}</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 pr-1">
                          <h4
                            className="text-sm md:text-base font-semibold leading-snug truncate text-white"
                            title={book.title}
                          >
                            {book.title}
                          </h4>
                          {book.author && (
                            <p className="text-xs text-white/80 mt-0.5 truncate">{book.author}</p>
                          )}
                        </div>

                        {/* Trash Icon Button - Triggers Delete Confirmation Modal with Code */}
                        <button
                          onClick={() => setBookToDelete(book)}
                          className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-red-500/30 transition-all cursor-pointer"
                          title="Hapus Buku"
                          aria-label={`Hapus buku ${book.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {book.notes && (
                        <p className="text-xs mt-1.5 italic line-clamp-2 text-white/80">
                          "{book.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress section */}
                  <div className="mt-4 pt-3 border-t border-white/20">
                    {total > 0 && (
                      <div className="mb-3">
                        <button
                          onClick={() => setScrollPickerBook(book)}
                          className="group w-full flex items-center justify-between text-left p-2.5 rounded-xl border border-white/20 bg-black/20 hover:bg-black/30 transition-all cursor-pointer text-white"
                          title="Klik angka untuk mengatur halaman dengan scroll picker"
                        >
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-xs font-bold tracking-tight text-white">
                              Halaman {current}/{total}
                            </span>
                            <span className="text-[11px] font-mono text-white/80">
                              · {pageLeft === 0 ? 'Selesai' : `${pageLeft} Page Left`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/80 group-hover:text-white transition-opacity">
                            <Sliders className="w-3 h-3" />
                            <span>Ubah</span>
                          </div>
                        </button>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 rounded-full overflow-hidden mt-2 bg-black/30">
                          <div
                            className="h-full transition-all duration-300 bg-white"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Status Section: For 'done' books, show only Done and page count (no wishlist/progress buttons) */}
                    {book.status === 'done' ? (
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-3 py-1 rounded-xl text-[11px] font-mono font-bold bg-white text-neutral-900 shadow-xs flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 stroke-[3] text-neutral-900" />
                            Done
                          </span>
                        </div>
                        <div className="font-mono text-xs font-semibold text-white/95">
                          {total > 0 ? `${total} Halaman` : `${current} Halaman`}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[10px] font-mono text-white/70 uppercase tracking-wider font-semibold">
                          Status:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {(['wishlist', 'progress', 'done'] as BookStatus[]).map((st) => {
                            const label =
                              st === 'progress' ? 'Progres' : st === 'done' ? 'Done' : 'Wishlist';
                            const isActive = book.status === st;

                            return (
                              <button
                                key={st}
                                onClick={() => onUpdateBookStatus(book.id, st)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                                  isActive
                                    ? 'bg-white text-neutral-900 font-bold shadow-xs'
                                    : 'bg-black/25 text-white/85 hover:bg-black/40 hover:text-white border border-white/20'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: + Add New Book (with Photo Upload and Empty Default Pages) */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-md rounded-[2.25rem] p-6 sm:p-8 border border-neutral-200 bg-white text-neutral-900 shadow-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full border border-neutral-200 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-semibold tracking-tight text-neutral-950">+ Add New Book</h3>
                <p className="text-xs text-neutral-500 mt-0.5 font-light">
                  Simpan judul buku baru dan sampul foto ke dalam perpustakaan.
                </p>
              </div>

              <form onSubmit={handleCreateBook} className="space-y-4">
                {/* Photo Upload: "Pilih file atau pilih foto" with 50% auto compression */}
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1.5 font-medium">
                    Foto Sampul Buku (Opsional)
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {coverImage ? (
                    <div className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 bg-neutral-50">
                      <img
                        src={coverImage}
                        alt="Preview Sampul"
                        className="w-14 h-18 object-cover rounded-xl border border-neutral-200 shadow-xs"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-mono text-emerald-700 font-semibold block mb-1">
                          ✓ Foto Terpilih (Telah Dikompres 50%)
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 text-[11px] rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 font-mono text-neutral-800 cursor-pointer shadow-xs"
                          >
                            Ganti Foto
                          </button>
                          <button
                            type="button"
                            onClick={() => setCoverImage(null)}
                            className="px-2.5 py-1 text-[11px] rounded-lg font-mono text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-3 px-4 rounded-xl border border-neutral-300 border-dashed bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center gap-2 text-xs font-mono text-neutral-700 transition-colors cursor-pointer"
                      >
                        <ImageIcon className="w-4 h-4 text-neutral-500" />
                        <span>Pilih File atau Pilih Foto</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1 font-medium">
                    Judul Buku *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Atomic Habits, Madilog, Deep Work..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                  />
                </div>

                {/* Author */}
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1 font-medium">
                    Penulis / Pengarang
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: James Clear, Tan Malaka..."
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                  />
                </div>

                {/* Status Selector (Capitalized: Wishlist, Progres, Done) */}
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1 font-medium">
                    Kategori / Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['wishlist', 'progress', 'done'] as BookStatus[]).map((st) => {
                      const label =
                        st === 'progress' ? 'Progres' : st === 'done' ? 'Done' : 'Wishlist';
                      const isSelected = status === st;

                      return (
                        <button
                          type="button"
                          key={st}
                          onClick={() => setStatus(st)}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                              : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:text-black hover:border-neutral-300'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Total Pages & Current Page */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1 font-medium">
                      Halaman Saat Ini
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={currentPageInput}
                      onChange={(e) => setCurrentPageInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1 font-medium">
                      Jumlah Halaman Buku
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder=""
                      value={totalPagesInput}
                      onChange={(e) => setTotalPagesInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1 font-medium">
                    Catatan
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Catatan singkat tentang buku ini..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl text-xs font-semibold tracking-wide bg-neutral-900 hover:bg-black text-white cursor-pointer transition-colors shadow-md"
                  >
                    Simpan Buku
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Progress Scroll Picker Modal */}
      <AnimatePresence>
        {scrollPickerBook && (
          <ProgressScrollPickerModal
            book={scrollPickerBook}
            isOpen={!!scrollPickerBook}
            onClose={() => setScrollPickerBook(null)}
            onSaveProgress={onUpdateBookProgress}
          />
        )}
      </AnimatePresence>

      {/* Delete Book Confirmation Modal with 'hapus buku' verification */}
      <AnimatePresence>
        {bookToDelete && (
          <DeleteBookModal
            book={bookToDelete}
            isOpen={!!bookToDelete}
            onClose={() => setBookToDelete(null)}
            onConfirmDelete={onDeleteBook}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
