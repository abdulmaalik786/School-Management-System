import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  Plus,
  Search,
  Filter,
  Calendar,
  BookOpen,
  Users,
  CheckCircle2,
  Edit2,
  Trash2,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FileCheck2,
  BarChart2,
  X
} from 'lucide-react';

const EXAM_TYPES = [
  'Monthly Test',
  'Mid Term',
  'Final Term',
  'Quiz',
  'Assignment'
];

const TYPE_COLORS = {
  'Monthly Test': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Mid Term': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Final Term': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Quiz': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Assignment': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
};

const Exams = () => {
  const { user } = useAuth();
  const roleName = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const canManage = ['Super Admin', 'School Admin', 'Principal', 'Teacher'].includes(roleName);
  const isAdmin = ['Super Admin', 'School Admin', 'Principal'].includes(roleName);

  // States
  const [exams, setExams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Filters
  const [filterYear, setFilterYear] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterType, setFilterType] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [modalForm, setModalForm] = useState({
    name: '',
    exam_type: 'Monthly Test',
    academic_year_id: '',
    class_id: '',
    section_id: '',
    subject_id: '',
    exam_date: new Date().toISOString().split('T')[0],
    total_marks: 100,
    passing_marks: 40,
    description: ''
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchMetadata();
    fetchExams();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [ayRes, clsRes, secRes, subRes] = await Promise.all([
        API.get('/api/academic-years'),
        API.get('/api/classes'),
        API.get('/api/sections'),
        API.get('/api/subjects')
      ]);
      setAcademicYears(ayRes.data);
      setClasses(clsRes.data);
      setSections(secRes.data);
      setSubjects(subRes.data);

      const activeYear = ayRes.data.find(y => y.is_active);
      if (activeYear) {
        setModalForm(prev => ({ ...prev, academic_year_id: activeYear.id }));
      } else if (ayRes.data.length > 0) {
        setModalForm(prev => ({ ...prev, academic_year_id: ayRes.data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/exams');
      setExams(res.data);
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (exam = null) => {
    setFormError('');
    if (exam) {
      setEditingExam(exam);
      setModalForm({
        name: exam.name,
        exam_type: exam.exam_type,
        academic_year_id: exam.academic_year_id,
        class_id: exam.class_id,
        section_id: exam.section_id || '',
        subject_id: exam.subject_id,
        exam_date: exam.exam_date,
        total_marks: exam.total_marks,
        passing_marks: exam.passing_marks,
        description: exam.description || ''
      });
    } else {
      setEditingExam(null);
      const activeYear = academicYears.find(y => y.is_active);
      setModalForm({
        name: '',
        exam_type: 'Monthly Test',
        academic_year_id: activeYear ? activeYear.id : (academicYears[0]?.id || ''),
        class_id: classes[0]?.id || '',
        section_id: '',
        subject_id: subjects[0]?.id || '',
        exam_date: new Date().toISOString().split('T')[0],
        total_marks: 100,
        passing_marks: 40,
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (Number(modalForm.passing_marks) > Number(modalForm.total_marks)) {
      setFormError('Passing marks cannot exceed total marks');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: modalForm.name,
        exam_type: modalForm.exam_type,
        academic_year_id: Number(modalForm.academic_year_id),
        class_id: Number(modalForm.class_id),
        section_id: modalForm.section_id ? Number(modalForm.section_id) : null,
        subject_id: Number(modalForm.subject_id),
        exam_date: modalForm.exam_date,
        total_marks: parseFloat(modalForm.total_marks),
        passing_marks: parseFloat(modalForm.passing_marks),
        description: modalForm.description
      };

      if (editingExam) {
        await API.put(`/api/exams/${editingExam.id}`, payload);
      } else {
        await API.post('/api/exams', payload);
      }
      setShowModal(false);
      fetchExams();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await API.delete(`/api/exams/${deleteId}`);
      setDeleteId(null);
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete exam');
    }
  };

  // Filter sections by selected class in modal
  const modalSections = sections.filter(s => s.class_id === Number(modalForm.class_id));

  // Filter exams
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.class_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = !filterYear || exam.academic_year_id === Number(filterYear);
    const matchesClass = !filterClass || exam.class_id === Number(filterClass);
    const matchesType = !filterType || exam.exam_type === filterType;
    return matchesSearch && matchesYear && matchesClass && matchesType;
  });

  // Analytics counts
  const totalExamsCount = exams.length;
  const midTermCount = exams.filter(e => e.exam_type === 'Mid Term').length;
  const finalTermCount = exams.filter(e => e.exam_type === 'Final Term').length;
  const monthlyCount = exams.filter(e => e.exam_type === 'Monthly Test').length;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/50 via-slate-900/60 to-purple-900/50 border border-slate-800 p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <Award className="w-3.5 h-3.5" /> Examination Hub
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Exams & Assessments</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Schedule, configure, and manage monthly tests, mid-terms, final exams, quizzes, and grading structures.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/marks-entry')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" /> Enter Marks
            </button>
            <button
              onClick={() => navigate('/results')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <BarChart2 className="w-4 h-4 text-indigo-400" /> View Results & Report Cards
            </button>
            {canManage && (
              <button
                onClick={() => handleOpenModal()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                <Plus className="w-4 h-4" /> Create Exam
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Total Scheduled Exams</div>
          <div className="text-2xl font-bold text-white">{totalExamsCount}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase text-blue-400 mb-1">Monthly Tests</div>
          <div className="text-2xl font-bold text-blue-400">{monthlyCount}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase text-purple-400 mb-1">Mid Term Exams</div>
          <div className="text-2xl font-bold text-purple-400">{midTermCount}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase text-rose-400 mb-1">Final Term Exams</div>
          <div className="text-2xl font-bold text-rose-400">{finalTermCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search exam by title, subject, or class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Academic Years</option>
            {academicYears.map(y => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Exam Types</option>
            {EXAM_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Exam Grid List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No examinations found</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            {searchTerm || filterClass || filterType ? 'Try adjusting your search criteria.' : 'Create an exam assessment to start recording grades.'}
          </p>
          {canManage && (
            <button
              onClick={() => handleOpenModal()}
              className="mt-5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Exam
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map(exam => {
            const entered = exam.marks_entered_count || 0;
            const total = exam.total_enrolled_students || 0;
            const isGraded = entered > 0 && entered >= total;

            return (
              <div
                key={exam.id}
                className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 backdrop-blur-sm transition-all hover:shadow-xl hover:shadow-indigo-500/5 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TYPE_COLORS[exam.exam_type] || 'bg-slate-800 text-slate-300'}`}>
                      {exam.exam_type}
                    </span>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      {exam.exam_date}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {exam.name}
                  </h3>

                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" /> Subject:
                      </span>
                      <span className="font-medium text-white">{exam.subject_name} ({exam.subject_code})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" /> Target Class:
                      </span>
                      <span className="font-medium text-white">
                        {exam.class_name} {exam.section_name ? `(${exam.section_name})` : '(All Sections)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                      <span className="text-slate-400">Total Marks: <strong className="text-white text-sm">{exam.total_marks}</strong></span>
                      <span className="text-slate-400">Passing Marks: <strong className="text-emerald-400 text-sm">{exam.passing_marks}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-slate-400">Grading Progress</span>
                    <span className={`font-semibold ${isGraded ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {entered} / {total} Students
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full ${isGraded ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-indigo-500'}`}
                      style={{ width: `${total > 0 ? (entered / total) * 100 : 0}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => navigate(`/marks-entry?exam_id=${exam.id}`)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" /> Grade Marks
                    </button>
                    <button
                      onClick={() => navigate(`/results?exam_id=${exam.id}`)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      <BarChart2 className="w-3.5 h-3.5" /> Results
                    </button>
                    {canManage && (
                      <button
                        onClick={() => handleOpenModal(exam)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit Exam"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteId(exam.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                {editingExam ? 'Edit Examination' : 'Create New Examination'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Exam Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid Term Assessment 2026, Monthly Quiz 1"
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Exam Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalForm.exam_type}
                    onChange={(e) => setModalForm({ ...modalForm, exam_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {EXAM_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalForm.academic_year_id}
                    onChange={(e) => setModalForm({ ...modalForm, academic_year_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {academicYears.map(y => (
                      <option key={y.id} value={y.id}>{y.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalForm.class_id}
                    onChange={(e) => setModalForm({ ...modalForm, class_id: e.target.value, section_id: '' })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Section (Optional)
                  </label>
                  <select
                    value={modalForm.section_id}
                    onChange={(e) => setModalForm({ ...modalForm, section_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Sections</option>
                    {modalSections.map(s => (
                      <option key={s.id} value={s.id}>Section {s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalForm.subject_id}
                    onChange={(e) => setModalForm({ ...modalForm, subject_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Exam Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={modalForm.exam_date}
                    onChange={(e) => setModalForm({ ...modalForm, exam_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Total Marks <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={modalForm.total_marks}
                    onChange={(e) => setModalForm({ ...modalForm, total_marks: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Passing Marks <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={modalForm.passing_marks}
                    onChange={(e) => setModalForm({ ...modalForm, passing_marks: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Description / Syllabus Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="Optional notes or topics covered in this exam..."
                  value={modalForm.description}
                  onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all flex items-center gap-2"
                >
                  {saving ? 'Saving...' : editingExam ? 'Update Exam' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Delete Examination?</h3>
            <p className="text-sm text-slate-400">
              Are you sure you want to delete this exam? All student marks associated with this exam will also be permanently deleted.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium"
              >
                Yes, Delete Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
