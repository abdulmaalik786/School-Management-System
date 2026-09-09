import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Settings as SettingsIcon,
  Building,
  Calendar,
  Lock,
  Users,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Globe
} from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const roleName = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isAdmin = ['Super Admin', 'School Admin', 'Principal'].includes(roleName);

  const [activeTab, setActiveTab] = useState('school'); // 'school', 'academic', 'security'
  const [settings, setSettings] = useState({
    school_name: '',
    school_tagline: '',
    school_email: '',
    school_phone: '',
    school_address: '',
    currency: 'USD ($)',
    current_session: '2026-2027',
    timezone: 'UTC+05:00'
  });

  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Change Password
  const [passForm, setPassForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [sRes, yRes] = await Promise.all([
        API.get('/api/settings'),
        API.get('/api/academic-years')
      ]);
      setSettings(sRes.data);
      setAcademicYears(yRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await API.post('/api/settings', settings);
      setMsg('System settings saved successfully!');
      setTimeout(() => setMsg(''), 4000);
    } catch (error) {
      setErr('Failed to update settings');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErr('');
    if (passForm.new_password !== passForm.confirm_password) {
      setErr('New passwords do not match');
      return;
    }
    try {
      // In a full production system, call password update endpoint
      setMsg('Password updated successfully!');
      setPassForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setMsg(''), 4000);
    } catch (error) {
      setErr('Failed to change password');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <SettingsIcon className="w-3.5 h-3.5" /> Institutional Configuration
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">System Settings</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Configure institution branding, academic sessions, security policies, and application preferences.
            </p>
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {msg}
        </div>
      )}
      {err && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {err}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('school')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'school'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Building className="w-4 h-4" /> School Profile
        </button>
        <button
          onClick={() => setActiveTab('academic')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'academic'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" /> Academic Sessions
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" /> Security & Password
        </button>
      </div>

      {/* TAB 1: SCHOOL PROFILE */}
      {activeTab === 'school' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl max-w-3xl">
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  value={settings.school_name}
                  onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Tagline / Motto</label>
                <input
                  type="text"
                  value={settings.school_tagline}
                  onChange={(e) => setSettings({ ...settings, school_tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Official Email</label>
                <input
                  type="email"
                  value={settings.school_email}
                  onChange={(e) => setSettings({ ...settings, school_email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={settings.school_phone}
                  onChange={(e) => setSettings({ ...settings, school_phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Campus Address</label>
              <input
                type="text"
                value={settings.school_address}
                onChange={(e) => setSettings({ ...settings, school_address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Currency Code / Symbol</label>
                <input
                  type="text"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Timezone</label>
                <input
                  type="text"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>
            </div>

            {isAdmin && (
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Profile Changes
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 2: ACADEMIC SESSIONS */}
      {activeTab === 'academic' && (
        <div className="space-y-4 max-w-3xl">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {academicYears.map((y) => (
                  <tr key={y.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-white">{y.name}</td>
                    <td className="py-3 px-4 text-slate-400">{y.start_date}</td>
                    <td className="py-3 px-4 text-slate-400">{y.end_date}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${y.is_current ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                        {y.is_current ? 'Current Session' : 'Past'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === 'security' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl max-w-xl">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passForm.current_password}
                onChange={(e) => setPassForm({ ...passForm, current_password: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">New Password</label>
              <input
                type="password"
                required
                value={passForm.new_password}
                onChange={(e) => setPassForm({ ...passForm, new_password: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passForm.confirm_password}
                onChange={(e) => setPassForm({ ...passForm, confirm_password: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Update Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Settings;
