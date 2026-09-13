import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AIChatWidget from '../components/AIChatWidget';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  School,
  CheckCircle2,
  PhoneCall,
  Mail,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const Admissions = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    parentName: '',
    email: '',
    phone: '',
    gradeApplying: 'Grade 1',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none"></div>

      {/* PUBLIC NAVBAR */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/admissions" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <School size={22} />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">EduPulse <span className="text-indigo-400">Academy</span></span>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Public Admissions Portal</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center space-x-1.5"
            >
              <span>Portal Login</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <Sparkles size={14} className="text-amber-400" />
            <span>Admissions Open for Academic Year 2026-2027</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Empowering Next Generation <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">Leaders</span>
          </h1>

          <p className="text-slate-300 text-base leading-relaxed max-w-2xl">
            Welcome to EduPulse International School. We foster academic excellence, innovative STEM labs, and holistic character building from Grade 1 through Grade 12.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <GraduationCap className="text-indigo-400 mb-2" size={24} />
              <h3 className="font-bold text-sm text-white">Top 1% Curriculum</h3>
              <p className="text-xs text-slate-400 mt-1">Holistic STEM & Arts programs</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <BookOpen className="text-purple-400 mb-2" size={24} />
              <h3 className="font-bold text-sm text-white">Smart Classrooms</h3>
              <p className="text-xs text-slate-400 mt-1">Digital interactive learning</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <ShieldCheck className="text-emerald-400 mb-2" size={24} />
              <h3 className="font-bold text-sm text-white">Safe Campus</h3>
              <p className="text-xs text-slate-400 mt-1">GPS-tracked fleet & security</p>
            </div>
          </div>
        </div>

        {/* INQUIRY & CALLBACK FORM */}
        <div id="callback-form" className="lg:col-span-5 glass-card rounded-3xl p-8 border border-slate-800 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Request a Callback & Inquiry</span>
              <Sparkles size={16} className="text-indigo-400" />
            </h2>
            <p className="text-xs text-slate-400 mt-1">Fill this form to get a direct callback from our Admissions Office & receive the official prospectus.</p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center space-y-3">
              <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
              <h3 className="font-bold text-base">Inquiry Received!</h3>
              <p className="text-xs text-slate-300">Thank you, {formData.parentName}. Our admissions officer will contact you within 24 hours.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 text-xs text-indigo-400 font-bold underline"
              >
                Submit another inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Student's Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="e.g. Alex Johnson"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Parent / Guardian Name</label>
                <input
                  type="text"
                  required
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="e.g. Robert Johnson"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="parent@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Grade Applying For</label>
                  <select
                    value={formData.gradeApplying}
                    onChange={(e) => setFormData({ ...formData, gradeApplying: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white bg-slate-900 focus:outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
              >
                Submit Admission Inquiry
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <School size={16} className="text-indigo-400" />
            <span className="font-bold text-slate-200">EduPulse International Academy</span>
            <span>© 2026 All Rights Reserved.</span>
          </div>

          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5"><PhoneCall size={14} className="text-indigo-400" /> +1 (800) 555-EDU1</span>
            <span className="flex items-center gap-1.5"><Mail size={14} className="text-purple-400" /> admissions@edupulse-school.edu</span>
          </div>
        </div>
      </footer>

      {/* EMBEDDED PUBLIC AI CHATBOT (ACCESSIBLE WITHOUT LOGIN) */}
      <AIChatWidget isPublic={true} />
    </div>
  );
};

export default Admissions;
