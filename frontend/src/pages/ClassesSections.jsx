import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  GraduationCap,
  Layers
} from 'lucide-react';

const ClassesSections = () => {
  const { user } = useAuth();
  const userRoleName = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isManagement = ['Super Admin', 'School Admin', 'Principal', 'Admin'].includes(userRoleName) || !user;

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [selectedClassForSection, setSelectedClassForSection] = useState(null);

  // Class Form State
  const [className, setClassName] = useState('');
  const [numericGrade, setNumericGrade] = useState('');
  const [classDesc, setClassDesc] = useState('');

  // Section Form State
  const [sectionName, setSectionName] = useState('A');
  const [sectionClassTeacherId, setSectionClassTeacherId] = useState('');

  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clsRes, tchRes] = await Promise.all([
        API.get('/api/classes'),
        API.get('/api/teachers')
      ]);
      setClasses(clsRes.data);
      setTeachers(tchRes.data);
    } catch (err) {
      console.error('Failed to fetch classes & teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddClass = () => {
    setClassName('');
    setNumericGrade('');
    setClassDesc('');
    setEditClass(null);
    setFormError('');
    setShowClassModal(true);
  };

  const handleOpenEditClass = (c) => {
    setEditClass(c);
    setClassName(c.name);
    setNumericGrade(c.numeric_grade || '');
    setClassDesc(c.description || '');
    setFormError('');
    setShowClassModal(true);
  };

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const payload = {
        name: className,
        numeric_grade: numericGrade ? parseInt(numericGrade) : null,
        description: classDesc
      };

      if (editClass) {
        await API.put(`/api/classes/${editClass.id}`, payload);
        setSuccessMsg('Class updated successfully!');
      } else {
        await API.post('/api/classes', payload);
        setSuccessMsg('Class created successfully!');
      }

      setShowClassModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save class');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenAddSection = (c) => {
    setSelectedClassForSection(c);
    setSectionName('A');
    setSectionClassTeacherId(teachers.length > 0 ? teachers[0].id : '');
    setFormError('');
    setShowSectionModal(true);
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const payload = {
        name: sectionName,
        class_id: selectedClassForSection.id,
        class_teacher_id: sectionClassTeacherId ? parseInt(sectionClassTeacherId) : null
      };

      await API.post('/api/sections', payload);
      setSuccessMsg(`Section ${sectionName} added to ${selectedClassForSection.name}!`);
      setShowSectionModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to add section');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteClass = async (id) => {
    if (window.confirm('Delete this class and all associated sections?')) {
      try {
        await API.delete(`/api/classes/${id}`);
        setSuccessMsg('Class deleted.');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete class');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen size={16} />
            <span>Academic Structure</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100">Classes & Sections</h1>
          <p className="text-xs text-slate-400 mt-1">
            Grade levels, classroom sections, class teachers, and student rosters
          </p>
        </div>

        {isManagement && (
          <button
            onClick={handleOpenAddClass}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center space-x-2 transition shrink-0"
          >
            <Plus size={16} />
            <span>Create New Class</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* CLASSES LIST */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading class structure...
          </div>
        ) : classes.length === 0 ? (
          <div className="py-12 text-center text-slate-400 glass-card rounded-3xl p-8 border border-slate-800">
            No classes created yet. Click "Create New Class" to begin.
          </div>
        ) : (
          classes.map((c) => (
            <div key={c.id} className="glass-card rounded-3xl border border-slate-800 p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 mb-4 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
                    {c.numeric_grade || c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{c.name}</h3>
                    <p className="text-xs text-slate-400">
                      {c.description || 'General section grade'} • <span className="text-blue-300 font-semibold">{c.student_count} Enrolled Students</span>
                    </p>
                  </div>
                </div>

                {isManagement && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenAddSection(c)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <Plus size={14} />
                      <span>Add Section</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditClass(c)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Edit Class"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(c.id)}
                      className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition"
                      title="Delete Class"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* SECTIONS GRID */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sections in {c.name}</h4>
                {c.sections.length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
                    No sections added to this class yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {c.sections.map((sec) => (
                      <div
                        key={sec.id}
                        className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Section {sec.name}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 flex items-center">
                              <Users size={12} className="mr-1" /> {sec.student_count} Students
                            </span>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-800/60 text-xs">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Class Teacher</p>
                            <p className="text-slate-200 font-bold flex items-center mt-0.5">
                              <GraduationCap size={14} className="text-emerald-400 mr-1.5 shrink-0" />
                              {sec.class_teacher_name || 'Unassigned'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT CLASS MODAL */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-3xl p-6 border border-slate-800 relative">
            <button
              onClick={() => setShowClassModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-100 mb-1">
              {editClass ? 'Edit Class' : 'Create New Class'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">Define class name and grade number</p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleClassSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Class Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 1 or Senior Secondary"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Numeric Grade</label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={numericGrade}
                  onChange={(e) => setNumericGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Class details..."
                  value={classDesc}
                  onChange={(e) => setClassDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editClass ? 'Update Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SECTION MODAL */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-3xl p-6 border border-slate-800 relative">
            <button
              onClick={() => setShowSectionModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-100 mb-1">
              Add Section to {selectedClassForSection?.name}
            </h2>
            <p className="text-xs text-slate-400 mb-6">Assign section name and class teacher</p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSectionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Section Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A, B, C, D"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none uppercase font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Assign Class Teacher</label>
                <select
                  value={sectionClassTeacherId}
                  onChange={(e) => setSectionClassTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none bg-slate-900"
                >
                  <option value="">Unassigned</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.employee_id})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : 'Add Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesSections;
