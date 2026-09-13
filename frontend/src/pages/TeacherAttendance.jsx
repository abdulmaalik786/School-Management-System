import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Save,
  Calendar,
  Search,
  History,
  TrendingUp,
  AlertCircle,
  User,
  Users,
  Download,
  Printer
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

const TeacherAttendance = () => {
  const userRoleName = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isManagement = ['Super Admin', 'School Admin', 'Principal', 'Admin'].includes(userRoleName) || !user;

  // Subtabs: 'mark' | 'daily' | 'monthly' | 'individual'
  const [activeTab, setActiveTab] = useState(isManagement ? 'mark' : 'individual');

  // Teachers Master
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  // Mark Attendance State
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { teacherId: { status: 'Present', remarks: '' } }
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Daily Report State
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyReport, setDailyReport] = useState(null);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // Monthly Report State
  const [monthlyMonth, setMonthlyMonth] = useState((new Date().getMonth() + 1).toString());
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear().toString());
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  // Individual Report State
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [individualReport, setIndividualReport] = useState(null);
  const [loadingIndividual, setLoadingIndividual] = useState(false);

  // Load teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const res = await API.get('/api/teachers');
        setTeachers(res.data);
        if (res.data.length > 0) {
          if (user?.role?.name === 'Teacher' && user?.teacher_profile) {
            setSelectedTeacherId(user.teacher_profile.id.toString());
          } else {
            setSelectedTeacherId(res.data[0].id.toString());
          }
        }
      } catch (err) {
        console.error('Failed to load teachers:', err);
      } finally {
        setLoadingTeachers(false);
      }
    };
    fetchTeachers();
  }, []);

  // Load teacher attendance for markDate
  const loadMarkAttendance = async () => {
    if (!markDate || teachers.length === 0) return;
    try {
      const res = await API.get(`/api/attendance/teachers?attendance_date=${markDate}`);
      const existing = res.data;

      const initialMap = {};
      teachers.forEach(t => {
        const record = existing.find(r => r.teacher_id === t.id);
        if (record) {
          initialMap[t.id] = {
            status: record.status || 'Present',
            remarks: record.remarks || '',
            id: record.id
          };
        } else {
          initialMap[t.id] = {
            status: 'Present',
            remarks: '',
            id: null
          };
        }
      });
      setAttendanceMap(initialMap);
    } catch (err) {
      console.error('Failed to load teacher attendance for date:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'mark') {
      loadMarkAttendance();
    }
  }, [markDate, teachers, activeTab]);

  // Bulk Quick Mark Status
  const handleBulkSetStatus = (status) => {
    setAttendanceMap(prev => {
      const next = { ...prev };
      teachers.forEach(t => {
        next[t.id] = {
          ...next[t.id],
          status
        };
      });
      return next;
    });
  };

  const handleSetTeacherStatus = (teacherId, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        status
      }
    }));
  };

  const handleSetTeacherRemarks = (teacherId, remarks) => {
    setAttendanceMap(prev => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        remarks
      }
    }));
  };

  // Save Teacher Attendance
  const handleSaveAttendance = async () => {
    if (teachers.length === 0) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const payload = {
        attendance_date: markDate,
        attendances: teachers.map(t => ({
          teacher_id: t.id,
          status: attendanceMap[t.id]?.status || 'Present',
          remarks: attendanceMap[t.id]?.remarks || null
        }))
      };

      await API.post('/api/attendance/teachers', payload);
      setSuccessMsg(`Teacher attendance saved for ${teachers.length} faculty members!`);
      loadMarkAttendance();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save teacher attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Fetch Daily Report
  const fetchDailyReport = async () => {
    if (!dailyDate) return;
    setLoadingDaily(true);
    try {
      const res = await API.get(`/api/attendance/reports/teachers/daily?attendance_date=${dailyDate}`);
      setDailyReport(res.data);
    } catch (err) {
      console.error('Failed to fetch daily teacher report:', err);
    } finally {
      setLoadingDaily(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyReport();
    }
  }, [activeTab, dailyDate]);

  // Fetch Monthly Report
  const fetchMonthlyReport = async () => {
    if (!monthlyMonth || !monthlyYear) return;
    setLoadingMonthly(true);
    try {
      const res = await API.get(`/api/attendance/reports/teachers/monthly?month=${monthlyMonth}&year=${monthlyYear}`);
      setMonthlyReports(res.data);
    } catch (err) {
      console.error('Failed to fetch monthly teacher report:', err);
    } finally {
      setLoadingMonthly(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthlyReport();
    }
  }, [activeTab, monthlyMonth, monthlyYear]);

  // Fetch Individual Report
  const fetchIndividualReport = async () => {
    if (!selectedTeacherId) return;
    setLoadingIndividual(true);
    try {
      const res = await API.get(`/api/attendance/reports/teacher/${selectedTeacherId}`);
      setIndividualReport(res.data);
    } catch (err) {
      console.error('Failed to fetch individual teacher report:', err);
    } finally {
      setLoadingIndividual(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'individual' && selectedTeacherId) {
      fetchIndividualReport();
    }
  }, [activeTab, selectedTeacherId]);

  // Stats
  const totalTeachers = teachers.length;
  const presentCount = Object.values(attendanceMap).filter(v => v.status === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter(v => v.status === 'Absent').length;
  const lateCount = Object.values(attendanceMap).filter(v => v.status === 'Late').length;
  const leaveCount = Object.values(attendanceMap).filter(v => v.status === 'Leave').length;
  const attendanceRate = totalTeachers > 0 ? Math.round(((presentCount + lateCount) / totalTeachers) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Teacher Attendance & Reports</h1>
            <p className="text-xs text-slate-400">Faculty attendance tracking, daily logs, and monthly individual reports</p>
          </div>
        </div>

        {activeTab === 'mark' && isManagement && (
          <button
            onClick={handleSaveAttendance}
            disabled={saving || teachers.length === 0}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Teacher Attendance'}</span>
          </button>
        )}
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
      <div className="flex flex-wrap gap-2 p-1.5 glass-card rounded-2xl border border-slate-800">
        {isManagement && (
          <button
            onClick={() => setActiveTab('mark')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'mark'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <CheckCircle2 size={16} />
            <span>Mark Teacher Attendance</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'daily'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Calendar size={16} />
          <span>Daily Faculty Report</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'monthly'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <TrendingUp size={16} />
          <span>Monthly Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('individual')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'individual'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <User size={16} />
          <span>Individual Teacher Report</span>
        </button>
      </div>

      {/* 1. MARK TEACHER ATTENDANCE */}
      {activeTab === 'mark' && isManagement && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">Attendance Date:</span>
              </div>
              <input
                type="date"
                value={markDate}
                onChange={(e) => setMarkDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-1">Quick Actions:</span>
              <button
                type="button"
                onClick={() => handleBulkSetStatus('Present')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => handleBulkSetStatus('Absent')}
                className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-semibold transition"
              >
                All Absent
              </button>
              <button
                type="button"
                onClick={() => handleBulkSetStatus('Late')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
              >
                All Late
              </button>
              <button
                type="button"
                onClick={() => handleBulkSetStatus('Leave')}
                className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-xs font-semibold transition"
              >
                All Leave
              </button>
            </div>
          </div>

          {/* KPI Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
            <div className="p-3 rounded-xl glass-card border border-slate-800 text-center">
              <span className="text-slate-400">Total Staff</span>
              <div className="text-lg font-bold text-slate-100">{totalTeachers}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-400">
              <span>Present</span>
              <div className="text-lg font-bold">{presentCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center text-red-400">
              <span>Absent</span>
              <div className="text-lg font-bold">{absentCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-amber-400">
              <span>Late</span>
              <div className="text-lg font-bold">{lateCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center text-blue-400">
              <span>Leave</span>
              <div className="text-lg font-bold">{leaveCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center text-purple-300 font-bold">
              <span>Rate</span>
              <div className="text-lg">{attendanceRate}%</div>
            </div>
          </div>

          {/* Teachers Roster Table */}
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Faculty Member</th>
                    <th className="py-3.5 px-4">Department & Designation</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {teachers.map(teacher => {
                    const currentStatus = attendanceMap[teacher.id]?.status || 'Present';
                    const currentRemarks = attendanceMap[teacher.id]?.remarks || '';

                    return (
                      <tr key={teacher.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-100 text-sm">
                            {teacher.user?.full_name || `${teacher.first_name} ${teacher.last_name}`}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            EMP ID: {teacher.employee_id || `#${teacher.id}`}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-300">{teacher.department || 'General Faculty'}</div>
                          <div className="text-[10px] text-slate-500">{teacher.designation || 'Teacher'}</div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex rounded-xl p-1 bg-slate-900/90 border border-slate-800 space-x-1 shadow-inner">
                            {['Present', 'Absent', 'Late', 'Leave'].map(stKey => {
                              const cfg = STATUS_CONFIG[stKey];
                              const Icon = cfg.icon;
                              const isActive = currentStatus === stKey;

                              return (
                                <button
                                  key={stKey}
                                  type="button"
                                  onClick={() => handleSetTeacherStatus(teacher.id, stKey)}
                                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    isActive
                                      ? cfg.activeBg
                                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                  }`}
                                >
                                  <Icon size={14} />
                                  <span>{cfg.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            placeholder="Optional remark..."
                            value={currentRemarks}
                            onChange={(e) => handleSetTeacherRemarks(teacher.id, e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 placeholder-slate-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Ready to save <span className="font-bold text-slate-200">{teachers.length}</span> staff attendance entries.
              </div>
              <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save & Confirm'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DAILY FACULTY REPORT */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Select Date:</span>
            </div>
            <input
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
            />
          </div>

          {loadingDaily ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading daily report...</div>
          ) : dailyReport ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl glass-card border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Faculty</span>
                  <div className="text-2xl font-extrabold text-slate-100 mt-1">{dailyReport.total_teachers}</div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-400">
                  <span className="text-[11px] uppercase font-semibold">Present</span>
                  <div className="text-2xl font-extrabold mt-1">{dailyReport.present_count}</div>
                </div>
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center text-red-400">
                  <span className="text-[11px] uppercase font-semibold">Absent</span>
                  <div className="text-2xl font-extrabold mt-1">{dailyReport.absent_count}</div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center text-amber-400">
                  <span className="text-[11px] uppercase font-semibold">Late</span>
                  <div className="text-2xl font-extrabold mt-1">{dailyReport.late_count}</div>
                </div>
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center text-purple-300 font-bold">
                  <span className="text-[11px] uppercase font-semibold">Rate</span>
                  <div className="text-2xl mt-1">{dailyReport.attendance_percentage}%</div>
                </div>
              </div>

              <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Faculty Member</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {dailyReport.records && dailyReport.records.length > 0 ? (
                      dailyReport.records.map(r => (
                        <tr key={r.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-bold text-slate-100">{r.teacher_name}</td>
                          <td className="py-3 px-4 text-slate-300">{r.department || 'General'}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-emerald-400">{r.status}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 italic">{r.remarks || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">
                          No logs recorded for this day yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 3. MONTHLY FACULTY REPORT */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Month & Year:</span>
            </div>

            <select
              value={monthlyMonth}
              onChange={(e) => setMonthlyMonth(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
            >
              {[
                { val: '1', label: 'January' },
                { val: '2', label: 'February' },
                { val: '3', label: 'March' },
                { val: '4', label: 'April' },
                { val: '5', label: 'May' },
                { val: '6', label: 'June' },
                { val: '7', label: 'July' },
                { val: '8', label: 'August' },
                { val: '9', label: 'September' },
                { val: '10', label: 'October' },
                { val: '11', label: 'November' },
                { val: '12', label: 'December' }
              ].map(m => (
                <option key={m.val} value={m.val} className="bg-slate-900">{m.label}</option>
              ))}
            </select>

            <select
              value={monthlyYear}
              onChange={(e) => setMonthlyYear(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y} className="bg-slate-900">{y}</option>
              ))}
            </select>
          </div>

          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Faculty Member</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4 text-center">Working Days</th>
                    <th className="py-3.5 px-4 text-center text-emerald-400">Present</th>
                    <th className="py-3.5 px-4 text-center text-red-400">Absent</th>
                    <th className="py-3.5 px-4 text-center text-amber-400">Late</th>
                    <th className="py-3.5 px-4 text-center text-blue-400">Leave</th>
                    <th className="py-3.5 px-4 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loadingMonthly ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Loading monthly staff analytics...
                      </td>
                    </tr>
                  ) : monthlyReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No monthly teacher logs found for this period.
                      </td>
                    </tr>
                  ) : (
                    monthlyReports.map(m => (
                      <tr key={m.teacher_id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-100">{m.teacher_name}</td>
                        <td className="py-3.5 px-4 text-slate-300">{m.department || 'General'}</td>
                        <td className="py-3.5 px-4 text-center font-mono">{m.total_days}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-emerald-400 font-bold">{m.present_count}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-red-400">{m.absent_count}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-amber-400">{m.late_count}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-blue-400">{m.leave_count}</td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-purple-300 font-mono">
                          {m.attendance_percentage}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. INDIVIDUAL TEACHER REPORT */}
      {activeTab === 'individual' && (
        <div className="space-y-6">
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <User size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Choose Faculty Member:</span>
            </div>

            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none min-w-[220px]"
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id} className="bg-slate-900">
                  {t.user?.full_name || `${t.first_name} ${t.last_name}`} ({t.department || 'General'})
                </option>
              ))}
            </select>
          </div>

          {loadingIndividual ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading faculty report...</div>
          ) : individualReport ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Profile Card */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-purple-600/30">
                      {individualReport.teacher_name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-100">{individualReport.teacher_name}</h2>
                      <p className="text-xs text-slate-400 font-mono">EMP: {individualReport.employee_id || 'N/A'}</p>
                      <p className="text-xs text-purple-400 font-semibold">{individualReport.department || 'Faculty'}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Recorded Days:</span>
                    <span className="font-bold text-slate-200 font-mono">{individualReport.total_days}</span>
                  </div>
                </div>

                {/* Percentage Card */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                    <div className="text-4xl font-extrabold text-slate-100">
                      {individualReport.attendance_percentage}%
                    </div>
                    <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border bg-purple-500/10 text-purple-300 border-purple-500/20">
                      Faculty Standing
                    </span>
                  </div>
                </div>

                {/* Matrix Counts */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold">Present</span>
                    <span className="text-2xl font-extrabold">{individualReport.present_count}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold">Absent</span>
                    <span className="text-2xl font-extrabold">{individualReport.absent_count}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold">Late</span>
                    <span className="text-2xl font-extrabold">{individualReport.late_count}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold">Leave</span>
                    <span className="text-2xl font-extrabold">{individualReport.leave_count}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">Select a teacher to view their detailed log.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherAttendance;
