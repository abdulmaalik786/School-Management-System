import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Activity,
  ArrowUpRight,
  UserCheck,
  AlertCircle,
  FileCheck2,
  Receipt,
  BookMarked,
  Library,
  Bus,
  Bell,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ClipboardCheck,
  Layers
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  const userRole = typeof user?.role === 'object' ? user?.role?.name : (user?.role || 'Super Admin');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (roleName) => {
    switch (roleName) {
      case 'Super Admin':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'School Admin':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Principal':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'Teacher':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Accountant':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Librarian':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'Parent':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Student':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* WELCOME BANNER */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-900/70 via-purple-900/50 to-slate-900 border border-indigo-500/20 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getRoleBadgeColor(userRole)}`}>
                {userRole} Portal
              </span>
              <span className="text-xs text-slate-400 font-semibold flex items-center">
                <CheckCircle2 size={14} className="text-emerald-400 mr-1" />
                Live PostgreSQL Database Connected
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, {user?.full_name || user?.username}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Army Public School & College Islamabad ERP • Real-time academic tracking, live attendance roll call, automated grading, and financial operations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-950/60 border border-slate-800 px-4 py-3 rounded-2xl flex items-center space-x-3 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Activity size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">System Status</p>
                <p className="text-xs font-bold text-emerald-400">100% Operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !stats ? (
        <div className="text-center py-12 text-slate-400">No dashboard data available.</div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 1. ADMIN / PRINCIPAL DASHBOARD VIEW */}
          {/* ========================================================================= */}
          {['Super Admin', 'School Admin', 'Principal'].includes(userRole) && (
            <div className="space-y-8">
              {/* Primary KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => navigate('/students')}
                  className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 backdrop-blur-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase text-slate-400">Total Students</span>
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white">{stats.total_students}</div>
                  <div className="text-xs text-indigo-400 flex items-center gap-1 mt-2">
                    Enrolled across {stats.total_classes} Classes <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                <div
                  onClick={() => navigate('/teachers')}
                  className="bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 backdrop-blur-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase text-slate-400">Faculty Members</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white">{stats.total_teachers}</div>
                  <div className="text-xs text-purple-400 flex items-center gap-1 mt-2">
                    Teaching {stats.total_subjects} Subjects <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                <div
                  onClick={() => navigate('/attendance')}
                  className="bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 backdrop-blur-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase text-emerald-400">Today's Attendance</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-emerald-400">
                    {stats.today_present_students} <span className="text-sm font-normal text-slate-500">Present</span>
                  </div>
                  <div className="text-xs text-rose-400 flex items-center gap-1 mt-2">
                    {stats.today_absent_students} Students Absent
                  </div>
                </div>

                <div
                  onClick={() => navigate('/fees')}
                  className="bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 backdrop-blur-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase text-amber-400">Fee Revenue</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                      <Receipt className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-amber-400">
                    ${stats.total_fees_collected?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                    ${stats.today_fees_collected?.toLocaleString() || 0} Collected Today
                  </div>
                </div>
              </div>

              {/* Charts & Analytics Visuals */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance Trends */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" /> Student Attendance (Past 7 Days)
                  </h3>
                  <div className="space-y-3">
                    {stats.attendance_trends?.map((t, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                          <span>{t.date}</span>
                          <span className="text-emerald-400">{t.rate}% ({t.present} P / {t.absent} A)</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            style={{ width: `${t.rate}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Class Enrollment Distribution */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" /> Enrollment by Class
                  </h3>
                  <div className="space-y-3">
                    {stats.enrollment_by_class?.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-xs font-bold text-white">{c.class_name}</span>
                        <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {c.students_count} Students
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-400" /> Fee Collection Breakdown
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Total Collected</span>
                      <span className="font-mono font-bold text-emerald-400">${stats.total_fees_collected?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Pending Invoices</span>
                      <span className="font-mono font-bold text-blue-400">${stats.total_fees_pending?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Overdue Invoices</span>
                      <span className="font-mono font-bold text-rose-400">${stats.total_fees_overdue?.toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/fees')}
                    className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    Open Fee Suite <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Actions Navigation Bar */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Fast ERP Navigation
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <button
                    onClick={() => navigate('/timetable')}
                    className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-center transition-all group"
                  >
                    <Calendar className="w-6 h-6 text-indigo-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-white block">Timetable</span>
                  </button>
                  <button
                    onClick={() => navigate('/exams')}
                    className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-purple-600/20 border border-slate-800 hover:border-purple-500/40 text-center transition-all group"
                  >
                    <Award className="w-6 h-6 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-white block">Exams</span>
                  </button>
                  <button
                    onClick={() => navigate('/results')}
                    className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-emerald-600/20 border border-slate-800 hover:border-emerald-500/40 text-center transition-all group"
                  >
                    <FileCheck2 className="w-6 h-6 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-white block">Results</span>
                  </button>
                  <button
                    onClick={() => navigate('/assignments')}
                    className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-amber-600/20 border border-slate-800 hover:border-amber-500/40 text-center transition-all group"
                  >
                    <BookMarked className="w-6 h-6 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-white block">Assignments</span>
                  </button>
                  <button
                    onClick={() => navigate('/library')}
                    className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-cyan-600/20 border border-slate-800 hover:border-cyan-500/40 text-center transition-all group"
                  >
                    <Library className="w-6 h-6 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-white block">Library</span>
                  </button>
                  <button
                    onClick={() => navigate('/reports')}
                    className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-rose-600/20 border border-slate-800 hover:border-rose-500/40 text-center transition-all group"
                  >
                    <TrendingUp className="w-6 h-6 text-rose-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-white block">Reports Hub</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. TEACHER DASHBOARD VIEW */}
          {/* ========================================================================= */}
          {userRole === 'Teacher' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                  <span className="text-xs uppercase font-semibold text-slate-400 block mb-1">Assigned Classes</span>
                  <div className="text-3xl font-black text-white">{stats.assigned_classes_count || 0}</div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                  <span className="text-xs uppercase font-semibold text-indigo-400 block mb-1">Assigned Subjects</span>
                  <div className="text-3xl font-black text-indigo-400">{stats.assigned_subjects_count || 0}</div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                  <span className="text-xs uppercase font-semibold text-emerald-400 block mb-1">Today's Class Periods</span>
                  <div className="text-3xl font-black text-emerald-400">{stats.today_classes_count || 0}</div>
                </div>
                <div
                  onClick={() => navigate('/assignments')}
                  className="bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 backdrop-blur-xl cursor-pointer"
                >
                  <span className="text-xs uppercase font-semibold text-amber-400 block mb-1">Submissions to Grade</span>
                  <div className="text-3xl font-black text-amber-400">{stats.pending_submissions_count || 0}</div>
                </div>
              </div>

              {/* Today's Teaching Schedule */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-400" /> Today's Teaching Schedule
                  </h3>
                  <button
                    onClick={() => navigate('/attendance')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ClipboardCheck className="w-4 h-4" /> Mark Attendance
                  </button>
                </div>

                {stats.today_timetable?.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No periods scheduled for today.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.today_timetable?.map((t) => (
                      <div key={t.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                        <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                          <span className="font-bold text-indigo-400">{t.period}</span>
                          <span>{t.start_time} - {t.end_time}</span>
                        </div>
                        <h4 className="font-bold text-white text-base">{t.subject}</h4>
                        <div className="text-xs text-slate-400 mt-1">Class {t.class} {t.section ? `(${t.section})` : ''} • Room {t.room}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. STUDENT DASHBOARD VIEW */}
          {/* ========================================================================= */}
          {userRole === 'Student' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                  <span className="text-xs uppercase font-semibold text-emerald-400 block mb-1">Attendance Rate</span>
                  <div className="text-3xl font-black text-emerald-400">{stats.attendance_percentage}%</div>
                  <div className="text-xs text-slate-400 mt-1">{stats.present_days} Days Present</div>
                </div>
                <div
                  onClick={() => navigate('/results')}
                  className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 backdrop-blur-xl cursor-pointer"
                >
                  <span className="text-xs uppercase font-semibold text-indigo-400 block mb-1">My Report Card</span>
                  <div className="text-lg font-bold text-white mt-2">View Grades & GPA</div>
                  <div className="text-xs text-indigo-400 mt-1 flex items-center gap-1">Open <ArrowRight className="w-3 h-3" /></div>
                </div>
                <div
                  onClick={() => navigate('/assignments')}
                  className="bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 backdrop-blur-xl cursor-pointer"
                >
                  <span className="text-xs uppercase font-semibold text-amber-400 block mb-1">Assignments</span>
                  <div className="text-lg font-bold text-white mt-2">{stats.recent_assignments?.length || 0} Homework Tasks</div>
                  <div className="text-xs text-amber-400 mt-1 flex items-center gap-1">Submit online <ArrowRight className="w-3 h-3" /></div>
                </div>
                <div
                  onClick={() => navigate('/fees')}
                  className="bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-5 backdrop-blur-xl cursor-pointer"
                >
                  <span className="text-xs uppercase font-semibold text-rose-400 block mb-1">Fee Balance</span>
                  <div className="text-2xl font-black text-rose-400">${stats.total_fees_pending?.toLocaleString() || 0}</div>
                  <div className="text-xs text-slate-400 mt-1">View Invoices</div>
                </div>
              </div>

              {/* Student Timetable & Homework */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" /> Today's Class Schedule
                  </h3>
                  {stats.today_timetable?.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No periods scheduled today.</div>
                  ) : (
                    <div className="space-y-3">
                      {stats.today_timetable?.map((t) => (
                        <div key={t.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-white">{t.subject}</div>
                            <div className="text-xs text-slate-400">Teacher: {t.teacher || 'Assigned Faculty'} • Room {t.room}</div>
                          </div>
                          <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                            {t.start_time} - {t.end_time}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-amber-400" /> Pending Homework & Tasks
                  </h3>
                  {stats.recent_assignments?.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No pending assignments.</div>
                  ) : (
                    <div className="space-y-3">
                      {stats.recent_assignments?.map((a) => (
                        <div key={a.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-white">{a.title}</div>
                            <div className="text-xs text-slate-400">Subject: {a.subject} • Due: {a.due_date}</div>
                          </div>
                          <button
                            onClick={() => navigate('/assignments')}
                            className="px-3 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold"
                          >
                            Submit
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. PARENT DASHBOARD VIEW */}
          {/* ========================================================================= */}
          {userRole === 'Parent' && (
            <div className="space-y-8">
              {stats.children?.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                  No children currently linked to this parent profile.
                </div>
              ) : (
                <>
                  {/* Child Selector Tabs if multiple */}
                  {stats.children.length > 1 && (
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                      {stats.children.map((child, idx) => (
                        <button
                          key={child.student_id}
                          onClick={() => setSelectedChildIndex(idx)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            selectedChildIndex === idx
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {child.student_name} ({child.class_name})
                        </button>
                      ))}
                    </div>
                  )}

                  {(() => {
                    const c = stats.children[selectedChildIndex] || stats.children[0];
                    return (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                            <span className="text-xs uppercase font-semibold text-slate-400 block mb-1">Child Name</span>
                            <div className="text-xl font-bold text-white">{c.student_name}</div>
                            <div className="text-xs text-slate-400 mt-1 font-mono">{c.admission_number}</div>
                          </div>
                          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                            <span className="text-xs uppercase font-semibold text-emerald-400 block mb-1">Attendance Rate</span>
                            <div className="text-3xl font-black text-emerald-400">{c.attendance_percentage}%</div>
                          </div>
                          <div
                            onClick={() => navigate('/results')}
                            className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 backdrop-blur-xl cursor-pointer"
                          >
                            <span className="text-xs uppercase font-semibold text-indigo-400 block mb-1">Report Card</span>
                            <div className="text-sm font-bold text-white mt-1">View Terms & Grades</div>
                            <div className="text-xs text-indigo-400 mt-1">Open Card &rarr;</div>
                          </div>
                          <div
                            onClick={() => navigate('/fees')}
                            className="bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-5 backdrop-blur-xl cursor-pointer"
                          >
                            <span className="text-xs uppercase font-semibold text-rose-400 block mb-1">Outstanding Fees</span>
                            <div className="text-2xl font-black text-rose-400">${c.total_fees_pending?.toLocaleString() || 0}</div>
                          </div>
                        </div>

                        {/* Recent Marks */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <Award className="w-4 h-4 text-purple-400" /> Recent Examination Marks
                          </h3>
                          {c.recent_marks?.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">No exam marks entered yet.</div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {c.recent_marks?.map((m, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                                  <div className="text-xs text-slate-400 font-semibold">{m.exam_name}</div>
                                  <h4 className="font-bold text-white text-base mt-1">{m.subject}</h4>
                                  <div className="text-xl font-extrabold text-emerald-400 mt-2">
                                    {m.marks_obtained} <span className="text-xs text-slate-500">/ {m.total_marks} ({m.percentage}%)</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. ACCOUNTANT DASHBOARD VIEW */}
          {/* ========================================================================= */}
          {userRole === 'Accountant' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                  <span className="text-xs uppercase font-semibold text-amber-400 block mb-1">Today's Intake</span>
                  <div className="text-3xl font-black text-amber-400">${stats.today_collected?.toLocaleString() || 0}</div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                  <span className="text-xs uppercase font-semibold text-emerald-400 block mb-1">Total Collected</span>
                  <div className="text-3xl font-black text-emerald-400">${stats.monthly_collected?.toLocaleString() || 0}</div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                  <span className="text-xs uppercase font-semibold text-blue-400 block mb-1">Pending Balance</span>
                  <div className="text-3xl font-black text-blue-400">${stats.total_pending?.toLocaleString() || 0}</div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                  <span className="text-xs uppercase font-semibold text-rose-400 block mb-1">Overdue Invoices</span>
                  <div className="text-3xl font-black text-rose-400">${stats.total_overdue?.toLocaleString() || 0}</div>
                </div>
              </div>

              {/* Recent Payments Table */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" /> Recent Fee Payments
                  </h3>
                  <button
                    onClick={() => navigate('/fees')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    Open Full Suite
                  </button>
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                      <th className="py-3 px-4">Receipt</th>
                      <th className="py-3 px-4">Invoice</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {stats.recent_payments?.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">{p.receipt_number}</td>
                        <td className="py-3 px-4 font-mono text-white">{p.invoice_number}</td>
                        <td className="py-3 px-4 font-semibold text-white">{p.student_name}</td>
                        <td className="py-3 px-4">{p.payment_method}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">${p.amount_paid?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
