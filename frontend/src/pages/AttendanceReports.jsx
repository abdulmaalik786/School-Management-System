import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  User,
  Users,
  Calendar,
  BookOpen,
  Filter,
  Download,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Percent,
  Search,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

const AttendanceReports = () => {
  const { user } = useAuth();

  // Active Report Subtab: 'student' | 'class' | 'daily' | 'monthly' | 'subject'
  const [activeTab, setActiveTab] = useState('student');

  // Master Lists
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  // Tab 1: Student Report Filters & State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentReport, setStudentReport] = useState(null);
  const [loadingStudentRep, setLoadingStudentRep] = useState(false);

  // Tab 2: Class Report Filters & State
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [classReports, setClassReports] = useState([]);
  const [loadingClassRep, setLoadingClassRep] = useState(false);

  // Tab 3: Daily Report Filters & State
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyReports, setDailyReports] = useState([]);
  const [loadingDailyRep, setLoadingDailyRep] = useState(false);

  // Tab 4: Monthly Report Filters & State
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [loadingMonthlyRep, setLoadingMonthlyRep] = useState(false);

  // Tab 5: Subject Report Filters & State
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [subjectReports, setSubjectReports] = useState([]);
  const [loadingSubjectRep, setLoadingSubjectRep] = useState(false);

  // Load Initial Master Data
  useEffect(() => {
    const fetchMasters = async () => {
      setLoadingMasters(true);
      try {
        const [clsRes, secRes, subjRes, stuRes] = await Promise.all([
          API.get('/api/classes'),
          API.get('/api/sections'),
          API.get('/api/subjects'),
          API.get('/api/students')
        ]);
        setClasses(clsRes.data);
        setSections(secRes.data);
        setSubjects(subjRes.data);
        setStudents(stuRes.data);

        if (stuRes.data.length > 0) {
          // If student logged in, pick themselves
          if (user?.role?.name === 'Student' && user?.student_profile) {
            setSelectedStudentId(user.student_profile.id.toString());
          } else {
            setSelectedStudentId(stuRes.data[0].id.toString());
          }
        }
        if (clsRes.data.length > 0) {
          setSelectedClassId(clsRes.data[0].id.toString());
        }
        if (secRes.data.length > 0) {
          setSelectedSectionId(secRes.data[0].id.toString());
        }
        if (subjRes.data.length > 0) {
          setSelectedSubjectId(subjRes.data[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load master filters:', err);
      } finally {
        setLoadingMasters(false);
      }
    };
    fetchMasters();
  }, []);

  // Filtered sections for class report
  const classSections = sections.filter(s => s.class_id === parseInt(selectedClassId));

  // 1. Fetch Student Report
  const fetchStudentReport = async () => {
    if (!selectedStudentId) return;
    setLoadingStudentRep(true);
    try {
      const res = await API.get(`/api/attendance/reports/student/${selectedStudentId}`);
      setStudentReport(res.data);
    } catch (err) {
      console.error('Failed to fetch student report:', err);
    } finally {
      setLoadingStudentRep(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'student' && selectedStudentId) {
      fetchStudentReport();
    }
  }, [activeTab, selectedStudentId]);

  // 2. Fetch Class Report
  const fetchClassReport = async () => {
    if (!selectedClassId) return;
    setLoadingClassRep(true);
    try {
      let url = `/api/attendance/reports/class/${selectedClassId}`;
      if (selectedSectionId) url += `?section_id=${selectedSectionId}`;
      const res = await API.get(url);
      setClassReports(res.data);
    } catch (err) {
      console.error('Failed to fetch class reports:', err);
    } finally {
      setLoadingClassRep(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'class' && selectedClassId) {
      fetchClassReport();
    }
  }, [activeTab, selectedClassId, selectedSectionId]);

  // 3. Fetch Daily Report
  const fetchDailyReport = async () => {
    if (!dailyDate) return;
    setLoadingDailyRep(true);
    try {
      const res = await API.get(`/api/attendance/reports/daily?attendance_date=${dailyDate}`);
      setDailyReports(res.data);
    } catch (err) {
      console.error('Failed to fetch daily report:', err);
    } finally {
      setLoadingDailyRep(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily' && dailyDate) {
      fetchDailyReport();
    }
  }, [activeTab, dailyDate]);

  // 4. Fetch Monthly Report
  const fetchMonthlyReport = async () => {
    if (!selectedMonth || !selectedYear) return;
    setLoadingMonthlyRep(true);
    try {
      let url = `/api/attendance/reports/monthly?month=${selectedMonth}&year=${selectedYear}`;
      if (selectedClassId) url += `&class_id=${selectedClassId}`;
      if (selectedSectionId) url += `&section_id=${selectedSectionId}`;
      const res = await API.get(url);
      setMonthlyReports(res.data);
    } catch (err) {
      console.error('Failed to fetch monthly report:', err);
    } finally {
      setLoadingMonthlyRep(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthlyReport();
    }
  }, [activeTab, selectedMonth, selectedYear, selectedClassId, selectedSectionId]);

  // 5. Fetch Subject Report
  const fetchSubjectReport = async () => {
    if (!selectedSubjectId) return;
    setLoadingSubjectRep(true);
    try {
      let url = `/api/attendance/reports/subject?subject_id=${selectedSubjectId}`;
      if (selectedClassId) url += `&class_id=${selectedClassId}`;
      const res = await API.get(url);
      setSubjectReports(res.data);
    } catch (err) {
      console.error('Failed to fetch subject report:', err);
    } finally {
      setLoadingSubjectRep(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'subject' && selectedSubjectId) {
      fetchSubjectReport();
    }
  }, [activeTab, selectedSubjectId, selectedClassId]);

  // Export to CSV helper
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export!');
      return;
    }
    const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    const rows = data.map(item =>
      headers.map(h => `"${(item[h] ?? '').toString().replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter student list by search
  const filteredStudents = students.filter(s => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    const name = s.user?.full_name || `${s.first_name} ${s.last_name}`;
    return name.toLowerCase().includes(q) || (s.admission_number && s.admission_number.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Attendance Analytics & Reports</h1>
            <p className="text-xs text-slate-400">Comprehensive breakdown of student attendance percentages, rates, and trends</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Print Report</span>
          </button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex flex-wrap gap-2 p-1.5 glass-card rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('student')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'student'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <User size={16} />
          <span>Student Attendance Report</span>
        </button>

        <button
          onClick={() => setActiveTab('class')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'class'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Users size={16} />
          <span>Class Roster Report</span>
        </button>

        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'daily'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Calendar size={16} />
          <span>Daily Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'monthly'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <TrendingUp size={16} />
          <span>Monthly Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('subject')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'subject'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <BookOpen size={16} />
          <span>Subject Attendance</span>
        </button>
      </div>

      {/* 1. STUDENT ATTENDANCE REPORT */}
      {activeTab === 'student' && (
        <div className="space-y-6">
          {/* Student Selector */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <User size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Choose Student:</span>
            </div>

            <div className="relative min-w-[240px]">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
              >
                {filteredStudents.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900">
                    {s.user?.full_name || `${s.first_name} ${s.last_name}`} (Adm: {s.admission_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative min-w-[200px] ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Filter dropdown list..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {loadingStudentRep ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading student report metrics...</div>
          ) : studentReport ? (
            <div className="space-y-6">
              {/* Profile & KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Student Profile Card */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                      {studentReport.student_name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-100">{studentReport.student_name}</h2>
                      <p className="text-xs text-slate-400 font-mono">Adm No: {studentReport.admission_number}</p>
                      <p className="text-xs text-indigo-400 font-semibold">
                        {studentReport.class_name} {studentReport.section_name && `- Sec ${studentReport.section_name}`}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Enrolled Sessions:</span>
                    <span className="font-bold text-slate-200 font-mono">{studentReport.total_classes}</span>
                  </div>
                </div>

                {/* Circular / Large Percentage Card */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                    <div className="text-4xl font-extrabold text-slate-100">
                      {studentReport.attendance_percentage}%
                    </div>
                    <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      studentReport.attendance_percentage >= 85
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : studentReport.attendance_percentage >= 75
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {studentReport.attendance_percentage >= 85 ? 'Excellent Standing' : studentReport.attendance_percentage >= 75 ? 'Satisfactory' : 'At Risk (<75%)'}
                    </span>
                  </div>

                  {/* Visual Ring Gauge */}
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={studentReport.attendance_percentage >= 85 ? 'text-emerald-500' : studentReport.attendance_percentage >= 75 ? 'text-amber-500' : 'text-red-500'}
                        strokeDasharray={`${studentReport.attendance_percentage}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <Percent size={20} className="absolute text-slate-400" />
                  </div>
                </div>

                {/* Breakdown Counter Matrix */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold">Present</span>
                    <span className="text-2xl font-extrabold">{studentReport.present_count}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold">Absent</span>
                    <span className="text-2xl font-extrabold">{studentReport.absent_count}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold">Late</span>
                    <span className="text-2xl font-extrabold">{studentReport.late_count}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold">Leave</span>
                    <span className="text-2xl font-extrabold">{studentReport.leave_count}</span>
                  </div>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              {studentReport.subject_breakdown && studentReport.subject_breakdown.length > 0 && (
                <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BookOpen size={16} className="text-indigo-400" />
                      <h3 className="text-sm font-bold text-slate-100">Subject-wise Attendance Distribution</h3>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4 text-center">Total Sessions</th>
                          <th className="py-3 px-4 text-center text-emerald-400">Present</th>
                          <th className="py-3 px-4 text-center text-red-400">Absent</th>
                          <th className="py-3 px-4 text-center text-amber-400">Late</th>
                          <th className="py-3 px-4 text-center text-blue-400">Leave</th>
                          <th className="py-3 px-4 text-right">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {studentReport.subject_breakdown.map((sb, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition">
                            <td className="py-3 px-4 font-bold text-slate-100">
                              {sb.subject_name} {sb.subject_code && `(${sb.subject_code})`}
                            </td>
                            <td className="py-3 px-4 text-center font-mono">{sb.total_classes}</td>
                            <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">{sb.present_count}</td>
                            <td className="py-3 px-4 text-center font-mono text-red-400">{sb.absent_count}</td>
                            <td className="py-3 px-4 text-center font-mono text-amber-400">{sb.late_count}</td>
                            <td className="py-3 px-4 text-center font-mono text-blue-400">{sb.leave_count}</td>
                            <td className="py-3 px-4 text-right font-extrabold text-indigo-300 font-mono">
                              {sb.attendance_percentage}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">Select a student to view their attendance record.</div>
          )}
        </div>
      )}

      {/* 2. CLASS ROSTER REPORT */}
      {activeTab === 'class' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">Select Class & Section:</span>
              </div>

              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  const s = sections.filter(sec => sec.class_id === parseInt(e.target.value));
                  if (s.length > 0) setSelectedSectionId(s[0].id.toString());
                }}
                className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                ))}
              </select>

              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
              >
                {classSections.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900">Section {s.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => exportToCSV(classReports, `Class_Attendance_${selectedClassId}`)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Class Summary KPIs */}
          {classReports.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="glass-card p-4 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Class Strength</span>
                <div className="text-2xl font-extrabold text-slate-100 mt-1">{classReports.length} Students</div>
              </div>

              <div className="glass-card p-4 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Class Average Rate</span>
                <div className="text-2xl font-extrabold text-indigo-400 mt-1">
                  {Math.round(classReports.reduce((acc, c) => acc + c.attendance_percentage, 0) / classReports.length)}%
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase">High Attendees (&gt;85%)</span>
                <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {classReports.filter(c => c.attendance_percentage >= 85).length}
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-semibold text-red-400 uppercase">At-Risk (&lt;75%)</span>
                <div className="text-2xl font-extrabold text-red-400 mt-1">
                  {classReports.filter(c => c.attendance_percentage < 75).length}
                </div>
              </div>
            </div>
          )}

          {/* Roster Table */}
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 w-12">Roll</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Admission No</th>
                    <th className="py-3.5 px-4 text-center">Total Sessions</th>
                    <th className="py-3.5 px-4 text-center text-emerald-400">Present</th>
                    <th className="py-3.5 px-4 text-center text-red-400">Absent</th>
                    <th className="py-3.5 px-4 text-center text-amber-400">Late</th>
                    <th className="py-3.5 px-4 text-center text-blue-400">Leave</th>
                    <th className="py-3.5 px-4 text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loadingClassRep ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                        Loading class report roster...
                      </td>
                    </tr>
                  ) : classReports.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                        No students enrolled in this section yet.
                      </td>
                    </tr>
                  ) : (
                    classReports.map((c, idx) => (
                      <tr key={c.student_id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                          {c.roll_number || `#${idx + 1}`}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-100">{c.student_name}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">{c.admission_number}</td>
                        <td className="py-3.5 px-4 text-center font-mono">{c.total_classes}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">{c.present_count}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-red-400">{c.absent_count}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-amber-400">{c.late_count}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-blue-400">{c.leave_count}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`inline-block font-mono font-extrabold px-2.5 py-1 rounded-full text-xs border ${
                            c.attendance_percentage >= 85
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : c.attendance_percentage >= 75
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-red-500/15 text-red-400 border-red-500/30'
                          }`}>
                            {c.attendance_percentage}%
                          </span>
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

      {/* 3. DAILY ATTENDANCE OVERVIEW */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingDailyRep ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                Loading daily breakdown...
              </div>
            ) : dailyReports.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                No attendance recorded for this date yet.
              </div>
            ) : (
              dailyReports.map(d => (
                <div key={d.section_id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm">{d.class_name} - Sec {d.section_name}</h3>
                      <span className="text-[11px] text-slate-400">Total Enrolled: {d.total_students}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-indigo-400">{d.attendance_percentage}%</span>
                      <div className="text-[10px] text-slate-400">Daily Rate</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-slate-800">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <div className="text-xs font-bold">{d.present_count}</div>
                      <div className="text-[9px] uppercase">Pres</div>
                    </div>
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                      <div className="text-xs font-bold">{d.absent_count}</div>
                      <div className="text-[9px] uppercase">Abs</div>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <div className="text-xs font-bold">{d.late_count}</div>
                      <div className="text-[9px] uppercase">Late</div>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      <div className="text-xs font-bold">{d.leave_count}</div>
                      <div className="text-[9px] uppercase">Leave</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. MONTHLY ANALYTICS */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Month & Year:</span>
            </div>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
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
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y} className="bg-slate-900">{y}</option>
              ))}
            </select>

            <button
              onClick={() => exportToCSV(monthlyReports, `Monthly_Attendance_${selectedMonth}_${selectedYear}`)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 ml-auto transition"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Class</th>
                    <th className="py-3.5 px-4 text-center">Days Held</th>
                    <th className="py-3.5 px-4 text-center text-emerald-400">Present</th>
                    <th className="py-3.5 px-4 text-center text-red-400">Absent</th>
                    <th className="py-3.5 px-4 text-center text-amber-400">Late</th>
                    <th className="py-3.5 px-4 text-center text-blue-400">Leave</th>
                    <th className="py-3.5 px-4 text-right">Monthly %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loadingMonthlyRep ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Loading monthly analytics...
                      </td>
                    </tr>
                  ) : monthlyReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No monthly records found for this period.
                      </td>
                    </tr>
                  ) : (
                    monthlyReports.map(m => (
                      <tr key={m.student_id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-100">{m.student_name}</td>
                        <td className="py-3.5 px-4 text-slate-300">{m.class_name} - Sec {m.section_name}</td>
                        <td className="py-3.5 px-4 text-center font-mono">{m.total_classes}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-emerald-400 font-bold">{m.present_count}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-red-400">{m.absent_count}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-amber-400">{m.late_count}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-blue-400">{m.leave_count}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-indigo-300 font-mono">
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

      {/* 5. SUBJECT ATTENDANCE */}
      {activeTab === 'subject' && (
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <BookOpen size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Choose Subject:</span>
            </div>

            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
            >
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id} className="bg-slate-900">{sub.name} ({sub.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingSubjectRep ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                Loading subject stats...
              </div>
            ) : subjectReports.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                No records recorded under this subject yet.
              </div>
            ) : (
              subjectReports.map(sb => (
                <div key={sb.subject_id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{sb.subject_name}</h3>
                      <span className="text-xs text-slate-400 font-mono">Code: {sb.subject_code}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-extrabold text-indigo-400">{sb.attendance_percentage}%</div>
                      <span className="text-[10px] text-slate-400">Average Rate</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center pt-3 border-t border-slate-800">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <div className="text-sm font-bold">{sb.present_count}</div>
                      <div className="text-[10px] uppercase">Present</div>
                    </div>
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
                      <div className="text-sm font-bold">{sb.absent_count}</div>
                      <div className="text-[10px] uppercase">Absent</div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                      <div className="text-sm font-bold">{sb.late_count}</div>
                      <div className="text-[10px] uppercase">Late</div>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                      <div className="text-sm font-bold">{sb.leave_count}</div>
                      <div className="text-[10px] uppercase">Leave</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReports;
