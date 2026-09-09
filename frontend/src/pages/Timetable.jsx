import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
  DoorOpen,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Filter,
  Printer,
  Layers,
  Search,
  Coffee,
  User,
  School
} from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Timetable = () => {
  const { user } = useAuth();
  const isManagement = ['Super Admin', 'School Admin', 'Principal'].includes(user?.role?.name);
  const isTeacher = user?.role?.name === 'Teacher';

  // Navigation Subtabs: 'class' | 'teacher' | 'room' | 'manage'
  const [activeTab, setActiveTab] = useState(isTeacher ? 'teacher' : 'class');

  // Master Data
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [modalAyId, setModalAyId] = useState('');
  const [modalClassId, setModalClassId] = useState('');
  const [modalSectionId, setModalSectionId] = useState('');
  const [modalSubjectId, setModalSubjectId] = useState('');
  const [modalTeacherId, setModalTeacherId] = useState('');
  const [modalPeriodId, setModalPeriodId] = useState('');
  const [modalDay, setModalDay] = useState('Monday');
  const [modalRoom, setModalRoom] = useState('');

  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Load all master dependencies & entries
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ayRes, clsRes, secRes, subjRes, tchRes, perRes, ttRes] = await Promise.all([
        API.get('/api/academic-years'),
        API.get('/api/classes'),
        API.get('/api/sections'),
        API.get('/api/subjects'),
        API.get('/api/teachers'),
        API.get('/api/periods'),
        API.get('/api/timetable')
      ]);

      setAcademicYears(ayRes.data);
      setClasses(clsRes.data);
      setSections(secRes.data);
      setSubjects(subjRes.data);
      setTeachers(tchRes.data);
      setPeriods(perRes.data);
      setTimetableEntries(ttRes.data);

      // Default selections
      if (ayRes.data.length > 0) {
        const activeAy = ayRes.data.find(a => a.is_active) || ayRes.data[0];
        setSelectedAcademicYear(activeAy.id.toString());
      }
      if (clsRes.data.length > 0) {
        setSelectedClass(clsRes.data[0].id.toString());
      }
      if (secRes.data.length > 0) {
        setSelectedSection(secRes.data[0].id.toString());
      }
      if (tchRes.data.length > 0) {
        if (isTeacher && user?.teacher_profile) {
          setSelectedTeacher(user.teacher_profile.id.toString());
        } else {
          setSelectedTeacher(tchRes.data[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Failed to load timetable data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered sections based on selected class
  const classSections = sections.filter(s => s.class_id === parseInt(selectedClass));
  const modalClassSections = sections.filter(s => s.class_id === parseInt(modalClassId));

  // Extract distinct room numbers
  const distinctRooms = Array.from(new Set(
    timetableEntries
      .map(e => e.room_number)
      .filter(r => r && r.trim() !== '')
  )).sort();

  // Set default room if empty
  useEffect(() => {
    if (!selectedRoom && distinctRooms.length > 0) {
      setSelectedRoom(distinctRooms[0]);
    }
  }, [distinctRooms]);

  // Open modal to add entry (with optional slot prefill)
  const handleOpenAdd = (day = 'Monday', periodId = null) => {
    setEditEntry(null);
    setModalAyId(selectedAcademicYear || (academicYears[0]?.id?.toString() || ''));
    setModalClassId(selectedClass || (classes[0]?.id?.toString() || ''));
    
    const currSecs = sections.filter(s => s.class_id === parseInt(selectedClass || classes[0]?.id));
    setModalSectionId(selectedSection || (currSecs[0]?.id?.toString() || ''));
    setModalSubjectId(subjects[0]?.id?.toString() || '');
    setModalTeacherId(teachers[0]?.id?.toString() || '');
    setModalPeriodId(periodId ? periodId.toString() : (periods[0]?.id?.toString() || ''));
    setModalDay(day);
    setModalRoom(selectedRoom || 'Room 101');
    setFormError('');
    setShowModal(true);
  };

  // Open modal to edit entry
  const handleOpenEdit = (entry) => {
    setEditEntry(entry);
    setModalAyId(entry.academic_year_id.toString());
    setModalClassId(entry.class_id.toString());
    setModalSectionId(entry.section_id.toString());
    setModalSubjectId(entry.subject_id.toString());
    setModalTeacherId(entry.teacher_id ? entry.teacher_id.toString() : '');
    setModalPeriodId(entry.period_id.toString());
    setModalDay(entry.day_of_week);
    setModalRoom(entry.room_number || '');
    setFormError('');
    setShowModal(true);
  };

  // Submit create or update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const payload = {
        academic_year_id: parseInt(modalAyId),
        class_id: parseInt(modalClassId),
        section_id: parseInt(modalSectionId),
        subject_id: parseInt(modalSubjectId),
        teacher_id: modalTeacherId ? parseInt(modalTeacherId) : null,
        period_id: parseInt(modalPeriodId),
        day_of_week: modalDay,
        room_number: modalRoom.trim() || null
      };

      if (editEntry) {
        await API.put(`/api/timetable/${editEntry.id}`, payload);
        setSuccessMsg('Timetable entry updated successfully!');
      } else {
        await API.post('/api/timetable', payload);
        setSuccessMsg('Timetable entry scheduled successfully!');
      }

      setShowModal(false);
      // Refresh entries
      const ttRes = await API.get('/api/timetable');
      setTimetableEntries(ttRes.data);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to schedule timetable entry');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete entry
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this timetable entry?')) {
      return;
    }

    try {
      await API.delete(`/api/timetable/${id}`);
      setSuccessMsg('Timetable entry removed successfully!');
      const ttRes = await API.get('/api/timetable');
      setTimetableEntries(ttRes.data);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete timetable entry');
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

  // Class Timetable Grid Helper
  const getClassEntryForSlot = (day, periodId) => {
    return timetableEntries.find(
      e =>
        e.day_of_week.toLowerCase() === day.toLowerCase() &&
        e.period_id === periodId &&
        e.class_id === parseInt(selectedClass) &&
        e.section_id === parseInt(selectedSection)
    );
  };

  // Teacher Timetable Grid Helper
  const getTeacherEntryForSlot = (day, periodId) => {
    return timetableEntries.find(
      e =>
        e.day_of_week.toLowerCase() === day.toLowerCase() &&
        e.period_id === periodId &&
        e.teacher_id === parseInt(selectedTeacher)
    );
  };

  // Room Timetable Grid Helper
  const getRoomEntryForSlot = (day, periodId) => {
    if (!selectedRoom) return null;
    return timetableEntries.find(
      e =>
        e.day_of_week.toLowerCase() === day.toLowerCase() &&
        e.period_id === periodId &&
        e.room_number &&
        e.room_number.toLowerCase() === selectedRoom.toLowerCase()
    );
  };

  // Filtered entries for Manage List Tab
  const filteredEntries = timetableEntries.filter(entry => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      !query ||
      (entry.subject_name && entry.subject_name.toLowerCase().includes(query)) ||
      (entry.teacher_name && entry.teacher_name.toLowerCase().includes(query)) ||
      (entry.class_name && entry.class_name.toLowerCase().includes(query)) ||
      (entry.section_name && entry.section_name.toLowerCase().includes(query)) ||
      (entry.room_number && entry.room_number.toLowerCase().includes(query)) ||
      (entry.day_of_week && entry.day_of_week.toLowerCase().includes(query));

    const matchClass = !selectedClass || entry.class_id === parseInt(selectedClass);
    const matchSection = !selectedSection || entry.section_id === parseInt(selectedSection);
    return matchSearch && matchClass && matchSection;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">School Timetable & Scheduling System</h1>
            <p className="text-xs text-slate-400">Class, Teacher, and Room weekly timetables with conflict prevention</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            title="Print Schedule"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          {isManagement && (
            <button
              onClick={() => handleOpenAdd()}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
            >
              <Plus size={16} />
              <span>Schedule Class</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Subtabs */}
      <div className="flex flex-wrap gap-2 p-1.5 glass-card rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('class')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'class'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <BookOpen size={16} />
          <span>Class Timetable</span>
        </button>

        <button
          onClick={() => setActiveTab('teacher')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'teacher'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <GraduationCap size={16} />
          <span>Teacher Timetable</span>
        </button>

        <button
          onClick={() => setActiveTab('room')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'room'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <DoorOpen size={16} />
          <span>Room Usage</span>
        </button>

        <button
          onClick={() => setActiveTab('manage')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'manage'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers size={16} />
          <span>All Scheduled Entries ({timetableEntries.length})</span>
        </button>
      </div>

      {/* TAB 1: CLASS TIMETABLE GRID */}
      {activeTab === 'class' && (
        <div className="space-y-4">
          {/* Class Filter Bar */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Select Class & Section:</span>
            </div>

            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                const s = sections.filter(sec => sec.class_id === parseInt(e.target.value));
                if (s.length > 0) setSelectedSection(s[0].id.toString());
              }}
              className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
              ))}
            </select>

            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
            >
              {classSections.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900">Section {s.name}</option>
              ))}
            </select>

            <div className="text-xs text-slate-400 ml-auto hidden sm:block">
              Click on any empty slot to quickly schedule a class.
            </div>
          </div>

          {/* Weekly Grid */}
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800">
                    <th className="p-3.5 w-28 text-slate-400 uppercase font-semibold text-[11px] border-r border-slate-800">
                      Day / Period
                    </th>
                    {periods.map(p => (
                      <th key={p.id} className={`p-3 text-center border-r border-slate-800 last:border-r-0 ${p.is_break ? 'bg-amber-500/10 text-amber-300' : ''}`}>
                        <div className="font-bold text-slate-100 flex items-center justify-center space-x-1">
                          {p.is_break && <Coffee size={13} className="text-amber-400" />}
                          <span>{p.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatTimeDisplay(p.start_time)} - {formatTimeDisplay(p.end_time)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {DAYS_OF_WEEK.map(day => (
                    <tr key={day} className="hover:bg-slate-800/20 transition">
                      <td className="p-3 font-bold text-slate-200 bg-slate-900/50 border-r border-slate-800">
                        {day}
                      </td>
                      {periods.map(p => {
                        const entry = getClassEntryForSlot(day, p.id);

                        if (p.is_break) {
                          return (
                            <td key={p.id} className="p-2.5 text-center bg-amber-500/5 border-r border-slate-800/70">
                              <div className="flex items-center justify-center space-x-1 text-amber-400/80 text-[11px] font-semibold">
                                <Coffee size={14} />
                                <span>{p.name}</span>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={p.id} className="p-2 border-r border-slate-800/70 relative group align-top">
                            {entry ? (
                              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-500/30 text-slate-200 shadow-md space-y-1 relative">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-indigo-300 text-xs truncate">
                                    {entry.subject_name}
                                  </span>
                                  {entry.subject_code && (
                                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                      {entry.subject_code}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-1 text-[11px] text-slate-300 truncate">
                                  <GraduationCap size={12} className="shrink-0 text-slate-400" />
                                  <span>{entry.teacher_name || 'No Teacher'}</span>
                                </div>
                                {entry.room_number && (
                                  <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-mono">
                                    <DoorOpen size={11} className="shrink-0" />
                                    <span>{entry.room_number}</span>
                                  </div>
                                )}

                                {isManagement && (
                                  <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition bg-slate-900/90 rounded-md p-0.5 shadow">
                                    <button
                                      onClick={() => handleOpenEdit(entry)}
                                      className="p-1 hover:text-indigo-400 transition"
                                      title="Edit Entry"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(entry.id)}
                                      className="p-1 hover:text-red-400 transition"
                                      title="Delete Entry"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              isManagement && (
                                <button
                                  onClick={() => handleOpenAdd(day, p.id)}
                                  className="w-full h-16 rounded-xl border border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex items-center justify-center text-slate-600 hover:text-indigo-400 transition group/btn"
                                >
                                  <Plus size={16} className="opacity-0 group-hover/btn:opacity-100 transition" />
                                </button>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEACHER TIMETABLE GRID */}
      {activeTab === 'teacher' && (
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <User size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Select Teacher:</span>
            </div>

            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id} className="bg-slate-900">
                  {t.user?.full_name || `Teacher #${t.id}`} ({t.department || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Weekly Grid */}
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800">
                    <th className="p-3.5 w-28 text-slate-400 uppercase font-semibold text-[11px] border-r border-slate-800">
                      Day / Period
                    </th>
                    {periods.map(p => (
                      <th key={p.id} className={`p-3 text-center border-r border-slate-800 last:border-r-0 ${p.is_break ? 'bg-amber-500/10 text-amber-300' : ''}`}>
                        <div className="font-bold text-slate-100 flex items-center justify-center space-x-1">
                          {p.is_break && <Coffee size={13} className="text-amber-400" />}
                          <span>{p.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatTimeDisplay(p.start_time)} - {formatTimeDisplay(p.end_time)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {DAYS_OF_WEEK.map(day => (
                    <tr key={day} className="hover:bg-slate-800/20 transition">
                      <td className="p-3 font-bold text-slate-200 bg-slate-900/50 border-r border-slate-800">
                        {day}
                      </td>
                      {periods.map(p => {
                        const entry = getTeacherEntryForSlot(day, p.id);

                        if (p.is_break) {
                          return (
                            <td key={p.id} className="p-2.5 text-center bg-amber-500/5 border-r border-slate-800/70">
                              <div className="flex items-center justify-center space-x-1 text-amber-400/80 text-[11px] font-semibold">
                                <Coffee size={14} />
                                <span>{p.name}</span>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={p.id} className="p-2 border-r border-slate-800/70 align-top">
                            {entry ? (
                              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-500/30 text-slate-200 shadow-md space-y-1">
                                <div className="font-extrabold text-emerald-300 text-xs truncate">
                                  {entry.subject_name}
                                </div>
                                <div className="flex items-center space-x-1 text-[11px] text-slate-300">
                                  <BookOpen size={12} className="shrink-0 text-slate-400" />
                                  <span>{entry.class_name} - Sec {entry.section_name}</span>
                                </div>
                                {entry.room_number && (
                                  <div className="flex items-center space-x-1 text-[10px] text-amber-400 font-mono">
                                    <DoorOpen size={11} className="shrink-0" />
                                    <span>{entry.room_number}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-14 rounded-xl border border-dashed border-slate-800/50 flex items-center justify-center text-slate-600 text-[11px]">
                                Free Period
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROOM USAGE GRID */}
      {activeTab === 'room' && (
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <DoorOpen size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Select Room Number:</span>
            </div>

            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
            >
              {distinctRooms.map(rm => (
                <option key={rm} value={rm} className="bg-slate-900">{rm}</option>
              ))}
            </select>

            {distinctRooms.length === 0 && (
              <span className="text-xs text-slate-500">No rooms assigned yet in timetable.</span>
            )}
          </div>

          {/* Room Weekly Grid */}
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800">
                    <th className="p-3.5 w-28 text-slate-400 uppercase font-semibold text-[11px] border-r border-slate-800">
                      Day / Period
                    </th>
                    {periods.map(p => (
                      <th key={p.id} className={`p-3 text-center border-r border-slate-800 last:border-r-0 ${p.is_break ? 'bg-amber-500/10 text-amber-300' : ''}`}>
                        <div className="font-bold text-slate-100 flex items-center justify-center space-x-1">
                          {p.is_break && <Coffee size={13} className="text-amber-400" />}
                          <span>{p.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatTimeDisplay(p.start_time)} - {formatTimeDisplay(p.end_time)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {DAYS_OF_WEEK.map(day => (
                    <tr key={day} className="hover:bg-slate-800/20 transition">
                      <td className="p-3 font-bold text-slate-200 bg-slate-900/50 border-r border-slate-800">
                        {day}
                      </td>
                      {periods.map(p => {
                        const entry = getRoomEntryForSlot(day, p.id);

                        if (p.is_break) {
                          return (
                            <td key={p.id} className="p-2.5 text-center bg-amber-500/5 border-r border-slate-800/70">
                              <div className="flex items-center justify-center space-x-1 text-amber-400/80 text-[11px] font-semibold">
                                <Coffee size={14} />
                                <span>{p.name}</span>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={p.id} className="p-2 border-r border-slate-800/70 align-top">
                            {entry ? (
                              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-950/70 to-slate-900 border border-purple-500/30 text-slate-200 shadow-md space-y-1">
                                <div className="font-extrabold text-purple-300 text-xs truncate">
                                  {entry.class_name} - Sec {entry.section_name}
                                </div>
                                <div className="text-[11px] text-slate-300 truncate">
                                  {entry.subject_name}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {entry.teacher_name || 'Staff'}
                                </div>
                              </div>
                            ) : (
                              <div className="h-14 rounded-xl border border-dashed border-slate-800/50 flex items-center justify-center text-slate-600 text-[11px]">
                                Available
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ALL SCHEDULED ENTRIES (MANAGE / TABLE VIEW) */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search subject, teacher, class, room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input text-slate-200 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
              >
                <option value="" className="bg-slate-900">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Entries Table */}
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Day</th>
                    <th className="py-3.5 px-4">Period</th>
                    <th className="py-3.5 px-4">Class & Section</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Teacher</th>
                    <th className="py-3.5 px-4">Room</th>
                    {isManagement && <th className="py-3.5 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-200">{entry.day_of_week}</td>
                      <td className="py-3.5 px-4 font-semibold text-indigo-300">
                        {entry.period_name} ({formatTimeDisplay(entry.period_start)} - {formatTimeDisplay(entry.period_end)})
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {entry.class_name} - Sec {entry.section_name}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        {entry.subject_name} {entry.subject_code && `(${entry.subject_code})`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{entry.teacher_name || '-'}</td>
                      <td className="py-3.5 px-4 font-mono text-emerald-400">{entry.room_number || '-'}</td>
                      {isManagement && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEdit(entry)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="Edit Entry"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                              title="Delete Entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredEntries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No timetable entries found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TIMETABLE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full glass-card rounded-2xl p-6 shadow-2xl border border-slate-800 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  {editEntry ? 'Edit Scheduled Period' : 'Schedule Timetable Period'}
                </h3>
                <p className="text-xs text-slate-400">Conflict detection is automatically applied upon submission</p>
              </div>
            </div>

            {/* ERROR ALERT FOR CONFLICTS */}
            {formError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start space-x-2.5 animate-shake">
                <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
                <div className="flex-1 font-semibold leading-relaxed">{formError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Year</label>
                  <select
                    required
                    value={modalAyId}
                    onChange={(e) => setModalAyId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  >
                    {academicYears.map(ay => (
                      <option key={ay.id} value={ay.id} className="bg-slate-900">{ay.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Day of Week</label>
                  <select
                    required
                    value={modalDay}
                    onChange={(e) => setModalDay(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d} value={d} className="bg-slate-900">{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Class</label>
                  <select
                    required
                    value={modalClassId}
                    onChange={(e) => {
                      setModalClassId(e.target.value);
                      const s = sections.filter(sec => sec.class_id === parseInt(e.target.value));
                      if (s.length > 0) setModalSectionId(s[0].id.toString());
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Section</label>
                  <select
                    required
                    value={modalSectionId}
                    onChange={(e) => setModalSectionId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  >
                    {modalClassSections.map(s => (
                      <option key={s.id} value={s.id} className="bg-slate-900">Section {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Period Slot</label>
                  <select
                    required
                    value={modalPeriodId}
                    onChange={(e) => setModalPeriodId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  >
                    {periods.map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-900">
                        {p.name} ({formatTimeDisplay(p.start_time)} - {formatTimeDisplay(p.end_time)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                  <select
                    required
                    value={modalSubjectId}
                    onChange={(e) => setModalSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  >
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id} className="bg-slate-900">
                        {sub.name} {sub.code && `(${sub.code})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teacher</label>
                  <select
                    value={modalTeacherId}
                    onChange={(e) => setModalTeacherId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  >
                    <option value="" className="bg-slate-900">-- None / Unassigned --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id} className="bg-slate-900">
                        {t.user?.full_name || `Teacher #${t.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Room Number</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 101, Lab 2"
                    value={modalRoom}
                    onChange={(e) => setModalRoom(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
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
                  {formSubmitting ? 'Validating...' : editEntry ? 'Update Schedule' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
