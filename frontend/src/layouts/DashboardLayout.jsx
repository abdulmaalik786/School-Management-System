import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Heart,
  Calendar,
  BookOpen,
  BookMarked,
  ClipboardCheck,
  Award,
  FileCheck2,
  Receipt,
  Library,
  Bus,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  KeyRound,
  Bell,
  Search,
  School,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Megaphone,
  TrendingUp,
  FolderOpen
} from 'lucide-react';

const allNavigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['All'] },
  { name: 'Students', path: '/students', icon: Users, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Accountant'] },
  { name: 'Teachers', path: '/teachers', icon: GraduationCap, roles: ['Super Admin', 'School Admin', 'Principal'] },
  { name: 'Parents', path: '/parents', icon: Heart, roles: ['Super Admin', 'School Admin', 'Principal'] },
  { name: 'Academic Years', path: '/academic-years', icon: Calendar, roles: ['Super Admin', 'School Admin', 'Principal'] },
  { name: 'Classes & Sections', path: '/classes', icon: BookOpen, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher'] },
  { name: 'Subjects', path: '/subjects', icon: BookMarked, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher'] },
  { name: 'Periods', path: '/periods', icon: Clock, roles: ['Super Admin', 'School Admin', 'Principal'] },
  { name: 'Timetable', path: '/timetable', icon: Calendar, roles: ['All'] },
  { name: 'Student Attendance', path: '/attendance', icon: ClipboardCheck, roles: ['All'] },
  { name: 'Teacher Attendance', path: '/teacher-attendance', icon: UserCheck, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher'] },
  { name: 'Attendance Reports', path: '/attendance-reports', icon: BarChart3, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher'] },
  { name: 'Exams', path: '/exams', icon: Award, roles: ['All'] },
  { name: 'Marks Entry', path: '/marks-entry', icon: FileCheck2, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher'] },
  { name: 'Results & Cards', path: '/results', icon: Award, roles: ['All'] },
  { name: 'Fee Management', path: '/fees', icon: Receipt, roles: ['Super Admin', 'School Admin', 'Principal', 'Accountant', 'Student', 'Parent'] },
  { name: 'Assignments', path: '/assignments', icon: BookMarked, roles: ['Super Admin', 'School Admin', 'Principal', 'Teacher', 'Student'] },
  { name: 'Library', path: '/library', icon: Library, roles: ['Super Admin', 'School Admin', 'Principal', 'Librarian', 'Teacher'] },
  { name: 'Transport', path: '/transport', icon: Bus, roles: ['Super Admin', 'School Admin', 'Principal', 'Accountant', 'Parent'] },
  { name: 'School Calendar', path: '/calendar', icon: Calendar, roles: ['All'] },
  { name: 'Announcements', path: '/announcements', icon: Megaphone, roles: ['All'] },
  { name: 'Reports Hub', path: '/reports', icon: TrendingUp, roles: ['Super Admin', 'School Admin', 'Principal', 'Accountant', 'Teacher'] },
  { name: 'Settings', path: '/settings', icon: Settings, roles: ['Super Admin', 'School Admin', 'Principal'] },
];

const DashboardLayout = () => {
  const { user, logout, changePassword } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Notification Drawer
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/api/notifications');
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters');
      return;
    }

    setPwdSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwdSuccess('Password updated successfully!');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwdSuccess('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err) {
      setPwdError(err.message || 'Failed to update password');
    } finally {
      setPwdSubmitting(false);
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

  const userRole = user?.role || 'Super Admin';
  const visibleNavItems = allNavigationItems.filter(
    item => item.roles.includes('All') || item.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200">
      {/* SIDEBAR */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } transition-all duration-300 ease-in-out glass-card border-r border-slate-800 flex flex-col fixed inset-y-0 left-0 z-30`}
      >
        {/* Brand Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
              <School size={22} />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-extrabold text-slate-100 text-sm leading-tight tracking-tight">
                  School <span className="text-indigo-400">Management System</span>
                </h1>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                  SMS ERP v1.0
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="ml-3 truncate">{item.name}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-slate-200 text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-xl border border-slate-800 z-50 pointer-events-none">
                    {item.name}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card inside Sidebar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0">
              {user?.full_name ? user.full_name.charAt(0) : <User size={18} />}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.full_name || user?.username}</p>
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${getRoleBadgeColor(
                    userRole
                  )}`}
                >
                  {userRole}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN WRAPPER */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        {/* TOPBAR */}
        <header className="h-16 glass-card sticky top-0 z-20 border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative w-64 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search students, exams, fees, records..."
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl glass-input text-slate-200 placeholder-slate-400 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center space-x-3">
            {/* Notification Button */}
            <button
              onClick={() => setShowNotifDrawer(!showNotifDrawer)}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition relative"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-900"></span>
            </button>

            {/* Change Password Button */}
            <button
              onClick={() => setShowPasswordModal(true)}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition flex items-center space-x-2 text-xs font-medium"
              title="Change Password"
            >
              <KeyRound size={16} />
              <span className="hidden md:inline">Password</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center space-x-2 transition"
            >
              <LogOut size={16} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* NOTIFICATION DRAWER OVERLAY */}
        {showNotifDrawer && (
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-sm bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl animate-fadeIn">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-400" /> Notifications & Alerts
                  </h3>
                  <button onClick={() => setShowNotifDrawer(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-4 space-y-3 overflow-y-auto max-h-[75vh]">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">No unread notifications at this time.</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                        <div className="text-xs font-bold text-white">{n.title}</div>
                        <p className="text-[11px] text-slate-300">{n.message}</p>
                        <span className="text-[10px] text-slate-500">{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setShowNotifDrawer(false);
                  navigate('/announcements');
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold"
              >
                Open Notice Board
              </button>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-2xl p-6 shadow-2xl border border-slate-800 relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Change Password</h3>
                <p className="text-xs text-slate-400">Update account access security key</p>
              </div>
            </div>

            {pwdError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            {pwdSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
                  placeholder="Repeat new password"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {pwdSubmitting ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
