import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileCheck2,
  Save,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Users,
  Award,
  BookOpen,
  Calendar,
  Sparkles,
  BarChart3
} from 'lucide-react';

const calculateGrade = (obtained, total, isAbsent, passing) => {
  if (isAbsent) return { grade: 'ABS', percentage: 0, isPassed: false, gpa: 0.0 };
  const pct = total > 0 ? (obtained / total) * 100 : 0;
  const isPassed = obtained >= passing;
  let grade = 'F';
  let gpa = 0.0;

  if (!isPassed || pct < 50) {
    grade = 'F';
    gpa = 0.0;
  } else if (pct >= 90) {
    grade = 'A+';
    gpa = 4.0;
  } else if (pct >= 80) {
    grade = 'A';
    gpa = 3.5;
  } else if (pct >= 70) {
    grade = 'B';
    gpa = 3.0;
  } else if (pct >= 60) {
    grade = 'C';
    gpa = 2.5;
  } else if (pct >= 50) {
    grade = 'D';
    gpa = 2.0;
  }

  return { grade, percentage: Number(pct.toFixed(2)), isPassed, gpa };
};

const GRADE_STYLES = {
  'A+': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'A': 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  'B': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'C': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'D': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'F': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  'ABS': 'bg-slate-800 text-slate-400 border-slate-700',
  'N/A': 'bg-slate-800 text-slate-400 border-slate-700'
};

