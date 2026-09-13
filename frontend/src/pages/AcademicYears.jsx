import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';

const AcademicYears = () => {
  const { user } = useAuth();
  const userRoleName = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isManagement = ['Super Admin', 'School Admin', 'Principal', 'Admin'].includes(userRoleName) || !user;

  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editYear, setEditYear] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false
  });

  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchYears = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/academic-years');
      setYears(res.data);
    } catch (err) {
      console.error('Failed to fetch academic years:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '2028-2029',
      start_date: '2028-08-01',
      end_date: '2029-06-30',
      is_active: false
    });
    setEditYear(null);
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (y) => {
    setEditYear(y);
    setFormData({
      name: y.name,
      start_date: y.start_date,
      end_date: y.end_date,
      is_active: y.is_active
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (editYear) {
        await API.put(`/api/academic-years/${editYear.id}`, formData);
        setSuccessMsg('Academic Year updated!');
      } else {
        await API.post('/api/academic-years', formData);
        setSuccessMsg('Academic Year created!');
      }
      setShowAddModal(false);
      fetchYears();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save academic year');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      await API.post(`/api/academic-years/${id}/activate`);
      setSuccessMsg('Academic Year activated as primary school term!');
      fetchYears();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to activate academic year');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar size={16} />
            <span>Academic Calendar</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100">Academic Years</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure school sessions, term durations, and active academic year
          </p>
        </div>

        {isManagement && (
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 flex items-center space-x-2 transition shrink-0"
          >
            <Plus size={16} />
            <span>Create Academic Year</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading academic sessions...
          </div>
        ) : years.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No academic years configured.
          </div>
        ) : (
          years.map((y) => (
            <div
              key={y.id}
              className={`glass-card p-6 rounded-3xl border transition relative flex flex-col justify-between ${
                y.is_active
                  ? 'border-indigo-500/50 bg-gradient-to-b from-indigo-950/40 to-slate-900 shadow-xl shadow-indigo-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar size={18} className={y.is_active ? 'text-indigo-400' : 'text-slate-400'} />
                    <h3 className="text-xl font-black text-slate-100">{y.name}</h3>
                  </div>

                  {y.is_active ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center">
                      <Sparkles size={12} className="mr-1" /> Active Session
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs py-2">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Start Date:</span>
                    <span className="font-semibold text-slate-200">{y.start_date}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">End Date:</span>
                    <span className="font-semibold text-slate-200">{y.end_date}</span>
                  </div>
                </div>
              </div>

              {isManagement && (
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-4">
                  {!y.is_active ? (
                    <button
                      onClick={() => handleActivate(y.id)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                    >
                      Set Active
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center">
                      <CheckCircle2 size={14} className="mr-1" /> Current Active Term
                    </span>
                  )}

                  <button
                    onClick={() => handleOpenEdit(y)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Edit Session"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-100 mb-1">
              {editYear ? 'Edit Academic Year' : 'Create Academic Year'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">Configure academic session period and active status</p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Session Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-2027"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active_cb"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500"
                />
                <label htmlFor="is_active_cb" className="text-slate-300 font-semibold cursor-pointer">
                  Set as current active academic session
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold transition shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editYear ? 'Update Year' : 'Create Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicYears;
