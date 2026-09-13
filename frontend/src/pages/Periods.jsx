import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Coffee,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';

const Periods = () => {
  const { user } = useAuth();
  const userRoleName = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isManagement = ['Super Admin', 'School Admin', 'Principal', 'Admin'].includes(userRoleName) || !user;

  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editPeriod, setEditPeriod] = useState(null);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:40');
  const [sortOrder, setSortOrder] = useState('1');
  const [isBreak, setIsBreak] = useState(false);

  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/periods');
      setPeriods(res.data);
    } catch (err) {
      console.error('Failed to fetch periods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handleOpenAdd = () => {
    setName('');
    setStartTime('08:00');
    setEndTime('08:40');
    setSortOrder((periods.length + 1).toString());
    setIsBreak(false);
    setEditPeriod(null);
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditPeriod(p);
    setName(p.name);
    // Format HH:MM from HH:MM:SS
    setStartTime(p.start_time ? p.start_time.substring(0, 5) : '08:00');
    setEndTime(p.end_time ? p.end_time.substring(0, 5) : '08:40');
    setSortOrder(p.sort_order.toString());
    setIsBreak(p.is_break);
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const payload = {
        name,
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
        sort_order: parseInt(sortOrder) || 1,
        is_break: isBreak
      };

      if (editPeriod) {
        await API.put(`/api/periods/${editPeriod.id}`, payload);
        setSuccessMsg('Period updated successfully!');
      } else {
        await API.post('/api/periods', payload);
        setSuccessMsg('Period created successfully!');
      }

      setShowModal(false);
      fetchPeriods();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save period');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id, periodName) => {
    if (!window.confirm(`Are you sure you want to delete "${periodName}"? All timetable entries associated with this period will also be removed.`)) {
      return;
    }

    try {
      await API.delete(`/api/periods/${id}`);
      setSuccessMsg(`Period "${periodName}" deleted successfully!`);
      fetchPeriods();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete period');
    }
  };

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [hh, mm] = timeStr.split(':');
      const hour = parseInt(hh, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${mm} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Clock size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Period & Bell Schedule Management</h1>
            <p className="text-xs text-slate-400">Configure daily school period timings, slots, intervals, and breaks</p>
          </div>
        </div>

        {isManagement && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition self-start md:self-auto"
          >
            <Plus size={16} />
            <span>Add New Period</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Visual Timeline Schedule Preview */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
          <Calendar size={16} className="text-indigo-400" />
          <span>Daily Bell Schedule Timeline</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {periods.map((p) => (
            <div
              key={p.id}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-medium ${
                p.is_break
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              }`}
            >
              {p.is_break ? <Coffee size={14} className="shrink-0 text-amber-400" /> : <Clock size={14} className="shrink-0 text-indigo-400" />}
              <span className="font-bold">{p.name}</span>
              <span className="text-[11px] opacity-75">
                ({formatTimeDisplay(p.start_time)} - {formatTimeDisplay(p.end_time)})
              </span>
            </div>
          ))}
          {periods.length === 0 && !loading && (
            <span className="text-xs text-slate-500 italic">No periods defined yet.</span>
          )}
        </div>
      </div>

      {/* Periods Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers size={18} className="text-slate-400" />
            <h2 className="text-sm font-bold text-slate-100">All Scheduled Periods ({periods.length})</h2>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading periods...</div>
        ) : periods.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
              <Clock size={24} />
            </div>
            <p className="text-sm font-medium text-slate-300">No periods created yet</p>
            <p className="text-xs text-slate-500">Create periods to set up class and teacher timetables.</p>
            {isManagement && (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                Add First Period
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Order</th>
                  <th className="py-3.5 px-4">Period Name</th>
                  <th className="py-3.5 px-4">Start Time</th>
                  <th className="py-3.5 px-4">End Time</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Type</th>
                  {isManagement && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {periods.map((p) => {
                  // Calculate rough duration
                  let durationMin = null;
                  if (p.start_time && p.end_time) {
                    const [sH, sM] = p.start_time.split(':').map(Number);
                    const [eH, eM] = p.end_time.split(':').map(Number);
                    durationMin = (eH * 60 + eM) - (sH * 60 + sM);
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">#{p.sort_order}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-100 flex items-center space-x-2">
                        {p.is_break ? (
                          <Coffee size={14} className="text-amber-400" />
                        ) : (
                          <Clock size={14} className="text-indigo-400" />
                        )}
                        <span>{p.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{formatTimeDisplay(p.start_time)}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{formatTimeDisplay(p.end_time)}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {durationMin ? `${durationMin} mins` : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.is_break ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Break / Recess
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Academic Period
                          </span>
                        )}
                      </td>
                      {isManagement && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="Edit Period"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                              title="Delete Period"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-2xl p-6 shadow-2xl border border-slate-800 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  {editPeriod ? 'Edit Period Timing' : 'Add New Period'}
                </h3>
                <p className="text-xs text-slate-400">Configure period label, bell timing, and type</p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Period Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Period 1, Break, Period 2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBreak}
                      onChange={(e) => setIsBreak(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-0 focus:outline-none w-4 h-4 bg-slate-900 border-slate-700"
                    />
                    <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1">
                      <Coffee size={14} className="text-amber-400" />
                      <span>Is Break / Recess</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editPeriod ? 'Update Period' : 'Create Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Periods;
