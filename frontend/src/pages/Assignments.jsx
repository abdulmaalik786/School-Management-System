import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BookMarked,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Upload,
  Award,
  Users,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const Assignments = () => {
  const { user } = useAuth();
  const roleName = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isTeacherOrAdmin = ['Super Admin', 'School Admin', 'Principal', 'Teacher'].includes(roleName);
  const isStudent = roleName === 'Student';

  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Create/Edit Assignment Modal
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    class_id: '',
    section_id: '',
    subject_id: '',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    max_marks: 100,
    attachment_url: ''
  });

  // Student Submit Modal
  const [submitModal, setSubmitModal] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [submitText, setSubmitText] = useState('');
  const [submitUrl, setSubmitUrl] = useState('');

  // Teacher Review Submissions Modal
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewAssignment, setReviewAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchMetadata();
    fetchAssignments();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [clsRes, secRes, subRes] = await Promise.all([
        API.get('/api/classes'),
        API.get('/api/sections'),
        API.get('/api/subjects')
      ]);
      setClasses(clsRes.data);
      setSections(secRes.data);
      setSubjects(subRes.data);

      if (clsRes.data.length > 0 && !form.class_id) {
        setForm(prev => ({ ...prev, class_id: clsRes.data[0].id }));
      }
      if (subRes.data.length > 0 && !form.subject_id) {
        setForm(prev => ({ ...prev, subject_id: subRes.data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/assignments');
      setAssignments(res.data);
    } catch (err) {
      console.error('Error loading assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = (assign = null) => {
    setErrorMsg('');
    if (assign) {
      setEditingAssignment(assign);
      setForm({
        title: assign.title,
        description: assign.description || '',
        class_id: assign.class_id,
        section_id: assign.section_id || '',
        subject_id: assign.subject_id,
        due_date: assign.due_date,
        max_marks: assign.max_marks,
        attachment_url: assign.attachment_url || ''
      });
    } else {
      setEditingAssignment(null);
      setForm({
        title: '',
        description: '',
        class_id: classes[0]?.id || '',
        section_id: '',
        subject_id: subjects[0]?.id || '',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        max_marks: 100,
        attachment_url: ''
      });
    }
    setShowModal(true);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        class_id: Number(form.class_id),
        section_id: form.section_id ? Number(form.section_id) : null,
        subject_id: Number(form.subject_id),
        due_date: form.due_date,
        max_marks: parseFloat(form.max_marks),
        attachment_url: form.attachment_url
      };

      if (editingAssignment) {
        await API.put(`/api/assignments/${editingAssignment.id}`, payload);
      } else {
        await API.post('/api/assignments', payload);
      }
      setShowModal(false);
      setSuccessMsg('Assignment saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchAssignments();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save assignment');
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await API.delete(`/api/assignments/${id}`);
      fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete assignment');
    }
  };

  // Open Student Submit Modal
  const handleOpenSubmit = (assign) => {
    setSubmittingAssignment(assign);
    setSubmitText(assign.my_submission?.submission_text || '');
    setSubmitUrl(assign.my_submission?.attachment_url || '');
    setSubmitModal(true);
  };

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await API.post(`/api/assignments/${submittingAssignment.id}/submit`, {
        submission_text: submitText,
        attachment_url: submitUrl
      });
      setSubmitModal(false);
      setSuccessMsg('Assignment submitted successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchAssignments();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit assignment');
    }
  };

  // Open Teacher Review Submissions Modal
  const handleOpenReview = async (assign) => {
    setReviewAssignment(assign);
    setReviewModal(true);
    setGradingSubmission(null);
    try {
      const res = await API.get(`/api/assignments/${assign.id}/submissions`);
      setSubmissions(res.data);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await API.put(`/api/assignments/submissions/${gradingSubmission.id}/grade`, {
        marks_obtained: parseFloat(gradeMarks),
        feedback: gradeFeedback
      });
      setGradingSubmission(null);
      // Reload submissions
      const res = await API.get(`/api/assignments/${reviewAssignment.id}/submissions`);
      setSubmissions(res.data);
      fetchAssignments();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to grade submission');
    }
  };

  const filteredAssignments = assignments.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.class_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-900/50 via-slate-900/60 to-indigo-900/50 border border-slate-800 p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
              <BookMarked className="w-3.5 h-3.5" /> Academic Tasks & Homework
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Assignments & Homework</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Create homework assignments, submit coursework online, review student submissions, and award grades with written feedback.
            </p>
          </div>
          {isTeacherOrAdmin && (
            <button
              onClick={() => handleOpenCreateModal()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" /> Create Assignment
            </button>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search assignments by title, subject, or class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Assignment Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <BookMarked className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No assignments found</h3>
          <p className="text-slate-400 text-sm mt-1">Create an assignment to distribute homework to students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((a) => {
            const isPastDue = new Date() > new Date(a.due_date);
            const mySub = a.my_submission;

            return (
              <div key={a.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between group hover:border-slate-700 transition-all">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {a.subject_name}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-md flex items-center gap-1 font-medium ${isPastDue ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-300'}`}>
                      <Calendar className="w-3 h-3" /> Due: {a.due_date}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{a.description || 'No detailed instructions provided.'}</p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Class:</span>
                      <strong className="text-white">{a.class_name} {a.section_name ? `(${a.section_name})` : ''}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Marks:</span>
                      <strong className="text-emerald-400">{a.max_marks} pts</strong>
                    </div>
                    {a.attachment_url && (
                      <div className="flex justify-between items-center pt-1">
                        <span>Attachment:</span>
                        <a href={a.attachment_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]">
                          View Resource <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  {isStudent && (
                    <div className="w-full">
                      {mySub ? (
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${mySub.status === 'Graded' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {mySub.status} {mySub.status === 'Graded' ? `(${mySub.marks_obtained}/${a.max_marks} pts)` : ''}
                          </span>
                          <button
                            onClick={() => handleOpenSubmit(a)}
                            className="text-xs text-slate-400 hover:text-white underline"
                          >
                            Resubmit
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenSubmit(a)}
                          className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" /> Submit Homework
                        </button>
                      )}
                    </div>
                  )}

                  {isTeacherOrAdmin && (
                    <>
                      <button
                        onClick={() => handleOpenReview(a)}
                        className="flex-1 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        Submissions ({a.submissions_count})
                      </button>
                      <button onClick={() => handleOpenCreateModal(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteAssignment(a.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-amber-400" />
                {editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Math Problem Set 4"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Class *</label>
                  <select
                    value={form.class_id}
                    onChange={(e) => setForm({ ...form, class_id: e.target.value, section_id: '' })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Subject *</label>
                  <select
                    value={form.subject_id}
                    onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Max Marks *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.max_marks}
                    onChange={(e) => setForm({ ...form, max_marks: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Instructions / Description</label>
                <textarea
                  rows="3"
                  placeholder="Task instructions and guidelines..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Attachment URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.attachment_url}
                  onChange={(e) => setForm({ ...form, attachment_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold">Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT SUBMISSION MODAL */}
      {submitModal && submittingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" /> Submit Assignment
              </h3>
              <button onClick={() => setSubmitModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
              <strong className="text-white text-sm block">{submittingAssignment.title}</strong>
              <span className="text-slate-400">Subject: {submittingAssignment.subject_name} • Due: {submittingAssignment.due_date}</span>
            </div>

            <form onSubmit={handleSubmitHomework} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Your Solution / Comments</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Type your response, working notes, or answers here..."
                  value={submitText}
                  onChange={(e) => setSubmitText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Attachment URL / Drive Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={submitUrl}
                  onChange={(e) => setSubmitUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setSubmitModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold">Submit Work</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER REVIEW SUBMISSIONS MODAL */}
      {reviewModal && reviewAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" /> Student Submissions: {reviewAssignment.title}
                </h3>
                <span className="text-xs text-slate-400">Total Marks: {reviewAssignment.max_marks} pts</span>
              </div>
              <button onClick={() => setReviewModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grading Form Drawer if active */}
            {gradingSubmission && (
              <form onSubmit={handleGradeSubmission} className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
                <h4 className="text-sm font-bold text-white">
                  Grading Submission: <span className="text-indigo-400">{gradingSubmission.student_name}</span>
                </h4>
                <div className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block mb-1">Student Answer:</span>
                  {gradingSubmission.submission_text || 'No text submitted.'}
                  {gradingSubmission.attachment_url && (
                    <a href={gradingSubmission.attachment_url} target="_blank" rel="noreferrer" className="block text-indigo-400 mt-2 underline">
                      Open Attachment Link
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Score Obtained (Max {reviewAssignment.max_marks})</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={reviewAssignment.max_marks}
                      required
                      value={gradeMarks}
                      onChange={(e) => setGradeMarks(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Feedback</label>
                    <input
                      type="text"
                      placeholder="e.g. Well researched, good job!"
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setGradingSubmission(null)} className="px-3 py-1 bg-slate-800 text-xs text-slate-300 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-lg">Save Grade</button>
                </div>
              </form>
            )}

            {/* Submissions Table */}
            {submissions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">No student submissions received yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Submitted At</th>
                      <th className="py-2.5 px-3 text-center">Score</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {submissions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-white">{s.student_name} ({s.admission_number})</td>
                        <td className="py-2.5 px-3 text-slate-400">{new Date(s.submitted_at).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">
                          {s.marks_obtained !== null ? `${s.marks_obtained} / ${reviewAssignment.max_marks}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold ${s.status === 'Graded' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setGradingSubmission(s);
                              setGradeMarks(s.marks_obtained !== null ? String(s.marks_obtained) : '');
                              setGradeFeedback(s.feedback || '');
                            }}
                            className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-semibold"
                          >
                            Grade / Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
