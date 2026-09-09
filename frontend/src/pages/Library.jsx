import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Library as LibraryIcon,
  Plus,
  Search,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Edit2,
  Trash2,
  X,
  History,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  'General',
  'Science',
  'Mathematics',
  'Literature',
  'Computer Science',
  'History',
  'Social Studies',
  'Philosophy',
  'Arts'
];

const Library = () => {
  const { user } = useAuth();
  const roleName = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isLibrarianOrAdmin = ['Super Admin', 'School Admin', 'Principal', 'Librarian'].includes(roleName);

  const [activeTab, setActiveTab] = useState('books'); // 'books', 'issues'
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Add / Edit Book Modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'General',
    publisher: '',
    rack_number: '',
    total_copies: 3
  });

  // Issue Book Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedBookToIssue, setSelectedBookToIssue] = useState(null);
  const [issueForm, setIssueForm] = useState({
    book_id: '',
    student_id: '',
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remarks: 'Standard 14-day borrowing'
  });

  // Return Book Modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnIssue, setReturnIssue] = useState(null);
  const [returnFine, setReturnFine] = useState(0);
  const [returnRemarks, setReturnRemarks] = useState('');

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchMetadata();
    fetchBooks();
    fetchIssues();
  }, []);

  const fetchMetadata = async () => {
    try {
      const res = await API.get('/api/students');
      setStudents(res.data);
      if (res.data.length > 0) {
        setIssueForm(prev => ({ ...prev, student_id: res.data[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/library/books');
      setBooks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    try {
      const res = await API.get('/api/library/issues');
      setIssues(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenBookModal = (b = null) => {
    setErr('');
    if (b) {
      setEditingBook(b);
      setBookForm({
        title: b.title,
        author: b.author,
        isbn: b.isbn || '',
        category: b.category,
        publisher: b.publisher || '',
        rack_number: b.rack_number || '',
        total_copies: b.total_copies
      });
    } else {
      setEditingBook(null);
      setBookForm({
        title: '',
        author: '',
        isbn: '',
        category: 'General',
        publisher: '',
        rack_number: '',
        total_copies: 3
      });
    }
    setShowBookModal(true);
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const payload = {
        ...bookForm,
        total_copies: parseInt(bookForm.total_copies)
      };

      if (editingBook) {
        await API.put(`/api/library/books/${editingBook.id}`, payload);
      } else {
        await API.post('/api/library/books', payload);
      }
      setShowBookModal(false);
      setMsg('Book saved successfully!');
      setTimeout(() => setMsg(''), 4000);
      fetchBooks();
    } catch (error) {
      setErr(error.response?.data?.detail || 'Failed to save book');
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Delete this book from catalog?')) return;
    try {
      await API.delete(`/api/library/books/${id}`);
      fetchBooks();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete book');
    }
  };

  const handleOpenIssue = (b) => {
    setSelectedBookToIssue(b);
    setIssueForm(prev => ({
      ...prev,
      book_id: b.id,
      student_id: students[0]?.id || ''
    }));
    setShowIssueModal(true);
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await API.post('/api/library/issues', {
        book_id: Number(issueForm.book_id),
        student_id: Number(issueForm.student_id),
        due_date: issueForm.due_date,
        remarks: issueForm.remarks
      });
      setShowIssueModal(false);
      setMsg('Book issued successfully!');
      setTimeout(() => setMsg(''), 4000);
      fetchBooks();
      fetchIssues();
    } catch (error) {
      setErr(error.response?.data?.detail || 'Failed to issue book');
    }
  };

  const handleOpenReturn = (iss) => {
    setReturnIssue(iss);
    const today = new Date();
    const due = new Date(iss.due_date);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const calculatedFine = diffDays > 0 ? diffDays * 1.0 : 0.0;

    setReturnFine(calculatedFine);
    setReturnRemarks(iss.remarks || '');
    setShowReturnModal(true);
  };

  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/api/library/issues/${returnIssue.id}/return`, {
        fine_amount: parseFloat(returnFine || 0),
        remarks: returnRemarks
      });
      setShowReturnModal(false);
      setMsg('Book returned and inventory updated!');
      setTimeout(() => setMsg(''), 4000);
      fetchBooks();
      fetchIssues();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to return book');
    }
  };

  const filteredBooks = books.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      (b.isbn && b.isbn.toLowerCase().includes(search.toLowerCase()));
    const matchCat = !categoryFilter || b.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-900/50 via-slate-900/60 to-blue-900/50 border border-slate-800 p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
              <LibraryIcon className="w-3.5 h-3.5" /> Media Center & Library
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Library Management</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Track catalog inventory, manage book issuance & returns, and calculate automated late fees.
            </p>
          </div>
          {isLibrarianOrAdmin && (
            <button
              onClick={() => handleOpenBookModal()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" /> Add New Book
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('books')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'books'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Book Catalog ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'issues'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <History className="w-4 h-4" /> Borrowing & Issues ({issues.length})
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {msg}
        </div>
      )}

      {/* TAB 1: BOOK CATALOG */}
      {activeTab === 'books' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by book title, author, or ISBN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredBooks.map((b) => (
              <div key={b.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between group hover:border-slate-700 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {b.category}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${b.available_copies > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {b.available_copies} / {b.total_copies} Available
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {b.title}
                  </h3>
                  <div className="text-xs text-slate-400 mt-1">Author: <strong className="text-white">{b.author}</strong></div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">ISBN: {b.isbn || 'N/A'} • Rack: {b.rack_number || 'General'}</div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  {isLibrarianOrAdmin && (
                    <>
                      <button
                        onClick={() => handleOpenIssue(b)}
                        disabled={b.available_copies <= 0}
                        className="flex-1 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 disabled:opacity-40 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        Issue Book
                      </button>
                      <button onClick={() => handleOpenBookModal(b)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteBook(b.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ISSUES & BORROWING */}
      {activeTab === 'issues' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-4">Book</th>
                <th className="py-3 px-4">Borrower</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Fine</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {issues.map((iss) => (
                <tr key={iss.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-bold text-white">{iss.book_title}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{iss.student_name || iss.user_name || 'Borrower'}</td>
                  <td className="py-3 px-4 text-slate-400">{iss.issue_date}</td>
                  <td className="py-3 px-4 text-slate-400">{iss.due_date}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold ${iss.status === 'Returned' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : iss.status === 'Overdue' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'}`}>
                      {iss.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                    ${iss.fine_amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isLibrarianOrAdmin && iss.status !== 'Returned' && (
                      <button
                        onClick={() => handleOpenReturn(iss)}
                        className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                      >
                        Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD/EDIT BOOK MODAL */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">{editingBook ? 'Edit Book' : 'Add New Book'}</h3>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {err && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{err}</div>}

            <form onSubmit={handleSaveBook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Author *</label>
                  <input
                    type="text"
                    required
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">ISBN</label>
                  <input
                    type="text"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Category</label>
                  <select
                    value={bookForm.category}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Rack / Shelf</label>
                  <input
                    type="text"
                    placeholder="e.g. A-12"
                    value={bookForm.rack_number}
                    onChange={(e) => setBookForm({ ...bookForm, rack_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Total Copies</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bookForm.total_copies}
                    onChange={(e) => setBookForm({ ...bookForm, total_copies: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowBookModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold">Save Book</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ISSUE BOOK MODAL */}
      {showIssueModal && selectedBookToIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Issue Book: {selectedBookToIssue.title}</h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {err && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{err}</div>}

            <form onSubmit={handleIssueBook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Student Borrower *</label>
                <select
                  value={issueForm.student_id}
                  onChange={(e) => setIssueForm({ ...issueForm, student_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                >
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name || `${s.first_name} ${s.last_name}`} ({s.admission_number})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Due Return Date *</label>
                <input
                  type="date"
                  required
                  value={issueForm.due_date}
                  onChange={(e) => setIssueForm({ ...issueForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowIssueModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold">Issue to Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN BOOK MODAL */}
      {showReturnModal && returnIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Return Book: {returnIssue.book_title}</h3>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleConfirmReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Overdue Fine ($)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={returnFine}
                  onChange={(e) => setReturnFine(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Good condition"
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowReturnModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold">Confirm Return</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;
