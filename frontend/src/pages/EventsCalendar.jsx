import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  Plus,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Trash2,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const EVENT_TYPES = [
  { name: 'Exam', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { name: 'Holiday', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { name: 'Parent Teacher Meeting', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { name: 'Sports Day', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { name: 'Annual Day', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { name: 'School Trip', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { name: 'Other', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' }
];

const EventsCalendar = () => {
  const { user } = useAuth();
  const roleName = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isAdmin = ['Super Admin', 'School Admin', 'Principal'].includes(roleName);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'Holiday',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    location: '',
    audience: 'All'
  });

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/events');
      setEvents(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await API.post('/api/events', form);
      setShowModal(false);
      setMsg('Event scheduled successfully!');
      setTimeout(() => setMsg(''), 4000);
      fetchEvents();
    } catch (error) {
      setErr(error.response?.data?.detail || 'Failed to create event');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await API.delete(`/api/events/${id}`);
      fetchEvents();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete event');
    }
  };

  const getEventBadge = (type) => {
    const found = EVENT_TYPES.find(t => t.name === type);
    return found ? found.color : 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/50 via-slate-900/60 to-pink-900/50 border border-slate-800 p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-3">
              <CalendarIcon className="w-3.5 h-3.5" /> School Year Schedule
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Events & School Calendar</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Stay synchronized with examinations, national holidays, parent-teacher conferences, and extracurricular events.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
            >
              <Plus className="w-4 h-4" /> Add New Event
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

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {events.map((ev) => (
          <div key={ev.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between group hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getEventBadge(ev.event_type)}`}>
                  {ev.event_type}
                </span>
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-500" /> {ev.audience}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                {ev.title}
              </h3>
              <p className="text-xs text-slate-400 mt-2">{ev.description || 'No additional details.'}</p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>{ev.start_date} {ev.start_date !== ev.end_date ? `to ${ev.end_date}` : ''}</span>
                </div>
                {ev.location && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{ev.location}</span>
                  </div>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <button onClick={() => handleDeleteEvent(ev.id)} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CREATE EVENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Schedule Event</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            {err && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{err}</div>}
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Examination Week"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Event Type *</label>
                  <select
                    value={form.event_type}
                    onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    {EVENT_TYPES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Target Audience</label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    <option value="All">All School</option>
                    <option value="Students">Students Only</option>
                    <option value="Teachers">Teachers Only</option>
                    <option value="Parents">Parents Only</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Location / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Main Auditorium / Ground"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description / Notes</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold">Schedule Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsCalendar;
