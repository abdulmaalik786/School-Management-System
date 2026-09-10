import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileCheck2,
  Printer,
  Search,
  Filter,
  Award,
  GraduationCap,
  TrendingUp,
  BarChart3,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  School,
  Download,
  BookOpen,
  Users
} from 'lucide-react';

const GRADE_BADGE = {
  'A+': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'A': 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  'B': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'C': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'D': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'F': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  'ABS': 'bg-slate-800 text-slate-400 border-slate-700',
  'N/A': 'bg-slate-800 text-slate-400 border-slate-700'
};

const Results = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryExamId = searchParams.get('exam_id') || '';

  // Tab State
  const [activeTab, setActiveTab] = useState('student'); // 'student', 'class', 'exam'

  // Metadata
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [exams, setExams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  // Student Report Card State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentReport, setStudentReport] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // Class Result State
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [classReport, setClassReport] = useState(null);
  const [loadingClass, setLoadingClass] = useState(false);

  // Exam Analytics State
  const [selectedExamId, setSelectedExamId] = useState(queryExamId);
  const [examAnalytics, setExamAnalytics] = useState(null);
  const [loadingExam, setLoadingExam] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (queryExamId) {
      setActiveTab('exam');
      setSelectedExamId(queryExamId);
    }
  }, [queryExamId]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentReport(selectedStudentId);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassReport(selectedClassId, selectedSectionId);
    }
  }, [selectedClassId, selectedSectionId]);

  useEffect(() => {
    if (selectedExamId) {
      fetchExamAnalytics(selectedExamId);
    }
  }, [selectedExamId]);

  const fetchMetadata = async () => {
    try {
      const [stuRes, clsRes, secRes, exRes, ayRes] = await Promise.all([
        API.get('/api/students'),
        API.get('/api/classes'),
        API.get('/api/sections'),
        API.get('/api/exams'),
        API.get('/api/academic-years')
      ]);
      setStudents(stuRes.data);
      setClasses(clsRes.data);
      setSections(secRes.data);
      setExams(exRes.data);
      setAcademicYears(ayRes.data);

      if (user?.role === 'Student' && user?.student_profile) {
        setSelectedStudentId(String(user.student_profile.id));
      } else if (stuRes.data.length > 0 && !selectedStudentId) {
        setSelectedStudentId(String(stuRes.data[0].id));
      }

      if (clsRes.data.length > 0 && !selectedClassId) {
        setSelectedClassId(String(clsRes.data[0].id));
      }

      if (exRes.data.length > 0 && !selectedExamId) {
        setSelectedExamId(String(exRes.data[0].id));
      }
    } catch (err) {
      console.error('Error loading results metadata:', err);
    }
  };

  const fetchStudentReport = async (studentId) => {
    setLoadingStudent(true);
    try {
      const res = await API.get(`/api/results/student/${studentId}`);
      setStudentReport(res.data);
    } catch (err) {
      console.error('Error fetching student report card:', err);
      setStudentReport(null);
    } finally {
      setLoadingStudent(false);
    }
  };

  const fetchClassReport = async (classId, sectionId) => {
    setLoadingClass(true);
    try {
      const url = sectionId
        ? `/api/results/class/${classId}?section_id=${sectionId}`
        : `/api/results/class/${classId}`;
      const res = await API.get(url);
      setClassReport(res.data);
    } catch (err) {
      console.error('Error fetching class result:', err);
      setClassReport(null);
    } finally {
      setLoadingClass(false);
    }
  };

  const fetchExamAnalytics = async (examId) => {
    setLoadingExam(true);
    try {
      const res = await API.get(`/api/results/exam/${examId}`);
      setExamAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching exam analytics:', err);
      setExamAnalytics(null);
    } finally {
      setLoadingExam(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header (hidden during print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Award className="w-8 h-8 text-indigo-400" /> Academic Results & Report Cards
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Official cumulative grade sheets, student printable report cards, GPA calculations, and class performance analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/marks-entry')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700 transition-all flex items-center gap-2"
          >
            <FileCheck2 className="w-4 h-4 text-emerald-400" /> Grade Marks
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Printer className="w-4 h-4" /> Print Report Card
          </button>
        </div>
      </div>

      {/* Navigation Tabs (hidden during print) */}
      <div className="print:hidden flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('student')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'student'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Student Report Card
        </button>
        <button
          onClick={() => setActiveTab('class')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'class'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Class Result Sheet
        </button>
        <button
          onClick={() => setActiveTab('exam')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'exam'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Exam Performance
        </button>
      </div>

      {/* TAB 1: STUDENT REPORT CARD */}
      {activeTab === 'student' && (
        <div className="space-y-6">
          {/* Student Selector (hidden during print) */}
          <div className="print:hidden bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Select Student Profile
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || `${s.first_name} ${s.last_name}`} (Roll: {s.roll_number || 'N/A'}, {s.class_name})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Printable Layout:</span>
              <div className="text-sm font-semibold text-emerald-400">Official Format Ready</div>
            </div>
          </div>

          {loadingStudent ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !studentReport ? (
            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
              <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white">No student result record found</h3>
              <p className="text-slate-400 text-sm mt-1">Please select a student who has exam marks recorded.</p>
            </div>
          ) : (
            /* Official Printable Report Card Document */
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl print:bg-white print:text-black print:p-6 print:border-none print:shadow-none">
              {/* Report Card Header */}
              <div className="border-b-2 border-slate-700/80 print:border-black pb-6 mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 print:bg-slate-100 print:text-black print:border-black">
                      <School className="w-9 h-9" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-white print:text-black uppercase">
                        School Management System
                      </h2>
                      <p className="text-xs text-slate-400 print:text-slate-600">
                        Excellence in Academic Mastery & Moral Leadership • Est. 1998
                      </p>
                      <div className="text-xs font-semibold text-indigo-400 print:text-black mt-1">
                        OFFICIAL STUDENT PERFORMANCE REPORT CARD
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 print:bg-slate-100 print:text-black print:border-black text-xs font-mono font-bold">
                      {studentReport.exam_name}
                    </div>
                    <div className="text-xs text-slate-400 print:text-slate-600 mt-1">
                      Academic Session: <strong>{studentReport.academic_year_name || '2026-2027'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-300 mb-6 text-xs">
                <div>
                  <span className="text-slate-400 print:text-slate-600 block">Student Name</span>
                  <strong className="text-white print:text-black text-sm">{studentReport.student_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-600 block">Admission Number</span>
                  <strong className="text-white print:text-black text-sm font-mono">{studentReport.admission_number}</strong>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-600 block">Class & Section</span>
                  <strong className="text-white print:text-black text-sm">
                    {studentReport.class_name} {studentReport.section_name ? `(${studentReport.section_name})` : ''}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-600 block">Class Roll No / Rank</span>
                  <strong className="text-white print:text-black text-sm">
                    #{studentReport.roll_number || 'N/A'} (Rank: #{studentReport.rank_in_class})
                  </strong>
                </div>
              </div>

              {/* Subject Scores Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-800 print:border-black bg-slate-950/80 print:bg-slate-100 text-slate-400 print:text-black uppercase font-semibold">
                      <th className="py-3 px-3">Subject</th>
                      <th className="py-3 px-3 w-28">Code</th>
                      <th className="py-3 px-3 text-center w-28">Max Marks</th>
                      <th className="py-3 px-3 text-center w-28">Passing</th>
                      <th className="py-3 px-3 text-center w-32">Obtained Marks</th>
                      <th className="py-3 px-3 text-center w-24">Percentage</th>
                      <th className="py-3 px-3 text-center w-20">Grade</th>
                      <th className="py-3 px-3 text-center w-24">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 print:divide-slate-300">
                    {studentReport.subjects.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20 print:hover:bg-transparent">
                        <td className="py-3 px-3 font-semibold text-white print:text-black">
                          {sub.subject_name}
                        </td>
                        <td className="py-3 px-3 text-slate-400 print:text-slate-600 font-mono">
                          {sub.subject_code || '-'}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-300 print:text-black font-semibold">
                          {sub.total_marks}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-400 print:text-slate-600">
                          {sub.passing_marks}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-white print:text-black text-sm">
                          {sub.is_absent ? 'ABS' : sub.marks_obtained}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-slate-300 print:text-black">
                          {sub.is_absent ? '0%' : `${sub.percentage}%`}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${GRADE_BADGE[sub.grade] || 'text-slate-400'}`}>
                            {sub.grade}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          {sub.is_absent ? (
                            <span className="text-slate-500">ABSENT</span>
                          ) : sub.is_passed ? (
                            <span className="text-emerald-400 print:text-emerald-700">PASS</span>
                          ) : (
                            <span className="text-rose-400 print:text-rose-700">FAIL</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals Row */}
                  <tfoot>
                    <tr className="border-t-2 border-slate-700 print:border-black bg-slate-950/90 print:bg-slate-100 font-bold text-white print:text-black">
                      <td colSpan="2" className="py-3.5 px-3 uppercase text-slate-400 print:text-black">
                        Cumulative Grand Total
                      </td>
                      <td className="py-3.5 px-3 text-center">{studentReport.total_max_marks}</td>
                      <td className="py-3.5 px-3 text-center">-</td>
                      <td className="py-3.5 px-3 text-center text-indigo-400 print:text-black text-sm">
                        {studentReport.total_obtained_marks}
                      </td>
                      <td className="py-3.5 px-3 text-center text-sm font-mono">
                        {studentReport.overall_percentage}%
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${GRADE_BADGE[studentReport.overall_grade] || ''}`}>
                          {studentReport.overall_grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center text-sm">
                        <span className={studentReport.result_status === 'PASS' ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}>
                          {studentReport.result_status}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-950/80 print:bg-slate-50 border border-slate-800 print:border-slate-300 mb-8">
                <div className="text-center">
                  <span className="text-xs uppercase text-slate-400 print:text-slate-600 block">Total Score</span>
                  <div className="text-xl font-extrabold text-white print:text-black mt-1">
                    {studentReport.total_obtained_marks} / {studentReport.total_max_marks}
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-xs uppercase text-slate-400 print:text-slate-600 block">Percentage</span>
                  <div className="text-xl font-extrabold text-indigo-400 print:text-black mt-1 font-mono">
                    {studentReport.overall_percentage}%
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-xs uppercase text-slate-400 print:text-slate-600 block">Grade Point Average</span>
                  <div className="text-xl font-extrabold text-emerald-400 print:text-black mt-1 font-mono">
                    {studentReport.gpa.toFixed(1)} / 4.0
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-xs uppercase text-slate-400 print:text-slate-600 block">Overall Status</span>
                  <div className={`text-xl font-black mt-1 ${studentReport.result_status === 'PASS' ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}`}>
                    {studentReport.result_status} (Grade {studentReport.overall_grade})
                  </div>
                </div>
              </div>

              {/* Signatures & Seal Block */}
              <div className="pt-10 border-t border-slate-800 print:border-slate-400 grid grid-cols-3 gap-6 text-center text-xs text-slate-400 print:text-slate-600">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-700 print:border-black mb-2"></div>
                  <span>Class Teacher's Signature</span>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-700 print:border-black mb-2"></div>
                  <span>Examination Controller</span>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-700 print:border-black mb-2"></div>
                  <span>Principal's Official Seal</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLASS RESULT SHEET */}
      {activeTab === 'class' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Section</label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Sections</option>
                  {sections.filter(s => s.class_id === Number(selectedClassId)).map(s => (
                    <option key={s.id} value={s.id}>Section {s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {classReport && (
              <div className="flex items-center gap-4 text-xs">
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  Pass Rate: <strong>{classReport.pass_percentage}%</strong>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  Average: <strong>{classReport.class_average_percentage}%</strong>
                </div>
              </div>
            )}
          </div>

          {loadingClass ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !classReport ? (
            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white">No class results recorded</h3>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4 w-14">Rank</th>
                    <th className="py-3 px-4 w-16">Roll</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4 text-center">Total Marks</th>
                    <th className="py-3 px-4 text-center">Percentage</th>
                    <th className="py-3 px-4 text-center">Grade</th>
                    <th className="py-3 px-4 text-center">GPA</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {classReport.students_summary.map((st) => (
                    <tr key={st.student_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        #{st.rank_in_class}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {st.roll_number || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{st.student_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{st.admission_number}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-200">
                        {st.total_obtained_marks} / {st.total_max_marks}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-indigo-300">
                        {st.overall_percentage}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold border ${GRADE_BADGE[st.overall_grade] || ''}`}>
                          {st.overall_grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        {st.gpa.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={st.result_status === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}>
                          {st.result_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedStudentId(String(st.student_id));
                            setActiveTab('student');
                          }}
                          className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold"
                        >
                          Report Card
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXAM PERFORMANCE ANALYTICS */}
      {activeTab === 'exam' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Select Exam Assessment
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} — {ex.subject_name} ({ex.class_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingExam ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !examAnalytics ? (
            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
              <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white">No exam data available</h3>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-xs uppercase text-slate-400 block">Highest Score</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {examAnalytics.highest_score} <span className="text-xs font-normal text-slate-500">/ {examAnalytics.total_marks}</span>
                  </div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-xs uppercase text-slate-400 block">Lowest Score</span>
                  <div className="text-2xl font-black text-rose-400 mt-1">
                    {examAnalytics.lowest_score} <span className="text-xs font-normal text-slate-500">/ {examAnalytics.total_marks}</span>
                  </div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-xs uppercase text-slate-400 block">Average Score</span>
                  <div className="text-2xl font-black text-indigo-400 mt-1">
                    {examAnalytics.average_score} <span className="text-xs font-normal text-slate-500">/ {examAnalytics.total_marks}</span>
                  </div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-xs uppercase text-slate-400 block">Passed Count</span>
                  <div className="text-2xl font-black text-teal-400 mt-1">
                    {examAnalytics.passed_count} / {examAnalytics.appeared_count}
                  </div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-xs uppercase text-slate-400 block">Pass Rate</span>
                  <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
                    {examAnalytics.pass_percentage}%
                  </div>
                </div>
              </div>

              {/* Marks Sheet Table */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                      <th className="py-3 px-4 w-16">Roll No</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4 text-center">Marks Obtained</th>
                      <th className="py-3 px-4 text-center">Percentage</th>
                      <th className="py-3 px-4 text-center">Grade</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {examAnalytics.marks.map((m) => (
                      <tr key={m.student_id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400">{m.roll_number || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{m.student_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{m.admission_number}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-white text-sm">
                          {m.is_absent ? 'ABSENT' : m.marks_obtained}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-slate-300">
                          {m.is_absent ? '0%' : `${m.percentage}%`}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold border ${GRADE_BADGE[m.grade] || ''}`}>
                            {m.grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {m.is_absent ? (
                            <span className="text-slate-500">ABSENT</span>
                          ) : m.is_passed ? (
                            <span className="text-emerald-400">PASS</span>
                          ) : (
                            <span className="text-rose-400">FAIL</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{m.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Results;
