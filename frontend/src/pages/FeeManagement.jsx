import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  DollarSign,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Building2,
  TrendingUp,
  Download,
  Users,
  School,
  X,
  Edit2,
  Trash2,
  ChevronRight,
  Layers,
  ArrowRight
} from 'lucide-react';

const FEE_TYPES = [
  'Admission Fee',
  'Tuition Fee',
  'Exam Fee',
  'Transport Fee',
  'Library Fee',
  'Other Fee'
];

const STATUS_BADGE = {
  Paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Partial: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Pending: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Overdue: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
};

const FeeManagement = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';
  const roleName = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isAccountantOrAdmin = ['Super Admin', 'School Admin', 'Principal', 'Accountant'].includes(roleName);

  // Active Tab
  const [activeTab, setActiveTab] = useState(initialTab); // 'dashboard', 'invoices', 'structures', 'payments', 'reports'

  // Metadata
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Invoices State
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('');
  const [invoiceClassFilter, setInvoiceClassFilter] = useState('');

  // Single Invoice Modal
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [singleForm, setSingleForm] = useState({
    student_id: '',
    academic_year_id: '',
    fee_month: 'March 2026',
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discount_amount: 0,
    fine_amount: 0,
    remarks: '',
    items: [{ fee_type: 'Tuition Fee', description: 'Tuition Fee', amount: 5000 }]
  });

  // Bulk Invoice Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    class_id: '',
    academic_year_id: '',
    fee_month: 'March 2026',
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discount_amount: 0,
    fine_amount: 0,
    remarks: ''
  });

  // Payment Recording Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    invoice_id: null,
    amount_paid: 0,
    discount_applied: 0,
    fine_applied: 0,
    payment_method: 'Cash',
    transaction_reference: '',
    remarks: ''
  });

  // Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Fee Structures State
  const [structures, setStructures] = useState([]);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [structureForm, setStructureForm] = useState({
    academic_year_id: '',
    class_id: '',
    fee_type: 'Tuition Fee',
    amount: 10000,
    frequency: 'Monthly',
    description: ''
  });

  // Payments History State
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Reports State
  const [reportType, setReportType] = useState('class'); // 'class', 'student', 'pending', 'overdue'
  const [classReports, setClassReports] = useState([]);
  const [studentFeeReport, setStudentFeeReport] = useState(null);
  const [selectedReportStudentId, setSelectedReportStudentId] = useState('');

  // Generic status & feedback
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'invoices') fetchInvoices();
    if (activeTab === 'structures') fetchStructures();
    if (activeTab === 'payments') fetchPayments();
    if (activeTab === 'reports') fetchReports();
  }, [activeTab]);

  const fetchMetadata = async () => {
    try {
      const [ayRes, clsRes, stuRes] = await Promise.all([
        API.get('/api/academic-years'),
        API.get('/api/classes'),
        API.get('/api/students')
      ]);
      setAcademicYears(ayRes.data);
      setClasses(clsRes.data);
      setStudents(stuRes.data);

      const activeYear = ayRes.data.find(y => y.is_active) || ayRes.data[0];
      if (activeYear) {
        setSingleForm(prev => ({ ...prev, academic_year_id: activeYear.id }));
        setBulkForm(prev => ({ ...prev, academic_year_id: activeYear.id, class_id: clsRes.data[0]?.id || '' }));
        setStructureForm(prev => ({ ...prev, academic_year_id: activeYear.id, class_id: clsRes.data[0]?.id || '' }));
      }
      if (stuRes.data.length > 0) {
        setSingleForm(prev => ({ ...prev, student_id: stuRes.data[0].id }));
        setSelectedReportStudentId(String(stuRes.data[0].id));
      }
    } catch (err) {
      console.error('Error fetching fee metadata:', err);
    }
  };

  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const res = await API.get('/api/fees/dashboard');
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error loading fee dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const res = await API.get('/api/fees/invoices');
      setInvoices(res.data);
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchStructures = async () => {
    setLoadingStructures(true);
    try {
      const res = await API.get('/api/fees/structures');
      setStructures(res.data);
    } catch (err) {
      console.error('Error loading fee structures:', err);
    } finally {
      setLoadingStructures(false);
    }
  };

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await API.get('/api/fees/payments');
      setPayments(res.data);
    } catch (err) {
      console.error('Error loading fee payments:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchReports = async () => {
    try {
      const clsRes = await API.get('/api/fees/reports/class-wise');
      setClassReports(clsRes.data);

      if (selectedReportStudentId) {
        const stuRes = await API.get(`/api/fees/reports/student/${selectedReportStudentId}`);
        setStudentFeeReport(stuRes.data);
      }
    } catch (err) {
      console.error('Error loading fee reports:', err);
    }
  };

  // Create Single Invoice
  const handleCreateSingleInvoice = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await API.post('/api/fees/invoices', {
        student_id: Number(singleForm.student_id),
        academic_year_id: Number(singleForm.academic_year_id),
        fee_month: singleForm.fee_month,
        due_date: singleForm.due_date,
        discount_amount: parseFloat(singleForm.discount_amount || 0),
        fine_amount: parseFloat(singleForm.fine_amount || 0),
        remarks: singleForm.remarks,
        items: singleForm.items.map(it => ({
          fee_type: it.fee_type,
          description: it.description,
          amount: parseFloat(it.amount || 0)
        }))
      });
      setShowSingleModal(false);
      setActionSuccess('Fee invoice generated successfully!');
      setTimeout(() => setActionSuccess(''), 4000);
      fetchInvoices();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to create fee invoice');
    }
  };

  // Add Item to Single Invoice
  const handleAddItemRow = () => {
    setSingleForm(prev => ({
      ...prev,
      items: [...prev.items, { fee_type: 'Tuition Fee', description: 'Tuition Fee', amount: 0 }]
    }));
  };

  const handleRemoveItemRow = (idx) => {
    setSingleForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  // Bulk Generate Invoices
  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      const res = await API.post('/api/fees/invoices/bulk-generate', {
        class_id: Number(bulkForm.class_id),
        academic_year_id: Number(bulkForm.academic_year_id),
        fee_month: bulkForm.fee_month,
        due_date: bulkForm.due_date,
        discount_amount: parseFloat(bulkForm.discount_amount || 0),
        fine_amount: parseFloat(bulkForm.fine_amount || 0),
        remarks: bulkForm.remarks
      });
      setShowBulkModal(false);
      setActionSuccess(`Successfully generated ${res.data.length} invoices for the class!`);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchInvoices();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to bulk generate invoices');
    }
  };

  // Open Payment Modal
  const handleOpenPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      invoice_id: invoice.id,
      amount_paid: invoice.remaining_amount,
      discount_applied: 0,
      fine_applied: 0,
      payment_method: 'Cash',
      transaction_reference: '',
      remarks: 'Full / partial fee clearance'
    });
    setShowPaymentModal(true);
  };

  // Record Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      const res = await API.post('/api/fees/payments', {
        invoice_id: paymentForm.invoice_id,
        amount_paid: parseFloat(paymentForm.amount_paid),
        discount_applied: parseFloat(paymentForm.discount_applied || 0),
        fine_applied: parseFloat(paymentForm.fine_applied || 0),
        payment_method: paymentForm.payment_method,
        transaction_reference: paymentForm.transaction_reference,
        remarks: paymentForm.remarks
      });
      setShowPaymentModal(false);
      setActiveReceipt(res.data);
      setShowReceiptModal(true);
      fetchInvoices();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to record payment');
    }
  };

  // Save Structure
  const handleSaveStructure = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await API.post('/api/fees/structures', {
        academic_year_id: Number(structureForm.academic_year_id),
        class_id: Number(structureForm.class_id),
        fee_type: structureForm.fee_type,
        amount: parseFloat(structureForm.amount),
        frequency: structureForm.frequency,
        description: structureForm.description
      });
      setShowStructureModal(false);
      fetchStructures();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to save fee structure');
    }
  };

  const handleDeleteStructure = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fee structure?')) return;
    try {
      await API.delete(`/api/fees/structures/${id}`);
      fetchStructures();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete fee structure');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.student_name?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.admission_number?.toLowerCase().includes(invoiceSearch.toLowerCase());
    const matchesStatus = !invoiceStatusFilter || inv.status === invoiceStatusFilter;
    const matchesClass = !invoiceClassFilter || inv.class_name === invoiceClassFilter;
    return matchesSearch && matchesStatus && matchesClass;
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="print:hidden relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900/50 via-slate-900/60 to-teal-900/50 border border-slate-800 p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <Receipt className="w-3.5 h-3.5" /> Finance & Accounts
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Fee Management Suite</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Automated invoice billing, class-wide bulk fee generation, partial & full payment receipts, discounts, fines, and ledger analytics.
            </p>
          </div>
          {isAccountantOrAdmin && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowBulkModal(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700 transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-indigo-400" /> Class Bulk Invoices
              </button>
              <button
                onClick={() => setShowSingleModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" /> Create Invoice
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="print:hidden flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'dashboard'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Fee Dashboard
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" /> Invoices & Billing
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Payment History
        </button>
        {isAccountantOrAdmin && (
          <button
            onClick={() => setActiveTab('structures')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'structures'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> Fee Structures
          </button>
        )}
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Financial Reports
        </button>
      </div>

      {/* Global Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {actionError}
        </div>
      )}

      {/* TAB 1: FEE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {loadingDashboard ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !dashboardData ? (
            <div className="text-center py-12 text-slate-400">No dashboard metrics available.</div>
          ) : (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                  <span className="text-xs uppercase font-semibold text-slate-400 block mb-1">Total Invoiced</span>
                  <div className="text-2xl font-black text-white">
                    ${dashboardData.total_invoiced_amount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{dashboardData.total_invoices_count} Invoices Issued</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                  <span className="text-xs uppercase font-semibold text-emerald-400 block mb-1">Collected Revenue</span>
                  <div className="text-2xl font-black text-emerald-400">
                    ${dashboardData.total_collected_amount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-500/80 mt-1">{dashboardData.paid_invoices_count} Paid in Full</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                  <span className="text-xs uppercase font-semibold text-blue-400 block mb-1">Pending Balance</span>
                  <div className="text-2xl font-black text-blue-400">
                    ${dashboardData.total_pending_amount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-blue-500/80 mt-1">{dashboardData.pending_invoices_count} Pending Invoices</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                  <span className="text-xs uppercase font-semibold text-rose-400 block mb-1">Overdue Amount</span>
                  <div className="text-2xl font-black text-rose-400">
                    ${dashboardData.total_overdue_amount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-rose-500/80 mt-1">{dashboardData.overdue_invoices_count} Overdue Invoices</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                  <span className="text-xs uppercase font-semibold text-amber-400 block mb-1">Today's Collection</span>
                  <div className="text-2xl font-black text-amber-400">
                    ${dashboardData.today_collected_amount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-amber-500/80 mt-1">Live Daily Intake</div>
                </div>
              </div>

              {/* Monthly Trend & Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" /> Monthly Fee Collection Trend
                  </h3>
                  {dashboardData.monthly_collection_trend.length === 0 ? (
                    <div className="text-sm text-slate-500 py-12 text-center">No payment history recorded yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData.monthly_collection_trend.map((m, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                            <span>{m.month}</span>
                            <span className="font-mono text-emerald-400">${m.amount.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                              style={{ width: `${Math.min(100, (m.amount / (dashboardData.total_collected_amount || 1)) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-400" /> Payment Methods
                  </h3>
                  <div className="space-y-3">
                    {dashboardData.payment_method_breakdown.map((pm, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">{pm.method}</div>
                          <div className="text-xs text-slate-400">{pm.count} Transactions</div>
                        </div>
                        <div className="text-sm font-mono font-bold text-emerald-400">
                          ${pm.total_amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: INVOICES LIST */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice number, student name, or admission no..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={invoiceStatusFilter}
                onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
              <select
                value={invoiceClassFilter}
                onChange={(e) => setInvoiceClassFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          {loadingInvoices ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
              <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white">No invoices found</h3>
              <p className="text-slate-400 text-sm mt-1">Generate fee invoices to bill students.</p>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Fee Month</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Remaining</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{inv.student_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{inv.admission_number}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {inv.class_name} {inv.section_name ? `(${inv.section_name})` : ''}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">{inv.fee_month}</td>
                      <td className="py-3.5 px-4 text-slate-400">{inv.due_date}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        ${inv.total_amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400">
                        ${inv.paid_amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400">
                        ${inv.remaining_amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold border ${STATUS_BADGE[inv.status] || ''}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAccountantOrAdmin && inv.status !== 'Paid' && (
                            <button
                              onClick={() => handleOpenPayment(inv)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px] transition-colors"
                            >
                              Pay Now
                            </button>
                          )}
                          {inv.payments.length > 0 && (
                            <button
                              onClick={() => {
                                const lastP = inv.payments[inv.payments.length - 1];
                                setActiveReceipt({
                                  ...lastP,
                                  invoice_number: inv.invoice_number,
                                  student_name: inv.student_name,
                                  admission_number: inv.admission_number,
                                  class_name: inv.class_name,
                                  fee_month: inv.fee_month,
                                  invoice_total_amount: inv.total_amount,
                                  invoice_paid_amount: inv.paid_amount,
                                  invoice_remaining_amount: inv.remaining_amount
                                });
                                setShowReceiptModal(true);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                              title="Print Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FEE STRUCTURES */}
      {activeTab === 'structures' && isAccountantOrAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Configured Fee Rates by Class</h3>
            <button
              onClick={() => setShowStructureModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Fee Structure
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {structures.map((fs) => (
              <div key={fs.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl relative group">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {fs.fee_type}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{fs.frequency}</span>
                </div>
                <h4 className="text-lg font-bold text-white">{fs.class_name}</h4>
                <div className="text-2xl font-black text-white mt-2">
                  ${fs.amount.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">{fs.description || 'Standard class fee rate'}</p>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleDeleteStructure(fs.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENT HISTORY */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {loadingPayments ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Receipt No</th>
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Discount</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{p.receipt_number}</td>
                      <td className="py-3 px-4 font-mono text-white">{p.invoice_number}</td>
                      <td className="py-3 px-4 font-semibold text-white">{p.student_name}</td>
                      <td className="py-3 px-4 text-slate-400">{p.payment_date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                        ${p.amount_paid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400">
                        ${p.discount_applied.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setActiveReceipt(p);
                            setShowReceiptModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700"
                        >
                          Print
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

      {/* TAB 5: FINANCIAL REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <button
              onClick={() => setReportType('class')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${reportType === 'class' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'}`}
            >
              Class-wise Collection
            </button>
            <button
              onClick={() => setReportType('student')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${reportType === 'student' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'}`}
            >
              Student Fee Ledger
            </button>
          </div>

          {reportType === 'class' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4 text-center">Enrolled Students</th>
                    <th className="py-3 px-4 text-right">Total Invoiced</th>
                    <th className="py-3 px-4 text-right">Total Collected</th>
                    <th className="py-3 px-4 text-right">Total Pending</th>
                    <th className="py-3 px-4 text-center">Recovery %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {classReports.map((c) => (
                    <tr key={c.class_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{c.class_name}</td>
                      <td className="py-3.5 px-4 text-center text-slate-400">{c.total_students}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-white">${c.total_invoiced.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">${c.total_collected.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400">${c.total_pending.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-400">{c.collection_percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'student' && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl max-w-md">
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Select Student</label>
                <select
                  value={selectedReportStudentId}
                  onChange={(e) => {
                    setSelectedReportStudentId(e.target.value);
                    fetchStudentReport(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name || `${s.first_name} ${s.last_name}`} ({s.admission_number})</option>
                  ))}
                </select>
              </div>

              {studentFeeReport && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-xs text-slate-400">Total Invoiced</span>
                      <div className="text-xl font-bold text-white mt-1">${studentFeeReport.total_invoiced.toLocaleString()}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-xs text-emerald-400">Total Paid</span>
                      <div className="text-xl font-bold text-emerald-400 mt-1">${studentFeeReport.total_paid.toLocaleString()}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-xs text-amber-400">Discounts Received</span>
                      <div className="text-xl font-bold text-amber-400 mt-1">${studentFeeReport.total_discount.toLocaleString()}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-xs text-rose-400">Net Outstanding</span>
                      <div className="text-xl font-bold text-rose-400 mt-1">${studentFeeReport.total_outstanding.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SINGLE INVOICE CREATE MODAL */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" /> Create Single Fee Invoice
              </h2>
              <button onClick={() => setShowSingleModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSingleInvoice} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Student</label>
                  <select
                    value={singleForm.student_id}
                    onChange={(e) => setSingleForm({ ...singleForm, student_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name || `${s.first_name} ${s.last_name}`} ({s.admission_number})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Fee Month</label>
                  <input
                    type="text"
                    value={singleForm.fee_month}
                    onChange={(e) => setSingleForm({ ...singleForm, fee_month: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={singleForm.due_date}
                    onChange={(e) => setSingleForm({ ...singleForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Discount ($)</label>
                  <input
                    type="number"
                    value={singleForm.discount_amount}
                    onChange={(e) => setSingleForm({ ...singleForm, discount_amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Late Fine ($)</label>
                  <input
                    type="number"
                    value={singleForm.fine_amount}
                    onChange={(e) => setSingleForm({ ...singleForm, fine_amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Invoice Items / Heads</label>
                  <button type="button" onClick={handleAddItemRow} className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Head
                  </button>
                </div>

                <div className="space-y-2">
                  {singleForm.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={it.fee_type}
                        onChange={(e) => {
                          const updated = [...singleForm.items];
                          updated[idx].fee_type = e.target.value;
                          setSingleForm({ ...singleForm, items: updated });
                        }}
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                      >
                        {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input
                        type="text"
                        placeholder="Description..."
                        value={it.description}
                        onChange={(e) => {
                          const updated = [...singleForm.items];
                          updated[idx].description = e.target.value;
                          setSingleForm({ ...singleForm, items: updated });
                        }}
                        className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={it.amount}
                        onChange={(e) => {
                          const updated = [...singleForm.items];
                          updated[idx].amount = e.target.value;
                          setSingleForm({ ...singleForm, items: updated });
                        }}
                        className="w-24 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                      />
                      {singleForm.items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItemRow(idx)} className="text-slate-500 hover:text-rose-400 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowSingleModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK CLASS INVOICE GENERATOR MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Bulk Class Invoice Generator
              </h3>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Target Class</label>
                <select
                  value={bulkForm.class_id}
                  onChange={(e) => setBulkForm({ ...bulkForm, class_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Fee Month</label>
                  <input
                    type="text"
                    value={bulkForm.fee_month}
                    onChange={(e) => setBulkForm({ ...bulkForm, fee_month: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={bulkForm.due_date}
                    onChange={(e) => setBulkForm({ ...bulkForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                This will automatically generate individual invoices for all enrolled students in this class based on their configured fee structures.
              </p>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowBulkModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold">Generate for All Students</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" /> Record Fee Payment
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
              <div>Invoice: <strong className="text-white font-mono">{selectedInvoice.invoice_number}</strong></div>
              <div>Student: <strong className="text-white">{selectedInvoice.student_name}</strong></div>
              <div>Remaining Due: <strong className="text-rose-400 font-mono text-sm">${selectedInvoice.remaining_amount.toLocaleString()}</strong></div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Amount Paid ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={selectedInvoice.remaining_amount}
                    required
                    value={paymentForm.amount_paid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Online">Online</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Discount ($)</label>
                  <input
                    type="number"
                    value={paymentForm.discount_applied}
                    onChange={(e) => setPaymentForm({ ...paymentForm, discount_applied: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Fine ($)</label>
                  <input
                    type="number"
                    value={paymentForm.fine_applied}
                    onChange={(e) => setPaymentForm({ ...paymentForm, fine_applied: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Txn Reference / Notes</label>
                <input
                  type="text"
                  placeholder="Optional bank transaction ID..."
                  value={paymentForm.transaction_reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold">Record & Issue Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE FEE RECEIPT MODAL */}
      {showReceiptModal && activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl p-8 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
            <div className="print:hidden flex justify-end gap-3 mb-4">
              <button onClick={handlePrintReceipt} className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
              <button onClick={() => setShowReceiptModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Receipt Template */}
            <div className="border border-slate-700 print:border-black rounded-xl p-6 bg-slate-950/80 print:bg-white text-xs">
              <div className="text-center border-b border-slate-700 print:border-black pb-4 mb-4">
                <h2 className="text-lg font-bold text-white print:text-black uppercase">School Management System</h2>
                <p className="text-[11px] text-slate-400 print:text-slate-600">Official Student Fee Payment Receipt</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>Receipt No: <strong className="text-white print:text-black font-mono">{activeReceipt.receipt_number}</strong></div>
                <div className="text-right">Date: <strong className="text-white print:text-black">{activeReceipt.payment_date}</strong></div>
                <div>Invoice No: <strong className="text-white print:text-black font-mono">{activeReceipt.invoice_number}</strong></div>
                <div className="text-right">Student: <strong className="text-white print:text-black">{activeReceipt.student_name}</strong></div>
              </div>

              <div className="p-4 bg-slate-900 print:bg-slate-100 rounded-lg border border-slate-800 print:border-slate-300 space-y-2 mb-4">
                <div className="flex justify-between font-bold text-sm">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-400 print:text-black font-mono">${activeReceipt.amount_paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400 print:text-slate-600">
                  <span>Payment Method:</span>
                  <span>{activeReceipt.payment_method}</span>
                </div>
                {activeReceipt.transaction_reference && (
                  <div className="flex justify-between text-slate-400 print:text-slate-600">
                    <span>Reference No:</span>
                    <span className="font-mono">{activeReceipt.transaction_reference}</span>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-dashed border-slate-700 print:border-black flex justify-between text-slate-400 print:text-slate-600 text-[11px]">
                <div>Student Copy</div>
                <div>Authorized Cashier Signature: __________________</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEE STRUCTURE MODAL */}
      {showStructureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Add Fee Rate Structure</h3>
              <button onClick={() => setShowStructureModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStructure} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Class</label>
                <select
                  value={structureForm.class_id}
                  onChange={(e) => setStructureForm({ ...structureForm, class_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Fee Type</label>
                  <select
                    value={structureForm.fee_type}
                    onChange={(e) => setStructureForm({ ...structureForm, fee_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={structureForm.amount}
                    onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Billing Frequency</label>
                <select
                  value={structureForm.frequency}
                  onChange={(e) => setStructureForm({ ...structureForm, frequency: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Termly">Termly</option>
                  <option value="Annually">Annually</option>
                  <option value="One-Time">One-Time</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowStructureModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold">Save Structure</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManagement;
