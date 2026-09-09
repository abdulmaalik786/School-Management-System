import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Plus,
  Pin,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Trash2,
  X,
  User,
  Clock,
  Megaphone
} from 'lucide-react';

const CATEGORIES = ['General', 'Exam', 'Fee', 'Holiday', 'Attendance', 'Emergency'];

const Announcements = () => {
  const { user } = useAuth();
  const roleName = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isAdminOrTeacher = ['Super Admin', 'School Admin', 'Principal', 'Teacher'].includes(roleName);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'General',
    target_role: 'All',
    is_pinned: false
  });

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, [selectedCategory]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const url = selectedCategory ? `/api/announcements?category=${selectedCategory}` : '/api/announcements';
      const res = await API.get(url);
      setAnnouncements(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await API.post('/api/announcements', form);
      setShowModal(false);
      setMsg('Announcement broadcasted successfully!');
      setTimeout(() => setMsg(''), 4000);
      fetchAnnouncements();
    } catch (error) {
      setErr(error.response?.data?.detail || 'Failed to post announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await API.delete(`/api/announcements/${id}`);
      fetchAnnouncements();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete announcement');
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Emergency':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Exam':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Fee':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Holiday':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'Attendance':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/50 via-slate-900/60 to-indigo-900/50 border border-slate-800 p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
              <Megaphone className="w-3.5 h-3.5" /> Notice Board
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Announcements & Notices</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Official school announcements, emergency alerts, fee notices, and holiday schedules.
            </p>
          </div>
          {isAdminOrTeacher && (
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" /> Post Notice
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {msg}
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedCategory === ''
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Notices
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notice List */}
      <div className="space-y-4">
        {announcements.map((a) => (
          <div
            key={a.id}
            className={`p-6 rounded-2xl border backdrop-blur-xl transition-all ${
              a.is_pinned
                ? 'bg-indigo-950/40 border-indigo-500/40 shadow-lg shadow-indigo-950/50'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.is_pinned && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCategoryBadge(a.category)}`}>
                    {a.category}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Audience: <strong className="text-white">{a.target_role}</strong>
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight">{a.title}</h3>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{a.content}</p>

                <div className="pt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>Author: <strong className="text-slate-300">{a.author_name || 'Administration'}</strong></span>
                  <span>•</span>
                  <span>{new Date(a.created_at).toLocaleString()}</span>
                </div>
              </div>

              {isAdminOrTeacher && (
                <button
                  onClick={() => handleDeleteAnnouncement(a.id)}
                  className="text-slate-500 hover:text-rose-400 p-2 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE NOTICE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Post Announcement</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            {err && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{err}</div>}
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule for Mid-Term Examination 2026"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Target Role</label>
                  <select
                    value={form.target_role}
                    onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    <option value="All">All Users</option>
                    <option value="Student">Students Only</option>
                    <option value="Teacher">Teachers Only</option>
                    <option value="Parent">Parents Only</option>
                    <option value="Accountant">Accountants Only</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Notice Content *</label>
                <textarea
                  rows="5"
                  required
                  placeholder="Enter full notice announcement details..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={form.is_pinned}
                  onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                  className="rounded border-slate-800 text-blue-600 focus:ring-0"
                />
                <label htmlFor="pinCheck" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Pin this announcement to top of dashboard & notice board
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold">Publish Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
