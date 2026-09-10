import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Save,
  Filter,
  Search,
  Calendar,
  Layers,
  History,
  AlertCircle,
  Users,
  UserPlus,
  UserMinus,
  Edit2,
  Trash2,
  ChevronRight,
  BookOpen
} from 'lucide-react';

const STATUS_CONFIG = {
  Present: {
    label: 'Present',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    activeBg: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border-emerald-500',
    icon: CheckCircle2
  },
  Absent: {
    label: 'Absent',
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    text: 'text-red-400',
    activeBg: 'bg-red-600 text-white shadow-lg shadow-red-600/30 border-red-500',
    icon: XCircle
  },
  Late: {
    label: 'Late',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    activeBg: 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 border-amber-500',
    icon: Clock
  },
  Leave: {
    label: 'Leave',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    activeBg: 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border-blue-500',
    icon: FileText
  }
};

const StudentAttendance = () => {
  const { user } = useAuth();
  const isManagementOrTeacher = ['Super Admin', 'School Admin', 'Principal', 'Teacher'].includes(user?.role?.name);

  // Subtabs: 'mark' | 'history'
  const [activeTab, setActiveTab] = useState('mark');

  // Master Data
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [periods, setPeriods] = useState([]);

  // Attendance Marking State
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { studentId: { status: 'Present', remarks: '' } }
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // History State
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyClass, setHistoryClass] = useState('');
  const [historySection, setHistorySection] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyStatus, setHistoryStatus] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // Edit History Modal
  const [editRecord, setEditRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('Present');
  const [editRemarks, setEditRemarks] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Add/Remove Student Modal State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentAdm, setNewStudentAdm] = useState('');
  const [addStudentSubmitting, setAddStudentSubmitting] = useState(false);

  const handleQuickAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName || !selectedClass || !selectedSection) return;
    setAddStudentSubmitting(true);
    try {
      const nameParts = newStudentName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'Student';
      const payload = {
        first_name: firstName,
        last_name: lastName,
        roll_number: newStudentRoll || `${Math.floor(100 + Math.random() * 900)}`,
        admission_number: newStudentAdm || `ADM-${Date.now().toString().slice(-6)}`,
        class_id: parseInt(selectedClass),
        section_id: parseInt(selectedSection),
        status: 'Active'
      };
      await API.post('/api/students', payload);
      setSuccessMsg('New student added to attendance sheet successfully!');
      setShowAddStudentModal(false);
      setNewStudentName('');
      setNewStudentRoll('');
      setNewStudentAdm('');
      loadStudentsAndAttendance();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add student');
    } finally {
      setAddStudentSubmitting(false);
    }
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName} (e.g. Left School / Deactivated)?`)) {
      return;
    }
    try {
      await API.delete(`/api/students/${studentId}`);
      setSuccessMsg(`${studentName} removed from roster.`);
      loadStudentsAndAttendance();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove student');
    }
  };

  // Initial Load & Section setup
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [clsRes, secRes, subjRes, perRes] = await Promise.all([
          API.get('/api/classes'),
          API.get('/api/sections'),
          API.get('/api/subjects'),
          API.get('/api/periods')
        ]);
        let allSections = secRes.data;
        let allClasses = clsRes.data;

        // Auto-create missing sections A & B for classes if needed
        for (const cls of allClasses) {
          const clsSecs = allSections.filter(s => s.class_id === cls.id);
          if (clsSecs.length < 2) {
            const hasA = clsSecs.some(s => s.name === 'A');
            const hasB = clsSecs.some(s => s.name === 'B');
            if (!hasA) {
              try {
                const resA = await API.post('/api/sections', { name: 'A', class_id: cls.id });
                allSections.push(resA.data);
              } catch (e) {}
            }
            if (!hasB) {
              try {
                const resB = await API.post('/api/sections', { name: 'B', class_id: cls.id });
                allSections.push(resB.data);
              } catch (e) {}
            }
          }
        }

        setClasses(allClasses);
        setSections(allSections);
        setSubjects(subjRes.data);
        setPeriods(perRes.data);

        if (allClasses.length > 0) {
          const firstClsId = allClasses[0].id;
          setSelectedClass(firstClsId.toString());
          const matchingSecs = allSections.filter(s => s.class_id === firstClsId);
          if (matchingSecs.length > 0) {
            setSelectedSection(matchingSecs[0].id.toString());
          }
        }
      } catch (err) {
        console.error('Failed to load master filters:', err);
      }
    };
    fetchMasters();
  }, []);

  // Filtered sections
  const classSections = sections.filter(s => s.class_id === parseInt(selectedClass));
  const historyClassSections = sections.filter(s => s.class_id === parseInt(historyClass));

  // Load students and existing attendance whenever Class, Section, Date, Subject, Period changes
  const loadStudentsAndAttendance = async () => {
    if (!selectedClass || !selectedSection) return;

    setLoadingStudents(true);
    setErrorMsg('');
    try {
      // 1. Fetch Students of selected class & section
      const stuRes = await API.get(`/api/students?class_id=${selectedClass}&section_id=${selectedSection}`);
      const fetchedStudents = stuRes.data;
      setStudents(fetchedStudents);

      // 2. Fetch any already marked attendance for this class, section & date
      let url = `/api/attendance?class_id=${selectedClass}&section_id=${selectedSection}&attendance_date=${selectedDate}`;
      if (selectedSubject) url += `&subject_id=${selectedSubject}`;
      if (selectedPeriod) url += `&period_id=${selectedPeriod}`;

      const attRes = await API.get(url);
      const existingRecords = attRes.data;

      // 3. Build map
      const initialMap = {};
      fetchedStudents.forEach(stu => {
        const record = existingRecords.find(r => r.student_id === stu.id);
        if (record) {
          initialMap[stu.id] = {
            status: record.status || 'Present',
            remarks: record.remarks || '',
            id: record.id
          };
        } else {
          initialMap[stu.id] = {
            status: 'Present',
            remarks: '',
            id: null
          };
        }
      });

      setAttendanceMap(initialMap);
    } catch (err) {
      console.error('Failed to load students and attendance:', err);
      setErrorMsg('Failed to load students from database.');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'mark') {
      loadStudentsAndAttendance();
    }
  }, [selectedClass, selectedSection, selectedDate, selectedSubject, selectedPeriod, activeTab]);

  // Bulk Quick Mark Action
  const handleBulkSetStatus = (status) => {
    setAttendanceMap(prev => {
      const next = { ...prev };
      students.forEach(s => {
        next[s.id] = {
          ...next[s.id],
          status
        };
      });
      return next;
    });
  };

  // Change individual student status
  const handleSetStudentStatus = (studentId, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  // Change individual student remarks
  const handleSetStudentRemarks = (studentId, remarks) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  // Save Attendance to Database
  const handleSaveAttendance = async () => {
    if (students.length === 0) return;

    setSaving(true);
    setErrorMsg('');
    try {
      const payload = {
        class_id: parseInt(selectedClass),
        section_id: parseInt(selectedSection),
        subject_id: selectedSubject ? parseInt(selectedSubject) : null,
        period_id: selectedPeriod ? parseInt(selectedPeriod) : null,
        attendance_date: selectedDate,
        attendances: students.map(s => ({
          student_id: s.id,
          status: attendanceMap[s.id]?.status || 'Present',
          remarks: attendanceMap[s.id]?.remarks || null
        }))
      };

      await API.post('/api/attendance', payload);
      setSuccessMsg(`Attendance saved successfully for ${students.length} students!`);
      loadStudentsAndAttendance();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save attendance records.');
    } finally {
      setSaving(false);
    }
  };

  // Fetch Attendance History
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      let url = '/api/attendance?';
      const params = [];
      if (historyClass) params.push(`class_id=${historyClass}`);
      if (historySection) params.push(`section_id=${historySection}`);
      if (historyStartDate) params.push(`start_date=${historyStartDate}`);
      if (historyEndDate) params.push(`end_date=${historyEndDate}`);
      if (historyStatus) params.push(`status=${historyStatus}`);
      url += params.join('&');

      const res = await API.get(url);
      setHistoryRecords(res.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, historyClass, historySection, historyStartDate, historyEndDate, historyStatus]);

  // Handle Edit Single Record from History
  const handleSaveEditRecord = async (e) => {
    e.preventDefault();
    if (!editRecord) return;
    setEditSaving(true);
    try {
      await API.put(`/api/attendance/${editRecord.id}`, {
        status: editStatus,
        remarks: editRemarks
      });
      setEditRecord(null);
      setSuccessMsg('Attendance record updated successfully!');
      fetchHistory();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update record');
    } finally {
      setEditSaving(false);
    }
  };

  // Delete Record from History
  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attendance entry?')) return;
    try {
      await API.delete(`/api/attendance/${id}`);
      setSuccessMsg('Record deleted successfully!');
      fetchHistory();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete record');
    }
  };

  // Stats calculation
  const totalStudents = students.length;
  const presentCount = Object.values(attendanceMap).filter(v => v.status === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter(v => v.status === 'Absent').length;
  const lateCount = Object.values(attendanceMap).filter(v => v.status === 'Late').length;
  const leaveCount = Object.values(attendanceMap).filter(v => v.status === 'Leave').length;
  const attendancePct = totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0;

  // Filtered history records
  const filteredHistory = historyRecords.filter(r => {
    if (!historySearch) return true;
    const q = historySearch.toLowerCase();
    return (
      (r.student_name && r.student_name.toLowerCase().includes(q)) ||
      (r.admission_number && r.admission_number.toLowerCase().includes(q)) ||
      (r.roll_number && r.roll_number.toLowerCase().includes(q)) ||
      (r.class_name && r.class_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Student Attendance System</h1>
            <p className="text-xs text-slate-400">Real-time daily roll call, status tracking, and historical audit logs</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {activeTab === 'mark' && isManagementOrTeacher && (
            <button
              onClick={handleSaveAttendance}
              disabled={saving || students.length === 0}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? 'Saving Records...' : 'Save Attendance'}</span>
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
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center space-x-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Subtabs */}
      <div className="flex space-x-2 p-1.5 glass-card rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('mark')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'mark'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ClipboardCheck size={16} />
          <span>Mark Daily Attendance</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <History size={16} />
          <span>Attendance History & Logs</span>
        </button>
      </div>

      {/* TAB 1: MARK ATTENDANCE */}
      {activeTab === 'mark' && (
        <div className="space-y-5">
          {/* Selectors Bar */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Class */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    const s = sections.filter(sec => sec.class_id === parseInt(e.target.value));
                    if (s.length > 0) setSelectedSection(s[0].id.toString());
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                >
                  {classSections.map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-900">Section {s.name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Bulk Action Buttons & Stats Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3 border-t border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 mr-1">Quick Bulk:</span>
                <button
                  type="button"
                  onClick={() => handleBulkSetStatus('Present')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSetStatus('Absent')}
                  className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-semibold transition"
                >
                  Mark All Absent
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSetStatus('Late')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
                >
                  Mark All Late
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSetStatus('Leave')}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-xs font-semibold transition"
                >
                  Mark All Leave
                </button>
              </div>

              {/* Real-time Summary Counters */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Total: </span>
                  <span className="font-bold text-slate-100">{totalStudents}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span>Present: </span>
                  <span className="font-bold">{presentCount}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <span>Absent: </span>
                  <span className="font-bold">{absentCount}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <span>Late: </span>
                  <span className="font-bold">{lateCount}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <span>Leave: </span>
                  <span className="font-bold">{leaveCount}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold">
                  <span>Rate: {attendancePct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Student Roll Call List */}
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users size={18} className="text-teal-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Student Roll Call Roster ({students.length} Enrolled)
                </h3>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-600/30 transition"
                >
                  <UserPlus size={15} />
                  <span>+ Add Student</span>
                </button>
                <div className="text-xs text-slate-400">
                  Date: <span className="font-mono text-slate-200">{selectedDate}</span>
                </div>
              </div>
            </div>

            {loadingStudents ? (
              <div className="p-12 text-center text-slate-400 text-xs">Loading student roster...</div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
                  <Users size={24} />
                </div>
                <p className="text-sm font-medium text-slate-300">No students enrolled in this section</p>
                <p className="text-xs text-slate-500 mb-3">Add students to this class and section to begin tracking attendance.</p>
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-600/30 transition"
                >
                  <UserPlus size={16} />
                  <span>+ Add New Student</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 w-14">Roll</th>
                      <th className="py-3.5 px-4">Student Details</th>
                      <th className="py-3.5 px-4 text-center">Attendance Status</th>
                      <th className="py-3.5 px-4">Remarks (Optional)</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {students.map((student, idx) => {
                      const currentStatus = attendanceMap[student.id]?.status || 'Present';
                      const currentRemarks = attendanceMap[student.id]?.remarks || '';

                      return (
                        <tr key={student.id} className="hover:bg-slate-800/30 transition">
                          {/* Roll Number */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                            {student.roll_number || `#${idx + 1}`}
                          </td>

                          {/* Student Info */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-100 text-sm">
                              {student.user?.full_name || `${student.first_name || ''} ${student.last_name || ''}`}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Adm: {student.admission_number}
                            </div>
                          </td>

                          {/* Status Toggle Buttons */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex rounded-xl p-1 bg-slate-900/90 border border-slate-800 space-x-1 shadow-inner">
                              {['Present', 'Absent', 'Late', 'Leave'].map(statusKey => {
                                const config = STATUS_CONFIG[statusKey];
                                const Icon = config.icon;
                                const isActive = currentStatus === statusKey;

                                return (
                                  <button
                                    key={statusKey}
                                    type="button"
                                    onClick={() => handleSetStudentStatus(student.id, statusKey)}
                                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                      isActive
                                        ? config.activeBg
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                    }`}
                                  >
                                    <Icon size={14} />
                                    <span>{config.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </td>

                          {/* Remarks Input */}
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              placeholder="e.g. Doctor's note, late entry"
                              value={currentRemarks}
                              onChange={(e) => handleSetStudentRemarks(student.id, e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 placeholder-slate-500 focus:outline-none"
                            />
                          </td>

                          {/* Action - Remove Student */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(student.id, student.user?.full_name || `${student.first_name || ''} ${student.last_name || ''}`)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                              title="Remove Student (Left School / Deactivate)"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Save Bar */}
            {students.length > 0 && isManagementOrTeacher && (
              <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Ready to record <span className="font-bold text-slate-200">{students.length}</span> attendance entries.
                </div>
                <button
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{saving ? 'Saving...' : 'Save & Confirm Attendance'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE HISTORY / AUDIT LOG */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* History Filters */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search student, admission no, roll..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
              />
            </div>

            <select
              value={historyClass}
              onChange={(e) => {
                setHistoryClass(e.target.value);
                setHistorySection('');
              }}
              className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
            >
              <option value="" className="bg-slate-900">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
              ))}
            </select>

            <select
              value={historySection}
              onChange={(e) => setHistorySection(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
            >
              <option value="" className="bg-slate-900">All Sections</option>
              {historyClassSections.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900">Section {s.name}</option>
              ))}
            </select>

            <div className="flex items-center space-x-1">
              <span className="text-[11px] text-slate-400">From:</span>
              <input
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                className="px-2 py-1 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-[11px] text-slate-400">To:</span>
              <input
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                className="px-2 py-1 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
              />
            </div>

            <select
              value={historyStatus}
              onChange={(e) => setHistoryStatus(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
            >
              <option value="" className="bg-slate-900">All Statuses</option>
              <option value="Present" className="bg-slate-900">Present</option>
              <option value="Absent" className="bg-slate-900">Absent</option>
              <option value="Late" className="bg-slate-900">Late</option>
              <option value="Leave" className="bg-slate-900">Leave</option>
            </select>
          </div>

          {/* History Table */}
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Class & Section</th>
                    <th className="py-3.5 px-4">Subject / Period</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Remarks</th>
                    <th className="py-3.5 px-4">Recorded By</th>
                    {isManagementOrTeacher && <th className="py-3.5 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Loading attendance history...
                      </td>
                    </tr>
                  ) : filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No attendance history records found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map(rec => {
                      const config = STATUS_CONFIG[rec.status] || STATUS_CONFIG.Present;
                      const Icon = config.icon;

                      return (
                        <tr key={rec.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">{rec.attendance_date}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-100">{rec.student_name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Adm: {rec.admission_number}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {rec.class_name} - Sec {rec.section_name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {rec.subject_name || 'Daily Roll'} {rec.period_name && `(${rec.period_name})`}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${config.bg} ${config.border} ${config.text}`}>
                              <Icon size={12} />
                              <span>{rec.status}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 italic">{rec.remarks || '-'}</td>
                          <td className="py-3.5 px-4 text-slate-400">{rec.recorded_by_name || 'Admin'}</td>
                          {isManagementOrTeacher && (
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setEditRecord(rec);
                                    setEditStatus(rec.status);
                                    setEditRemarks(rec.remarks || '');
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                  title="Edit Status"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteRecord(rec.id)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                                  title="Delete Record"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-2xl p-6 shadow-2xl border border-slate-800 relative">
            <button
              onClick={() => setEditRecord(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
            >
              <XCircle size={20} />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                <Edit2 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Update Attendance Record</h3>
                <p className="text-xs text-slate-400">{editRecord.student_name} ({editRecord.attendance_date})</p>
              </div>
            </div>

            <form onSubmit={handleSaveEditRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Present', 'Absent', 'Late', 'Leave'].map(st => {
                    const cfg = STATUS_CONFIG[st];
                    const Icon = cfg.icon;
                    const isSelected = editStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setEditStatus(st)}
                        className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-bold transition ${
                          isSelected ? cfg.activeBg : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon size={16} />
                        <span>{st}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Remarks</label>
                <textarea
                  rows="3"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Reason for absence or note..."
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg shadow-teal-600/30 transition disabled:opacity-50"
                >
                  {editSaving ? 'Saving...' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus size={18} className="text-teal-400" />
                <h3 className="text-sm font-bold text-slate-100">Add Student to Attendance Roster</h3>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ali Ahmed"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 101"
                    value={newStudentRoll}
                    onChange={(e) => setNewStudentRoll(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Admission No</label>
                  <input
                    type="text"
                    placeholder="e.g. ADM-2026-009"
                    value={newStudentAdm}
                    onChange={(e) => setNewStudentAdm(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                Student will be enrolled directly into <span className="font-bold text-slate-200">Class {classes.find(c=>c.id==selectedClass)?.name || ''}</span>, <span className="font-bold text-slate-200">Section {sections.find(s=>s.id==selectedSection)?.name || ''}</span>.
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addStudentSubmitting}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg shadow-teal-600/30 transition disabled:opacity-50"
                >
                  {addStudentSubmitting ? 'Adding...' : 'Add to Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;
