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
  ChevronLeft,
  ChevronRight,
  Filter,
  Palmtree,
  Award,
  BookOpen,
  PartyPopper,
  Bell,
  Sun
} from 'lucide-react';

const EVENT_TYPES = [
  { name: 'Holiday', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30 icon-rose' },
  { name: 'Exam', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { name: 'Parent Teacher Meeting', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { name: 'Sports Day', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { name: 'Annual Day', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { name: 'School Trip', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { name: 'Other', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' }
];

// Official Complete Yearly Holidays List 2026 (Pakistan Public & School Holidays)
const YEARLY_OFFICIAL_HOLIDAYS_2026 = [
  { id: 'pk-1', title: "New Year's Day", event_type: 'Holiday', start_date: '2026-01-01', end_date: '2026-01-01', description: "New Year's Day Celebration", location: 'Countrywide', audience: 'All' },
  { id: 'pk-2', title: 'January 1 Bank Holiday', event_type: 'Holiday', start_date: '2026-01-01', end_date: '2026-01-01', description: 'Bank Holiday', location: 'Banks / Financial Institutions', audience: 'All' },
  { id: 'pk-3', title: 'Shab e-Meraj', event_type: 'Holiday', start_date: '2026-01-17', end_date: '2026-01-17', description: 'Religious Observance', location: 'Countrywide', audience: 'All' },
  { id: 'pk-4', title: 'Basant Panchami', event_type: 'Holiday', start_date: '2026-01-23', end_date: '2026-01-23', description: 'Cultural Celebration', location: 'Regional', audience: 'All' },
  { id: 'pk-5', title: 'Shab e-Barat', event_type: 'Holiday', start_date: '2026-02-04', end_date: '2026-02-04', description: 'Religious Observance', location: 'Countrywide', audience: 'All' },
  { id: 'pk-6', title: 'Kashmir Day', event_type: 'Holiday', start_date: '2026-02-05', end_date: '2026-02-05', description: 'National Public Holiday', location: 'Countrywide', audience: 'All' },
  { id: 'pk-7', title: 'Shivaratri', event_type: 'Holiday', start_date: '2026-02-16', end_date: '2026-02-16', description: 'Hindu Community Festival', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-8', title: 'Ramadan Start', event_type: 'Holiday', start_date: '2026-02-19', end_date: '2026-02-19', description: 'First Day of Holy Month Ramadan', location: 'Countrywide', audience: 'All' },
  { id: 'pk-9', title: 'Ramadan Bank Holiday', event_type: 'Holiday', start_date: '2026-02-19', end_date: '2026-02-19', description: 'Bank Holiday on 1st Ramadan', location: 'Financial Institutions', audience: 'All' },
  { id: 'pk-10', title: 'Dulhandi', event_type: 'Holiday', start_date: '2026-03-03', end_date: '2026-03-03', description: 'Minority Festival Observance', location: 'Countrywide', audience: 'All' },
  { id: 'pk-11', title: 'Holi', event_type: 'Holiday', start_date: '2026-03-04', end_date: '2026-03-04', description: 'Hindu Festival of Colors', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-12', title: 'Eid-ul-Fitr Holiday', event_type: 'Holiday', start_date: '2026-03-20', end_date: '2026-03-20', description: 'Eid Holiday Day 1', location: 'Countrywide', audience: 'All' },
  { id: 'pk-13', title: 'Eid-ul-Fitr Day', event_type: 'Holiday', start_date: '2026-03-21', end_date: '2026-03-21', description: 'Eid-ul-Fitr Main Celebration', location: 'Countrywide', audience: 'All' },
  { id: 'pk-14', title: 'Eid-ul-Fitr Holiday', event_type: 'Holiday', start_date: '2026-03-22', end_date: '2026-03-22', description: 'Eid Holiday Day 2', location: 'Countrywide', audience: 'All' },
  { id: 'pk-15', title: 'Pakistan Day', event_type: 'Holiday', start_date: '2026-03-23', end_date: '2026-03-23', description: 'National Resolution Day', location: 'Countrywide', audience: 'All' },
  { id: 'pk-16', title: 'Eid-ul-Fitr Holiday', event_type: 'Holiday', start_date: '2026-03-23', end_date: '2026-03-23', description: 'Eid Holiday Day 3', location: 'Countrywide', audience: 'All' },
  { id: 'pk-17', title: 'Good Friday', event_type: 'Holiday', start_date: '2026-04-03', end_date: '2026-04-03', description: 'Christian Community Holiday', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-18', title: 'Easter Sunday', event_type: 'Holiday', start_date: '2026-04-05', end_date: '2026-04-05', description: 'Christian Easter Sunday', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-19', title: 'Easter Monday', event_type: 'Holiday', start_date: '2026-04-06', end_date: '2026-04-06', description: 'Christian Easter Monday Holiday', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-20', title: 'Baisakhi', event_type: 'Holiday', start_date: '2026-04-14', end_date: '2026-04-14', description: 'Sikh Harvest & Festival Day', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-21', title: 'Ridván', event_type: 'Holiday', start_date: '2026-04-21', end_date: '2026-04-21', description: 'Baháʼí Faith Festival', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-22', title: 'Labour Day', event_type: 'Holiday', start_date: '2026-05-01', end_date: '2026-05-01', description: 'International Workers Day', location: 'Countrywide', audience: 'All' },
  { id: 'pk-23', title: 'Buddha Purnima', event_type: 'Holiday', start_date: '2026-05-24', end_date: '2026-05-24', description: 'Buddhist Festival', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-24', title: 'Eid al-Adha Day 1', event_type: 'Holiday', start_date: '2026-05-27', end_date: '2026-05-27', description: 'Feast of Sacrifice Main Day', location: 'Countrywide', audience: 'All' },
  { id: 'pk-25', title: 'Youm-i-Takbeer', event_type: 'Holiday', start_date: '2026-05-28', end_date: '2026-05-28', description: 'National Defense & Science Commemoration', location: 'Countrywide', audience: 'All' },
  { id: 'pk-26', title: 'Eid al-Adha Holiday Day 2', event_type: 'Holiday', start_date: '2026-05-28', end_date: '2026-05-28', description: 'Eid al-Adha Holiday Break', location: 'Countrywide', audience: 'All' },
  { id: 'pk-27', title: 'Eid al-Adha Holiday Day 3', event_type: 'Holiday', start_date: '2026-05-29', end_date: '2026-05-29', description: 'Eid al-Adha Holiday Break', location: 'Countrywide', audience: 'All' },
  { id: 'pk-28', title: 'Ashura Holiday (9th Muharram)', event_type: 'Holiday', start_date: '2026-06-25', end_date: '2026-06-25', description: 'Islamic Observance', location: 'Countrywide', audience: 'All' },
  { id: 'pk-29', title: 'Ashura Day (10th Muharram)', event_type: 'Holiday', start_date: '2026-06-26', end_date: '2026-06-26', description: 'Islamic Observance Main Day', location: 'Countrywide', audience: 'All' },
  { id: 'pk-30', title: 'July 1 Bank Holiday', event_type: 'Holiday', start_date: '2026-07-01', end_date: '2026-07-01', description: 'Mid-Year Bank Holiday', location: 'Financial Institutions', audience: 'All' },
  { id: 'pk-31', title: 'Chelum', event_type: 'Holiday', start_date: '2026-08-04', end_date: '2026-08-04', description: 'Islamic Religious Observance', location: 'Countrywide', audience: 'All' },
  { id: 'pk-32', title: 'Independence Day', event_type: 'Holiday', start_date: '2026-08-14', end_date: '2026-08-14', description: 'Pakistan Independence Celebration', location: 'Countrywide', audience: 'All' },
  { id: 'pk-33', title: 'Nauroz', event_type: 'Holiday', start_date: '2026-08-15', end_date: '2026-08-15', description: 'Parsi New Year Observance', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-34', title: 'Birthday of Lord Zoroaster (Khordad Sal)', event_type: 'Holiday', start_date: '2026-08-20', end_date: '2026-08-20', description: 'Zoroastrian Festival', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-35', title: 'Eid Milad un-Nabi', event_type: 'Holiday', start_date: '2026-08-26', end_date: '2026-08-26', description: 'Holy Prophet Birthday (12 Rabi-ul-Awwal)', location: 'Countrywide', audience: 'All' },
  { id: 'pk-36', title: 'Janmashtami', event_type: 'Holiday', start_date: '2026-09-04', end_date: '2026-09-04', description: 'Hindu Festival Observance', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-37', title: 'Defence Day', event_type: 'Holiday', start_date: '2026-09-06', end_date: '2026-09-06', description: 'Pakistan Armed Forces Commemoration', location: 'Countrywide', audience: 'All' },
  { id: 'pk-38', title: 'Giarhwin Sharief', event_type: 'Holiday', start_date: '2026-09-23', end_date: '2026-09-23', description: 'Religious Observance Day', location: 'Countrywide', audience: 'All' },
  { id: 'pk-39', title: 'Durga Puja', event_type: 'Holiday', start_date: '2026-10-19', end_date: '2026-10-19', description: 'Hindu Festival Celebration', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-40', title: 'Dussehra', event_type: 'Holiday', start_date: '2026-10-20', end_date: '2026-10-20', description: 'Hindu Festival Celebration', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-41', title: 'Birthday of Guru Balmik Sawami Ji', event_type: 'Holiday', start_date: '2026-10-26', end_date: '2026-10-26', description: 'Minority Commemoration Day', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-42', title: 'Iqbal Day', event_type: 'Holiday', start_date: '2026-11-09', end_date: '2026-11-09', description: 'Poet of the East Allama Iqbal Birthday', location: 'Countrywide', audience: 'All' },
  { id: 'pk-43', title: 'Diwali', event_type: 'Holiday', start_date: '2026-11-09', end_date: '2026-11-09', description: 'Hindu Festival of Lights', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-44', title: "Guru Nanak's Birthday", event_type: 'Holiday', start_date: '2026-11-24', end_date: '2026-11-24', description: 'Sikh Guru Nanak Jayanti Celebration', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-45', title: 'Christmas Eve', event_type: 'Holiday', start_date: '2026-12-24', end_date: '2026-12-24', description: 'Christian Observance', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-46', title: 'Christmas Day & Quaid-e-Azam Day', event_type: 'Holiday', start_date: '2026-12-25', end_date: '2026-12-25', description: 'Founder Birthday & Christmas Public Holiday', location: 'Countrywide', audience: 'All' },
  { id: 'pk-47', title: 'Day After Christmas (Christians only)', event_type: 'Holiday', start_date: '2026-12-26', end_date: '2026-12-26', description: 'Christian Community Holiday', location: 'Minority Observance', audience: 'All' },
  { id: 'pk-48', title: "New Year's Eve", event_type: 'Holiday', start_date: '2026-12-31', end_date: '2026-12-31', description: "New Year's Eve", location: 'Countrywide', audience: 'All' }
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const EventsCalendar = () => {
  const { user } = useAuth();
  const roleName = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isAdmin = ['Super Admin', 'School Admin', 'Principal', 'Admin', 'Teacher'].includes(roleName) || !user;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (Month View) | 'list' (List View) | 'holidays' (Official Holidays List)

  // Current Month / Year Navigation
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // Default Sep 2026
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);

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

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/events');
      let combined = res.data && res.data.length > 0 ? res.data : [];
      
      // Merge with official holidays if not existing
      const localCustoms = JSON.parse(localStorage.getItem('demo_events') || '[]');
      const allEventsMap = new Map();

      YEARLY_OFFICIAL_HOLIDAYS_2026.forEach(h => allEventsMap.set(h.id, h));
      localCustoms.forEach(c => allEventsMap.set(c.id, c));
      combined.forEach(e => allEventsMap.set(e.id, e));

      setEvents(Array.from(allEventsMap.values()));
    } catch (e) {
      console.warn('API events unavailable, loading presets and local storage:', e);
      const localCustoms = JSON.parse(localStorage.getItem('demo_events') || '[]');
      const allEventsMap = new Map();
      YEARLY_OFFICIAL_HOLIDAYS_2026.forEach(h => allEventsMap.set(h.id, h));
      localCustoms.forEach(c => allEventsMap.set(c.id, c));
      setEvents(Array.from(allEventsMap.values()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setErr('');
    const newEvent = {
      id: Date.now(),
      ...form
    };

    try {
      await API.post('/api/events', form);
      setMsg('Event scheduled successfully!');
    } catch (error) {
      console.warn('API post event failed, saving locally:', error);
      const existing = JSON.parse(localStorage.getItem('demo_events') || '[]');
      const updated = [newEvent, ...existing];
      localStorage.setItem('demo_events', JSON.stringify(updated));
      setMsg('Event scheduled successfully (Local Mode)!');
    } finally {
      setShowModal(false);
      setTimeout(() => setMsg(''), 4000);
      fetchEvents();
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to remove this calendar entry?')) return;
    try {
      await API.delete(`/api/events/${id}`);
    } catch (error) {
      console.warn('API delete event failed, removing locally:', error);
    } finally {
      const existing = JSON.parse(localStorage.getItem('demo_events') || '[]');
      const updated = existing.filter(e => e.id !== id);
      localStorage.setItem('demo_events', JSON.stringify(updated));
      setEvents(prev => prev.filter(e => e.id !== id));
      setMsg('Event entry removed.');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const getEventBadge = (type) => {
    const found = EVENT_TYPES.find(t => t.name === type);
    return found ? found.color : 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  };

  // Calendar Month Grid Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 to 11

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build Grid Cells
  const calendarCells = [];
  // Empty slots before 1st day
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  // Month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({ day, dateStr });
  }

  // Filtered Events
  const filteredEvents = events.filter(ev => {
    if (typeFilter && ev.event_type !== typeFilter) return false;
    return true;
  });

  // Current Month's Events
  const currentMonthEvents = filteredEvents.filter(ev => {
    if (!ev.start_date) return false;
    const evDate = new Date(ev.start_date);
    return evDate.getFullYear() === year && evDate.getMonth() === month;
  });

  // Official Holidays Count
  const holidaysCount = events.filter(e => e.event_type === 'Holiday').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-card border border-slate-800 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold mb-3">
              <CalendarIcon className="w-3.5 h-3.5 text-purple-400" /> Official Academic Calendar 2026
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              School Events & Yearly Holidays
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Month-by-month calendar view, official national & religious holidays list, exams, sports days, and school functions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30 shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Event / Holiday
              </button>
            )}
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* VIEW & FILTER CONTROLS BAR */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* View Tabs */}
        <div className="flex items-center space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'grid'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon size={14} />
            <span>Month Grid View</span>
          </button>

          <button
            onClick={() => setViewMode('holidays')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'holidays'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palmtree size={14} />
            <span>Yearly Holidays ({holidaysCount})</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter size={14} />
            <span>All Events List</span>
          </button>
        </div>

        {/* Filter by Event Type */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl glass-input text-slate-200 focus:outline-none bg-slate-900"
          >
            <option value="">All Event Categories</option>
            {EVENT_TYPES.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: MONTH-WISE GRID CALENDAR */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {/* Month Navigation Header */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-extrabold text-slate-100">
                {MONTH_NAMES[month]} <span className="text-purple-400">{year}</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
                {currentMonthEvents.length} Events This Month
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
                title="Previous Month"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Today
              </button>

              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
                title="Next Month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Grid Calendar Table */}
          <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl p-4">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-800">
              <div className="text-rose-400">Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div className="text-amber-400">Sat</div>
            </div>

            {/* Calendar Days Cells */}
            <div className="grid grid-cols-7 gap-2 pt-3">
              {calendarCells.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="h-28 rounded-2xl bg-slate-950/20 opacity-30"></div>;
                }

                // Find events on this date
                const dayEvents = filteredEvents.filter(ev => {
                  if (!ev.start_date) return false;
                  return (
                    cell.dateStr >= ev.start_date &&
                    cell.dateStr <= (ev.end_date || ev.start_date)
                  );
                });

                const isToday = new Date().toISOString().split('T')[0] === cell.dateStr;
                const isSunday = idx % 7 === 0;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => dayEvents.length > 0 && setSelectedDayEvents({ date: cell.dateStr, day: cell.day, events: dayEvents })}
                    className={`h-28 rounded-2xl p-2 flex flex-col justify-between border transition relative overflow-hidden group cursor-pointer ${
                      isToday
                        ? 'bg-indigo-950/60 border-indigo-500/60 ring-2 ring-indigo-500/30'
                        : isSunday
                        ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-extrabold ${isToday ? 'text-indigo-400 font-mono text-sm' : isSunday ? 'text-rose-400' : 'text-slate-200'}`}>
                        {cell.day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                      )}
                    </div>

                    {/* Event Chips inside Cell */}
                    <div className="space-y-1 overflow-y-auto max-h-16 custom-scrollbar">
                      {dayEvents.slice(0, 2).map(ev => (
                        <div
                          key={ev.id}
                          className={`text-[10px] p-1 rounded-md font-bold truncate border ${getEventBadge(ev.event_type)}`}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-purple-300 font-bold text-center">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OFFICIAL YEARLY HOLIDAYS LIST */}
      {viewMode === 'holidays' && (
        <div className="space-y-4">
          <div className="glass-card p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Palmtree size={16} />
                <span>Annual Public Holidays</span>
              </div>
              <h2 className="text-xl font-bold text-slate-100">National & Religious School Holidays (2026)</h2>
              <p className="text-xs text-slate-400 mt-1">Official gazetted public holidays, religious breaks, and summer/winter vacations.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.filter(e => e.event_type === 'Holiday').map(h => (
              <div key={h.id} className="glass-card p-5 rounded-2xl border border-rose-500/20 bg-rose-950/10 hover:border-rose-500/40 transition space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                    Official Holiday
                  </span>
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Clock size={12} className="text-rose-400" />
                    {h.start_date} {h.start_date !== h.end_date ? `to ${h.end_date}` : ''}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-100">{h.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{h.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-emerald-400" /> {h.location || 'Countrywide'}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteEvent(h.id)}
                      className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ALL EVENTS LIST */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredEvents.map((ev) => (
            <div key={ev.id} className="glass-card border border-slate-800 rounded-3xl p-5 backdrop-blur-xl flex flex-col justify-between group hover:border-purple-500/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getEventBadge(ev.event_type)}`}>
                    {ev.event_type}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-500" /> {ev.audience}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                  {ev.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2">{ev.description || 'No additional details.'}</p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-slate-300 font-mono">
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
                  <button onClick={() => handleDeleteEvent(ev.id)} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* DAY EVENTS DETAILS MODAL */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedDayEvents(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100">
                Events on Day {selectedDayEvents.day}
              </h3>
              <p className="text-xs text-purple-400 font-mono">{selectedDayEvents.date}</p>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {selectedDayEvents.events.map(ev => (
                <div key={ev.id} className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getEventBadge(ev.event_type)}`}>
                      {ev.event_type}
                    </span>
                    <span className="text-[10px] text-slate-400">{ev.audience}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">{ev.title}</h4>
                  <p className="text-xs text-slate-400">{ev.description || 'No description'}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100">Schedule School Event / Holiday</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            {err && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{err}</div>}
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Event / Holiday Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kashmir Day / Sports Day / Mid-Term Exams"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 glass-input focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Event Category *</label>
                  <select
                    value={form.event_type}
                    onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 glass-input focus:outline-none"
                  >
                    {EVENT_TYPES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Audience</label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 glass-input focus:outline-none"
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
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 glass-input focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 glass-input focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Location / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Countrywide / Main Auditorium / Ground"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 glass-input focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Description / Details</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Additional details about the holiday or event..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 glass-input focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30">Schedule Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsCalendar;
