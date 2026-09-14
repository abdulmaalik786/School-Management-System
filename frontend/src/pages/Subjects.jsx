import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BookMarked,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  GraduationCap,
  BookOpen,
  Clock
} from 'lucide-react';

const Subjects = () => {
  const { user } = useAuth();
  const userRoleName = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isManagement = ['Super Admin', 'School Admin', 'Principal', 'Admin'].includes(userRoleName) || !user;

  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [classFilter, setClassFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editSubject, setEditSubject] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    weekly_periods: 4,
    class_id: '',
    teacher_id: ''
  });

  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Official Pakistan Curriculum Presets (Classes 1 - 10)
  const STANDARD_CURRICULUM = [
    // Primary Tier (Class 1 to 5)
    ...[1, 2, 3, 4, 5].flatMap(c => [
      { id: `c${c}_sub1`, name: 'English Language', code: `ENG-00${c}`, class_id: c, class_name: `Class ${c}`, description: 'Basic literacy, grammar & vocabulary (Sabaq.pk Curriculum)', weekly_periods: 5 },
      { id: `c${c}_sub2`, name: 'Urdu', code: `URD-00${c}`, class_id: c, class_name: `Class ${c}`, description: 'National language reading, writing & comprehension', weekly_periods: 5 },
      { id: `c${c}_sub3`, name: 'Mathematics', code: `MTH-00${c}`, class_id: c, class_name: `Class ${c}`, description: 'Basic numeracy, arithmetic & problem solving', weekly_periods: 6 },
      { id: `c${c}_sub4`, name: 'General Knowledge / Science', code: `GKN-00${c}`, class_id: c, class_name: `Class ${c}`, description: 'Basic science, social values & environment studies', weekly_periods: 4 },
      { id: `c${c}_sub5`, name: 'Islamiat', code: `ISL-00${c}`, class_id: c, class_name: `Class ${c}`, description: 'Basic Islamic principles, Ethics & Nazra Quran', weekly_periods: 3 }
    ]),

    // Middle Tier (Class 6 to 8)
    ...[6, 7, 8].flatMap(c => [
      { id: `c${c}_sub1`, name: 'Mathematics', code: `MTH-00${c}`, class_id: c, class_name: `Class ${c}`, description: 'Algebra, Geometry & Arithmetic reasoning', weekly_periods: 6 },
      { id: `c${c}_sub2`, name: 'General Science', code: `GSC-00${c}`, class_id: c, class_name: `Class ${c}`, description: 'Physics, Chemistry & Biology basics', weekly_periods: 5 },
      { id: `c${c}_sub3`, name: 'English', code: `ENG-00${c}`, class_id: c, class_name: `Class ${c}`, description: 'Grammar, Literature & Composition', weekly_periods: 5 },
      { id: `c${c}_sub4`, name: 'Urdu', code: `URD-00${c}`, class_id: c, class_name: `Class ${c}`, description: 'Urdu Adab, Essay Writing & Grammar', weekly_periods: 5 },
      { id: `c${c}_sub5`, name: 'Islamiyat', code: `ISL-00${c}`, class_id: c, class_name: `Class ${c}`, description: 'Islamic History, Quranic Surahs & Ethics', weekly_periods: 3 },
      { id: `c${c}_sub6`, name: 'History & Geography', code: `SST-00${c}`, class_id: c, class_name: `Class ${c}`, description: 'Subcontinent History & World Physical Geography', weekly_periods: 4 },
      { id: `c${c}_sub7`, name: 'Computer Studies', code: `CMP-00${c}`, class_id: c, class_name: `Class ${c}`, description: 'Computer Basics, ICT & Programming Concepts', weekly_periods: 3 }
    ]),

    // Secondary / Matric Tier (Class 9 & 10)
    ...[9, 10].flatMap(c => [
      { id: `c${c}_sub1`, name: 'Mathematics (Science Group)', code: `MTH-0${c}`, class_id: c, class_name: `Class ${c}`, description: 'Matric Board Mathematics & Trigonometry', weekly_periods: 6 },
      { id: `c${c}_sub2`, name: 'Physics', code: `PHY-0${c}`, class_id: c, class_name: `Class ${c}`, description: 'Mechanics, Electromagnetism & Modern Physics', weekly_periods: 5 },
      { id: `c${c}_sub3`, name: 'Chemistry', code: `CHM-0${c}`, class_id: c, class_name: `Class ${c}`, description: 'Organic, Inorganic & Physical Chemistry', weekly_periods: 5 },
      { id: `c${c}_sub4`, name: 'Biology / Computer Science', code: `BIO-0${c}`, class_id: c, class_name: `Class ${c}`, description: 'Elective Bio / Computer Programming & C++', weekly_periods: 5 },
      { id: `c${c}_sub5`, name: 'English Compulsory', code: `ENG-0${c}`, class_id: c, class_name: `Class ${c}`, description: 'Board English Essay, Precis & Grammar', weekly_periods: 5 },
      { id: `c${c}_sub6`, name: 'Urdu Compulsory', code: `URD-0${c}`, class_id: c, class_name: `Class ${c}`, description: 'Board Urdu Prose, Poetry & Grammar', weekly_periods: 5 },
      { id: `c${c}_sub7`, name: 'Islamiyat Compulsory', code: `ISL-0${c}`, class_id: c, class_name: `Class ${c}`, description: 'Surah Anfal, Ahadith & Islamic Ideology', weekly_periods: 3 },
      { id: `c${c}_sub8`, name: 'Pakistan Studies', code: `PST-0${c}`, class_id: c, class_name: `Class ${c}`, description: 'History, Constitution & Resources of Pakistan', weekly_periods: 3 }
    ])
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/api/subjects';
      if (classFilter) url += `?class_id=${classFilter}`;
      
      const [subRes, clsRes, tchRes] = await Promise.all([
        API.get(url),
        API.get('/api/classes'),
        API.get('/api/teachers')
      ]);

      const loadedSubs = subRes.data || [];
      // Combine API subjects with standard curriculum, avoiding duplicate subject codes
      const dbCodes = new Set(loadedSubs.map(s => s.code));
      const combined = [
        ...loadedSubs,
        ...STANDARD_CURRICULUM.filter(s => !dbCodes.has(s.code))
      ];

      const filtered = classFilter ? combined.filter(s => s.class_id === parseInt(classFilter)) : combined;
      setSubjects(filtered);

      if (clsRes.data && clsRes.data.length > 0) {
        setClasses(clsRes.data);
      } else {
        setClasses(Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Class ${i + 1}` })));
      }
      setTeachers(tchRes.data || []);
    } catch (err) {
      console.warn('API subjects failed, loading standard curriculum presets:', err);
      setClasses(Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Class ${i + 1}` })));
      const filtered = classFilter ? STANDARD_CURRICULUM.filter(s => s.class_id === parseInt(classFilter)) : STANDARD_CURRICULUM;
      setSubjects(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classFilter]);

  const handleOpenAdd = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormData({
      name: 'Physics',
      code: `PHY-${randomNum}`,
      description: 'Fundamentals of Mechanics & Thermodynamics',
      weekly_periods: 4,
      class_id: classes.length > 0 ? classes[0].id : '',
      teacher_id: teachers.length > 0 ? teachers[0].id : ''
    });
    setEditSubject(null);
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (s) => {
    setEditSubject(s);
    setFormData({
      name: s.name,
      code: s.code,
      description: s.description || '',
      weekly_periods: s.weekly_periods || 4,
      class_id: s.class_id || '',
      teacher_id: s.teacher_id || ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const payload = {
        ...formData,
        weekly_periods: parseInt(formData.weekly_periods),
        class_id: formData.class_id ? parseInt(formData.class_id) : null,
        teacher_id: formData.teacher_id ? parseInt(formData.teacher_id) : null
      };

      if (editSubject) {
        await API.put(`/api/subjects/${editSubject.id}`, payload);
        setSuccessMsg('Subject details updated!');
      } else {
        await API.post('/api/subjects', payload);
        setSuccessMsg('Subject added to curriculum!');
      }

      setShowAddModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save subject');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm('Remove this subject from curriculum?')) {
      try {
        await API.delete(`/api/subjects/${id}`);
        setSuccessMsg('Subject removed.');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete subject');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BookMarked size={16} />
            <span>Curriculum Management</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100">Subjects & Courses</h1>
          <p className="text-xs text-slate-400 mt-1">
            Academic subjects, codes, weekly period allocations, and assigned educators
          </p>
        </div>

        {isManagement && (
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition shrink-0"
          >
            <Plus size={16} />
            <span>Add New Subject</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FILTER */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300">Filter Curriculum by Class</span>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl glass-input text-slate-200 focus:outline-none bg-slate-900"
        >
          <option value="">All Classes</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Subject Name</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Assigned Class</th>
                <th className="px-6 py-4">Subject Educator</th>
                <th className="px-6 py-4">Weekly Periods</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading subjects catalog...
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    No subject records found.
                  </td>
                </tr>
              ) : (
                subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-medium text-slate-100 flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-100">{s.name}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{s.description || 'General course'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-purple-300">{s.code}</td>
                    <td className="px-6 py-4">
                      {s.class_name ? (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px] font-semibold">
                          {s.class_name}
                        </span>
                      ) : (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {s.teacher_name ? (
                        <span className="flex items-center">
                          <GraduationCap size={14} className="text-emerald-400 mr-1.5 shrink-0" />
                          {s.teacher_name}
                        </span>
                      ) : (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-100">
                      <span className="flex items-center">
                        <Clock size={14} className="text-amber-400 mr-1" />
                        {s.weekly_periods} Periods/wk
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {isManagement && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition"
                            title="Edit Subject"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(s.id)}
                            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition"
                            title="Delete Subject"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-100 mb-1">
              {editSubject ? 'Edit Subject' : 'Add New Subject'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">Assign subject code, class level, and teacher</p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Physics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PHY-101"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Assigned Class</label>
                  <select
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none bg-slate-900"
                  >
                    <option value="">Unassigned</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Assign Educator</label>
                  <select
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none bg-slate-900"
                  >
                    <option value="">Unassigned</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Weekly Periods</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.weekly_periods}
                  onChange={(e) => setFormData({ ...formData, weekly_periods: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Course description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editSubject ? 'Update Subject' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
