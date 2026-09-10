import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Download,
  Printer,
  Search,
  Filter,
  Users,
  GraduationCap,
  ClipboardCheck,
  Receipt,
  Award,
  BookOpen,
  Bus,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();

  const [activeReport, setActiveReport] = useState('enrollment'); // 'enrollment', 'attendance', 'fees', 'exams', 'library', 'transport'
  const [loading, setLoading] = useState(true);

  // Raw data collections
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [books, setBooks] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [allocations, setAllocations] = useState([]);

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  useEffect(() => {
    fetchAllReportData();
  }, []);

  const fetchAllReportData = async () => {
    setLoading(true);
    try {
      const [sRes, tRes, cRes, eRes, iRes, pRes, bRes, rRes, aRes] = await Promise.all([
        API.get('/api/students'),
        API.get('/api/teachers'),
        API.get('/api/classes'),
        API.get('/api/exams'),
        API.get('/api/finance/invoices'),
        API.get('/api/finance/payments'),
        API.get('/api/library/books'),
        API.get('/api/transport/routes'),
        API.get('/api/transport/allocations')
      ]);

      setStudents(sRes.data);
      setTeachers(tRes.data);
      setClasses(cRes.data);
      setExams(eRes.data);
      setInvoices(iRes.data);
      setPayments(pRes.data);
      setBooks(bRes.data);
      setRoutes(rRes.data);
      setAllocations(aRes.data);
    } catch (e) {
      console.error('Error fetching reports data:', e);
    } finally {
      setLoading(false);
    }
  };

  // CSV Export Utility
  const exportToCSV = (filename, headers, rows) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(item => `"${String(item || '').replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCurrentReport = () => {
    if (activeReport === 'enrollment') {
      const headers = ['Admission No', 'Student Name', 'Class', 'Section', 'Gender', 'Guardian', 'Phone'];
      const rows = students.map(s => [
        s.admission_number,
        s.full_name || `${s.first_name} ${s.last_name}`,
        s.school_class?.name || '',
        s.section?.name || '',
        s.gender,
        s.parent?.full_name || '',
        s.parent?.emergency_contact || ''
      ]);
      exportToCSV('student_enrollment_report', headers, rows);
    } else if (activeReport === 'fees') {
      const headers = ['Invoice No', 'Student', 'Class', 'Total Amount', 'Paid Amount', 'Remaining', 'Due Date', 'Status'];
      const rows = invoices.map(i => [
        i.invoice_number,
        i.student_name,
        i.class_name,
        i.total_amount,
        i.paid_amount,
        i.remaining_amount,
        i.due_date,
        i.status
      ]);
      exportToCSV('fee_collection_report', headers, rows);
    } else if (activeReport === 'exams') {
      const headers = ['Exam Title', 'Type', 'Class', 'Subject', 'Date', 'Total Marks', 'Passing Marks'];
      const rows = exams.map(e => [
        e.name,
        e.exam_type,
        e.class_name,
        e.subject_name,
        e.exam_date,
        e.total_marks,
        e.passing_marks
      ]);
      exportToCSV('exam_schedule_report', headers, rows);
    } else if (activeReport === 'library') {
      const headers = ['Title', 'Author', 'ISBN', 'Category', 'Total Copies', 'Available Copies', 'Issued Copies'];
      const rows = books.map(b => [
        b.title,
        b.author,
        b.isbn,
        b.category,
        b.total_copies,
        b.available_copies,
        b.total_copies - b.available_copies
      ]);
      exportToCSV('library_inventory_report', headers, rows);
    } else if (activeReport === 'transport') {
      const headers = ['Student Name', 'Admission No', 'Route Name', 'Vehicle', 'Driver', 'Driver Phone'];
      const rows = allocations.map(a => [
        a.student_name,
        a.admission_number,
        a.route_name,
        a.vehicle_number,
        a.driver_name,
        a.driver_phone
      ]);
      exportToCSV('transport_allocation_report', headers, rows);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-900/50 via-slate-900/60 to-purple-900/50 border border-slate-800 p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-3">
              <TrendingUp className="w-3.5 h-3.5" /> Institutional Analytics & Audit
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Centralized Reports Hub</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Comprehensive institutional reports for Census, Faculty, Attendance, Fees, Exams, Library, and Transport with CSV Export and Printable sheets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCurrentReport}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" /> Export CSV
            </button>
            <button
              onClick={handlePrintReport}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-rose-600/20"
            >
              <Printer className="w-4 h-4" /> Print Sheet
            </button>
          </div>
        </div>
      </div>

      {/* Report Selector Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <button
          onClick={() => setActiveReport('enrollment')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeReport === 'enrollment'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Student Census ({students.length})
        </button>
        <button
          onClick={() => setActiveReport('fees')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeReport === 'fees'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" /> Financial & Fees ({invoices.length})
        </button>
        <button
          onClick={() => setActiveReport('exams')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeReport === 'exams'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Exams Schedule ({exams.length})
        </button>
        <button
          onClick={() => setActiveReport('library')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeReport === 'library'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Library Inventory ({books.length})
        </button>
        <button
          onClick={() => setActiveReport('transport')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeReport === 'transport'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Bus className="w-3.5 h-3.5" /> Transport Allocations ({allocations.length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Filter current report data..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-rose-500"
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {/* REPORT CONTENT AREA */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl print:border-none print:bg-white print:text-black">
        {/* Printable Header */}
        <div className="hidden print:block p-6 border-b text-center">
          <h2 className="text-2xl font-black uppercase">School Management System</h2>
          <p className="text-xs text-gray-600">Institutional Report: {activeReport.toUpperCase()} • Generated on {new Date().toLocaleString()}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* 1. STUDENT CENSUS */}
            {activeReport === 'enrollment' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Guardian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {students
                    .filter(s =>
                      (s.full_name || `${s.first_name} ${s.last_name}`).toLowerCase().includes(search.toLowerCase()) &&
                      (!classFilter || s.school_class?.name === classFilter)
                    )
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-bold text-rose-400">{s.admission_number}</td>
                        <td className="py-3 px-4 font-semibold text-white">{s.full_name || `${s.first_name} ${s.last_name}`}</td>
                        <td className="py-3 px-4 text-slate-300">{s.school_class?.name || '-'}</td>
                        <td className="py-3 px-4 text-slate-400">{s.section?.name || '-'}</td>
                        <td className="py-3 px-4 text-slate-400">{s.gender}</td>
                        <td className="py-3 px-4 text-slate-300">{s.parent?.full_name || 'Guardian'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* 2. FEES & REVENUE */}
            {activeReport === 'fees' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Invoice</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4 text-right">Invoiced</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Remaining</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invoices
                    .filter(i =>
                      (i.student_name || '').toLowerCase().includes(search.toLowerCase()) &&
                      (!classFilter || i.class_name === classFilter)
                    )
                    .map((i) => (
                      <tr key={i.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">{i.invoice_number}</td>
                        <td className="py-3 px-4 font-semibold text-white">{i.student_name}</td>
                        <td className="py-3 px-4 text-slate-300">{i.class_name}</td>
                        <td className="py-3 px-4 text-right font-mono text-white">${i.total_amount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400">${i.paid_amount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">${i.remaining_amount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold ${i.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' : i.status === 'Overdue' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {i.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* 3. EXAMS */}
            {activeReport === 'exams' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Exam Title</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Exam Date</th>
                    <th className="py-3 px-4 text-center">Total Marks</th>
                    <th className="py-3 px-4 text-center">Passing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {exams
                    .filter(e =>
                      e.name.toLowerCase().includes(search.toLowerCase()) &&
                      (!classFilter || e.class_name === classFilter)
                    )
                    .map((e) => (
                      <tr key={e.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-white">{e.name}</td>
                        <td className="py-3 px-4 text-purple-300">{e.exam_type}</td>
                        <td className="py-3 px-4 text-slate-300">{e.class_name}</td>
                        <td className="py-3 px-4 font-semibold text-slate-200">{e.subject_name}</td>
                        <td className="py-3 px-4 text-slate-400">{e.exam_date}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">{e.total_marks}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{e.passing_marks}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* 4. LIBRARY */}
            {activeReport === 'library' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Total Copies</th>
                    <th className="py-3 px-4 text-center">Available</th>
                    <th className="py-3 px-4 text-center">Currently Issued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {books
                    .filter(b => b.title.toLowerCase().includes(search.toLowerCase()))
                    .map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-white">{b.title}</td>
                        <td className="py-3 px-4 text-slate-300">{b.author}</td>
                        <td className="py-3 px-4 text-cyan-300">{b.category}</td>
                        <td className="py-3 px-4 text-center font-mono text-white">{b.total_copies}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">{b.available_copies}</td>
                        <td className="py-3 px-4 text-center font-mono text-amber-400">{b.total_copies - b.available_copies}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* 5. TRANSPORT */}
            {activeReport === 'transport' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Route Name</th>
                    <th className="py-3 px-4">Bus</th>
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Driver Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allocations
                    .filter(a => (a.student_name || '').toLowerCase().includes(search.toLowerCase()))
                    .map((a) => (
                      <tr key={a.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-white">{a.student_name}</td>
                        <td className="py-3 px-4 font-mono text-emerald-400">{a.admission_number}</td>
                        <td className="py-3 px-4 font-semibold text-slate-200">{a.route_name}</td>
                        <td className="py-3 px-4 font-mono text-white">{a.vehicle_number || '-'}</td>
                        <td className="py-3 px-4 text-slate-300">{a.driver_name}</td>
                        <td className="py-3 px-4 text-emerald-400">{a.driver_phone}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