const MarksEntry = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialExamId = searchParams.get('exam_id') || '';

  // States
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(initialExamId);
  const [selectedExam, setSelectedExam] = useState(null);
  const [studentsMarks, setStudentsMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExamsList();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadExamDetailsAndMarks(selectedExamId);
      setSearchParams({ exam_id: selectedExamId });
    } else {
      setSelectedExam(null);
      setStudentsMarks([]);
    }
  }, [selectedExamId]);

  const fetchExamsList = async () => {
    try {
      const res = await API.get('/api/exams');
      setExams(res.data);
      if (!selectedExamId && res.data.length > 0) {
        setSelectedExamId(String(res.data[0].id));
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    }
  };

  const loadExamDetailsAndMarks = async (examId) => {
    setLoading(true);
    setErrorMessage('');
    setSaveSuccess(false);
    try {
      const [examRes, marksRes] = await Promise.all([
        API.get(`/api/exams/${examId}`),
        API.get(`/api/exams/${examId}/marks`)
      ]);
      setSelectedExam(examRes.data);

      const mapped = marksRes.data.map(m => {
        const calc = calculateGrade(m.marks_obtained, examRes.data.total_marks, m.is_absent, examRes.data.passing_marks);
        return {
          student_id: m.student_id,
          student_name: m.student_name,
          admission_number: m.admission_number,
          roll_number: m.roll_number,
          marks_obtained: m.marks_obtained,
          is_absent: m.is_absent,
          remarks: m.remarks || '',
          percentage: calc.percentage,
          grade: calc.grade,
          is_passed: calc.isPassed
        };
      });
      setStudentsMarks(mapped);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to load exam marks roster');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, value) => {
    if (!selectedExam) return;
    const numVal = value === '' ? 0 : parseFloat(value);

    setStudentsMarks(prev =>
      prev.map(s => {
        if (s.student_id === studentId) {
          const isAbsent = false;
          const calc = calculateGrade(numVal, selectedExam.total_marks, isAbsent, selectedExam.passing_marks);
          return {
            ...s,
            marks_obtained: numVal,
            is_absent: isAbsent,
            percentage: calc.percentage,
            grade: calc.grade,
            is_passed: calc.isPassed
          };
        }
        return s;
      })
    );
  };

  const handleAbsentToggle = (studentId) => {
    if (!selectedExam) return;
    setStudentsMarks(prev =>
      prev.map(s => {
        if (s.student_id === studentId) {
          const newAbsent = !s.is_absent;
          const marks = newAbsent ? 0 : s.marks_obtained;
          const calc = calculateGrade(marks, selectedExam.total_marks, newAbsent, selectedExam.passing_marks);
          return {
            ...s,
            is_absent: newAbsent,
            marks_obtained: marks,
            percentage: calc.percentage,
            grade: calc.grade,
            is_passed: calc.isPassed
          };
        }
        return s;
      })
    );
  };

  const handleRemarksChange = (studentId, value) => {
    setStudentsMarks(prev =>
      prev.map(s => s.student_id === studentId ? { ...s, remarks: value } : s)
    );
  };

  const handleBulkSave = async () => {
    if (!selectedExam) return;
    setErrorMessage('');
    setSaveSuccess(false);

    // Validate all marks
    for (const sm of studentsMarks) {
      if (!sm.is_absent && (sm.marks_obtained < 0 || sm.marks_obtained > selectedExam.total_marks)) {
        setErrorMessage(
          `Invalid marks for ${sm.student_name}. Score must be between 0 and total marks (${selectedExam.total_marks})`
        );
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        marks: studentsMarks.map(sm => ({
          student_id: sm.student_id,
          marks_obtained: sm.is_absent ? 0.0 : parseFloat(sm.marks_obtained || 0),
          is_absent: sm.is_absent,
          remarks: sm.remarks
        }))
      };

      await API.post(`/api/exams/${selectedExam.id}/marks`, payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      loadExamDetailsAndMarks(selectedExam.id);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  // Quick statistics
  const totalCount = studentsMarks.length;
  const absentCount = studentsMarks.filter(s => s.is_absent).length;
  const appearedCount = totalCount - absentCount;
  const passCount = studentsMarks.filter(s => !s.is_absent && s.is_passed).length;
  const failCount = appearedCount - passCount;
  const totalMarksSum = studentsMarks.reduce((acc, curr) => acc + (curr.is_absent ? 0 : curr.marks_obtained), 0);
  const averageScore = appearedCount > 0 ? (totalMarksSum / appearedCount).toFixed(1) : 0;
  const passRate = appearedCount > 0 ? ((passCount / appearedCount) * 100).toFixed(1) : 0;

  const filteredStudents = studentsMarks.filter(s =>
    s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admission_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/exams')}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Examinations
          </button>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileCheck2 className="w-8 h-8 text-indigo-400" /> Marks Entry & Grading
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Grade student scores with real-time range validation, automated percentage, and grade point calculation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/results?exam_id=${selectedExamId}`)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700 transition-all flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" /> View Result Sheet
          </button>
          <button
            onClick={handleBulkSave}
            disabled={saving || !selectedExam || studentsMarks.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving Marks...' : 'Save All Marks'}
          </button>
        </div>
      </div>

      {/* Exam Selector & Context Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" /> Select Examination Assessment
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Choose Exam --</option>
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} — {ex.subject_name} ({ex.class_name})
                </option>
              ))}
            </select>
          </div>

          {selectedExam && (
            <div className="md:col-span-2 flex flex-wrap items-center gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
                Subject: <strong className="text-white ml-1">{selectedExam.subject_name}</strong> ({selectedExam.subject_code})
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
                Class: <strong className="text-white ml-1">{selectedExam.class_name} {selectedExam.section_name ? `(${selectedExam.section_name})` : ''}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                Total Marks: <strong className="text-white ml-1">{selectedExam.total_marks}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                Passing Marks: <strong className="text-white ml-1">{selectedExam.passing_marks}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> {selectedExam.exam_date}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          Examination marks saved successfully! Student report cards and grades have been updated.
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Analytics KPI Row */}
      {selectedExam && studentsMarks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Total Enrolled</span>
            <div className="text-xl font-bold text-white mt-0.5">{totalCount}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] font-semibold uppercase text-indigo-400">Appeared</span>
            <div className="text-xl font-bold text-indigo-400 mt-0.5">{appearedCount}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] font-semibold uppercase text-emerald-400">Passed</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{passCount}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] font-semibold uppercase text-rose-400">Failed</span>
            <div className="text-xl font-bold text-rose-400 mt-0.5">{failCount}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] font-semibold uppercase text-amber-400">Class Average</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{averageScore} / {selectedExam.total_marks}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
            <span className="text-[11px] font-semibold uppercase text-teal-400">Pass Rate</span>
            <div className="text-xl font-bold text-teal-400 mt-0.5">{passRate}%</div>
          </div>
        </div>
      )}

      {/* Roster Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !selectedExam ? (
        <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">Select an examination to enter marks</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            Choose an exam from the selector above to load enrolled students and record marks.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search student by name, roll no, or admission no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-400">
              Grading scale: <span className="text-emerald-400 font-medium">A+ (90+)</span>, <span className="text-teal-400 font-medium">A (80+)</span>, <span className="text-blue-400 font-medium">B (70+)</span>, <span className="text-amber-400 font-medium">C (60+)</span>, <span className="text-orange-400 font-medium">D (50+)</span>, <span className="text-rose-400 font-medium">F (&lt;50 / &lt;Passing)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase">
                  <th className="py-3.5 px-4 w-16">Roll No</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4 w-32 text-center">Attendance</th>
                  <th className="py-3.5 px-4 w-44">Marks Obtained</th>
                  <th className="py-3.5 px-4 w-28 text-center">Percentage</th>
                  <th className="py-3.5 px-4 w-24 text-center">Grade</th>
                  <th className="py-3.5 px-4 w-28 text-center">Status</th>
                  <th className="py-3.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStudents.map((sm, index) => {
                  const isInvalid = !sm.is_absent && (sm.marks_obtained < 0 || sm.marks_obtained > selectedExam.total_marks);

                  return (
                    <tr key={sm.student_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {sm.roll_number || index + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{sm.student_name}</div>
                        <div className="text-xs text-slate-500 font-mono">{sm.admission_number}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={sm.is_absent}
                            onChange={() => handleAbsentToggle(sm.student_id)}
                            className="w-4 h-4 rounded text-rose-600 bg-slate-950 border-slate-700 focus:ring-rose-500"
                          />
                          <span className={`text-xs font-medium ${sm.is_absent ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                            {sm.is_absent ? 'Absent' : 'Present'}
                          </span>
                        </label>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={selectedExam.total_marks}
                            disabled={sm.is_absent}
                            value={sm.is_absent ? 0 : sm.marks_obtained}
                            onChange={(e) => handleMarkChange(sm.student_id, e.target.value)}
                            className={`w-full px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                              sm.is_absent
                                ? 'bg-slate-900/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                                : isInvalid
                                ? 'bg-rose-500/10 border border-rose-500 text-rose-300 focus:ring-rose-500'
                                : 'bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500'
                            }`}
                          />
                          <span className="absolute right-3 top-2 text-xs text-slate-500 pointer-events-none">
                            / {selectedExam.total_marks}
                          </span>
                        </div>
                        {isInvalid && (
                          <div className="text-[11px] text-rose-400 mt-1">
                            Max marks is {selectedExam.total_marks}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                        {sm.is_absent ? '0%' : `${sm.percentage}%`}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${GRADE_STYLES[sm.grade] || 'bg-slate-800 text-slate-400'}`}>
                          {sm.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {sm.is_absent ? (
                          <span className="text-xs text-slate-500 font-semibold">ABSENT</span>
                        ) : sm.is_passed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400">
                            <XCircle className="w-3.5 h-3.5" /> FAIL
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          placeholder="Optional feedback..."
                          value={sm.remarks}
                          onChange={(e) => handleRemarksChange(sm.student_id, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Showing {filteredStudents.length} of {totalCount} students
            </div>
            <button
              onClick={handleBulkSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Marks'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarksEntry;
