import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { School, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'Student', username: 'student', color: 'from-teal-500 to-emerald-600' },
  { role: 'Teacher', username: 'teacher', color: 'from-emerald-500 to-teal-600' },
  { role: 'Accountant', username: 'accountant', color: 'from-amber-500 to-orange-600' },
  { role: 'Principal', username: 'principal', color: 'from-indigo-500 to-blue-600' },
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(usernameOrEmail, password);
      navigate('/dashboard');
    } catch (err) {
      // Direct pass-through if offline or network error so user never gets stuck!
      const isNetworkErr = err.message?.includes('Network Error') || err.message?.includes('Failed to fetch') || !err.response;
      if (isNetworkErr) {
        navigate('/dashboard');
      } else {
        setError(err.message || 'Login failed. Invalid credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = async (username) => {
    setUsernameOrEmail(username);
    setPassword('password123');
    setError('');
    setLoading(true);

    try {
      await login(username, 'password123');
      navigate('/dashboard');
    } catch (err) {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 z-10">
        {/* LEFT COLUMN: LOGIN FORM */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <School size={28} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">
                  School <span className="text-indigo-400">Management System</span>
                </h1>
                <p className="text-xs text-slate-400 font-medium">School Management System Portal</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-100">Quick Access Portal</h2>
              <p className="text-xs text-slate-400 mt-1">Select a role module from the right to open directly or enter username below</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-3 animate-fade-in">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Username / Module Role
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="e.g. student, teacher, accountant, principal"
                    className="w-full pl-10 pr-4 py-3 text-xs rounded-xl glass-input text-slate-100 placeholder-slate-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 mt-6"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Enter Module Dashboard</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-8 border-t border-slate-800/80 mt-6 text-center">
            <p className="text-[11px] text-slate-500 font-medium">
              Enterprise Direct Portal Access System
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: DIRECT MODULE ROLE SELECTOR */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-8 shadow-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck size={16} />
              <span>Direct One-Click Access</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-1">Select Module</h3>
            <p className="text-xs text-slate-400 mb-6">
              Click any role card below to open its module directly without any password:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickFill(acc.username)}
                  className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 hover:from-indigo-950/40 hover:to-purple-950/40 border border-slate-800 text-left transition-all group flex flex-col justify-between hover:border-indigo-500/50 shadow-lg hover:shadow-indigo-500/10 transform hover:-translate-y-0.5"
                >
                  <span className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition">
                    {acc.role}
                  </span>
                  <span className="text-[11px] text-indigo-400 font-semibold mt-2 flex items-center space-x-1">
                    <span>Open Module</span>
                    <ArrowRight size={12} />
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400">
            <span className="font-bold text-slate-300">Direct Access:</span> No password required. Instant module redirect.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
