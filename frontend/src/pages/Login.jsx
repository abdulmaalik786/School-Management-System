import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { School, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'Super Admin', username: 'superadmin', color: 'from-purple-500 to-indigo-600' },
  { role: 'School Admin', username: 'schooladmin', color: 'from-blue-500 to-cyan-600' },
  { role: 'Principal', username: 'principal', color: 'from-indigo-500 to-blue-600' },
  { role: 'Teacher', username: 'teacher', color: 'from-emerald-500 to-teal-600' },
  { role: 'Accountant', username: 'accountant', color: 'from-amber-500 to-orange-600' },
  { role: 'Librarian', username: 'librarian', color: 'from-cyan-500 to-blue-600' },
  { role: 'Parent', username: 'parent', color: 'from-rose-500 to-pink-600' },
  { role: 'Student', username: 'student', color: 'from-teal-500 to-emerald-600' },
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
      setError(err.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (username) => {
    setUsernameOrEmail(username);
    setPassword('password123');
    setError('');
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
                  Army Public <span className="text-indigo-400">School & College Islamabad</span>
                </h1>
                <p className="text-xs text-slate-400 font-medium">Army Public School & College Islamabad Portal</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-100">Welcome back</h2>
              <p className="text-xs text-slate-400 mt-1">Sign in with your assigned school role credentials</p>
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
                  Username or Email
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="e.g. superadmin or admin@school.com"
                    className="w-full pl-10 pr-4 py-3 text-xs rounded-xl glass-input text-slate-100 placeholder-slate-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 text-xs rounded-xl glass-input text-slate-100 placeholder-slate-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center text-slate-400 hover:text-slate-300 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-700 bg-slate-900 text-indigo-500 mr-2 focus:ring-0" />
                  Remember me
                </label>
                <span className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer">
                  Forgot password?
                </span>
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
                    <span>Sign In to Dashboard</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-8 border-t border-slate-800/80 mt-6 text-center">
            <p className="text-[11px] text-slate-500 font-medium">
              Enterprise Role Security & Access Enforcement System
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK ROLE SELECTOR FOR TESTING */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-8 shadow-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck size={16} />
              <span>Development Seed Access</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-1">Select User Role</h3>
            <p className="text-xs text-slate-400 mb-6">
              Click any role button below to automatically populate credentials (password: <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">password123</code>).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickFill(acc.username)}
                  className={`p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group flex flex-col justify-between hover:border-indigo-500/40 ${
                    usernameOrEmail === acc.username ? 'ring-2 ring-indigo-500 bg-indigo-950/30' : ''
                  }`}
                >
                  <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition">
                    {acc.role}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">
                    @{acc.username}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400">
            <span className="font-bold text-slate-300">Note:</span> Real backend API auth with JWT Bearer Token validation.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
