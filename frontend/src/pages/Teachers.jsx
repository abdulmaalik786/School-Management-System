import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Briefcase,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Teachers = () => {
  const { user } = useAuth();
  const userRoleName = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  const isManagement = ['Super Admin', 'School Admin', 'Principal', 'Admin'].includes(userRoleName) || !user;

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [viewTeacher, setViewTeacher] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: 'password123',
    phone: '',
    employee_id: '',
    gender: 'Female',
    date_of_birth: '',
    address: '',
    qualification: '',
    designation: '',
    department: 'Mathematics',
    joining_date: '',
    salary: 65000
  });

  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      let url = `/api/teachers?search=${encodeURIComponent(search)}`;
      if (departmentFilter) url += `&department=${encodeURIComponent(departmentFilter)}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await API.get(url);
      setTeachers(res.data);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
      const localTeachers = JSON.parse(localStorage.getItem('demo_teachers') || '[]');
      if (localTeachers.length === 0) {
        const initialDemo = [
          { id: 1, full_name: 'Dr. Sarah Ahmed', employee_id: 'TCH-2026-101', department: 'Science', designation: 'Head of Dept', email: 'sarah@school.com', phone: '+92 300 1112223', status: 'Active', salary: 85000 },
          { id: 2, full_name: 'Prof. Usman Ali', employee_id: 'TCH-2026-102', department: 'Mathematics', designation: 'Senior Teacher', email: 'usman@school.com', phone: '+92 300 4445556', status: 'Active', salary: 75000 }
        ];
        localStorage.setItem('demo_teachers', JSON.stringify(initialDemo));
        setTeachers(initialDemo);
      } else {
        setTeachers(localTeachers);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [search, departmentFilter, statusFilter]);

  const handleOpenAdd = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormData({
      first_name: '',
      last_name: '',
      email: `teacher_${randomNum}@school.com`,
      username: `teacher_${randomNum}`,
      password: 'password123',
      phone: '+92 300 0000000',
      employee_id: `TCH-2026-${randomNum}`,
      gender: 'Female',
      date_of_birth: '1988-06-15',
      address: 'Educator Staff Colony',
      qualification: 'M.Sc. Education & Mathematics',
      designation: 'Senior Teacher',
      department: 'Mathematics',
      joining_date: new Date().toISOString().split('T')[0],
      salary: 68000
    });
    setEditTeacher(null);
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditTeacher(t);
    const names = (t.full_name || '').split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';

    setFormData({
      first_name: firstName,
      last_name: lastName,
      email: t.email || `${firstName}@school.com`,
      username: t.username || firstName,
      phone: t.phone || '',
      employee_id: t.employee_id,
      gender: t.gender || 'Female',
      date_of_birth: t.date_of_birth || '',
      address: t.address || '',
      qualification: t.qualification || '',
      designation: t.designation || '',
      department: t.department || 'Mathematics',
      joining_date: t.joining_date || '',
      salary: t.salary || 65000
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    const payload = {
      ...formData,
      salary: formData.salary ? parseFloat(formData.salary) : 0
    };

    try {
      if (editTeacher) {
        await API.put(`/api/teachers/${editTeacher.id}`, payload);
        setSuccessMsg('Teacher profile updated successfully!');
      } else {
        await API.post('/api/teachers', payload);
        setSuccessMsg('Teacher added successfully!');
      }

      setShowAddModal(false);
      fetchTeachers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.warn('Backend unavailable, saving teacher locally:', err);
      const existing = JSON.parse(localStorage.getItem('demo_teachers') || '[]');

      if (editTeacher) {
        const updated = existing.map(t => t.id === editTeacher.id ? {
          ...t,
          full_name: `${formData.first_name} ${formData.last_name}`,
          employee_id: formData.employee_id,
          department: formData.department,
          designation: formData.designation,
          email: formData.email,
          phone: formData.phone,
          salary: formData.salary
        } : t);
        localStorage.setItem('demo_teachers', JSON.stringify(updated));
        setTeachers(updated);
        setSuccessMsg('Teacher profile updated (Local Mode)!');
      } else {
        const newTeacher = {
          id: Date.now(),
          full_name: `${formData.first_name} ${formData.last_name}`,
          employee_id: formData.employee_id,
          department: formData.department,
          designation: formData.designation,
          email: formData.email,
          phone: formData.phone,
          status: 'Active',
          salary: formData.salary
        };
        const updated = [newTeacher, ...existing];
        localStorage.setItem('demo_teachers', JSON.stringify(updated));
        setTeachers(updated);
        setSuccessMsg('Teacher added successfully (Local Mode)!');
      }

      setShowAddModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this teacher profile?')) {
      try {
        await API.delete(`/api/teachers/${id}`);
        setSuccessMsg('Teacher profile deactivated.');
        fetchTeachers();
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to deactivate teacher');
      }
    }
  };

  const totalPages = Math.ceil(teachers.length / itemsPerPage) || 1;
  const paginatedTeachers = teachers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <GraduationCap size={16} />
            <span>Faculty Management</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100">Teacher Roster</h1>
          <p className="text-xs text-slate-400 mt-1">
            Teaching staff, qualifications, department assignments, and status
          </p>
        </div>

        {isManagement && (
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition shrink-0"
          >
            <Plus size={16} />
            <span>Add New Teacher</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FILTER & SEARCH */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search teacher name, employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl glass-input text-slate-200 focus:outline-none bg-slate-900"
          >
            <option value="">All Departments</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="Computer Science">Computer Science</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl glass-input text-slate-200 focus:outline-none bg-slate-900"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Faculty Member</th>
                <th className="px-6 py-4">Employee ID</th>
                <th className="px-6 py-4">Department & Role</th>
                <th className="px-6 py-4">Qualification</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading teacher roster...
                  </td>
                </tr>
              ) : paginatedTeachers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    No teacher records found.
                  </td>
                </tr>
              ) : (
                paginatedTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-medium text-slate-100 flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                        {t.full_name ? t.full_name.charAt(0) : 'T'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-100">{t.full_name}</p>
                        <p className="text-[10px] text-slate-400">{t.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-emerald-300">{t.employee_id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-200">{t.department || 'General'}</p>
                      <p className="text-[10px] text-slate-400">{t.designation || 'Educator'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">{t.qualification || 'B.Ed.'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        t.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setViewTeacher(t)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="View Profile"
                      >
                        <Eye size={15} />
                      </button>
                      {isManagement && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition"
                            title="Edit Profile"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeactivate(t.id)}
                            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition"
                            title="Deactivate"
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

        {/* PAGINATION */}
        <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing page {page} of {totalPages} ({teachers.length} total teachers)</span>
          <div className="flex items-center space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-100 mb-1">
              {editTeacher ? 'Edit Teacher Profile' : 'Add New Teacher'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">Enter educator qualification, department, and salary</p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Annual Salary ($)</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none bg-slate-900"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editTeacher ? 'Update Teacher' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PROFILE MODAL */}
      {viewTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-3xl p-6 border border-slate-800 relative">
            <button
              onClick={() => setViewTeacher(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
            >
              <X size={20} />
            </button>

            <div className="text-center pb-4 border-b border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-2xl mx-auto mb-3">
                {viewTeacher.full_name.charAt(0)}
              </div>
              <h3 className="text-lg font-bold text-slate-100">{viewTeacher.full_name}</h3>
              <p className="text-xs text-emerald-400 font-mono">Employee ID: {viewTeacher.employee_id}</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Department:</span>
                <span className="font-semibold text-slate-200">{viewTeacher.department || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Designation:</span>
                <span className="font-semibold text-slate-200">{viewTeacher.designation || 'Educator'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Qualification:</span>
                <span className="font-semibold text-slate-200">{viewTeacher.qualification || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Joining Date:</span>
                <span className="font-semibold text-slate-200">{viewTeacher.joining_date || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Salary:</span>
                <span className="font-semibold text-emerald-400">${viewTeacher.salary ? viewTeacher.salary.toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewTeacher(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
