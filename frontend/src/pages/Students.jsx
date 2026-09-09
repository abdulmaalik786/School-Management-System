import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  GraduationCap,
  Calendar,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Students = () => {
  const { user } = useAuth();
  const isManagement = ['Super Admin', 'School Admin', 'Principal'].includes(user?.role?.name);

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [parents, setParents] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: 'password123',
    phone: '',
    admission_number: '',
    roll_number: '',
    gender: 'Male',
    date_of_birth: '',
    blood_group: 'O+',
    address: '',
    emergency_contact: '',
    admission_date: '',
    class_id: '',
    section_id: '',
    parent_id: '',
    academic_year_id: ''
  });

  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = `/api/students?search=${encodeURIComponent(search)}`;
      if (classFilter) url += `&class_id=${classFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const res = await API.get(url);
      setStudents(res.data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [clsRes, parRes, ayRes] = await Promise.all([
        API.get('/api/classes'),
        API.get('/api/parents'),
        API.get('/api/academic-years')
      ]);
      setClasses(clsRes.data);
      setParents(parRes.data);
      setAcademicYears(ayRes.data);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, classFilter, statusFilter]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Update section dropdown when class_id changes
  useEffect(() => {
    if (formData.class_id) {
      const selClass = classes.find(c => c.id === parseInt(formData.class_id));
      setSections(selClass ? selClass.sections : []);
    } else {
      setSections([]);
    }
  }, [formData.class_id, classes]);

  const handleOpenAdd = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      first_name: '',
      last_name: '',
      email: `student_${randomNum}@school.com`,
      username: `student_${randomNum}`,
      password: 'password123',
      phone: '+1 555-0199',
      admission_number: `ADM-2026-${randomNum}`,
      roll_number: `${randomNum.toString().substring(0, 3)}`,
      gender: 'Male',
      date_of_birth: '2016-05-10',
      blood_group: 'O+',
      address: '123 Academic Lane',
      emergency_contact: '+1 555-0100',
      admission_date: new Date().toISOString().split('T')[0],
      class_id: classes.length > 0 ? classes[0].id : '',
      section_id: '',
      parent_id: parents.length > 0 ? parents[0].id : '',
      academic_year_id: academicYears.length > 0 ? academicYears[0].id : ''
    });
    setEditStudent(null);
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (student) => {
    setEditStudent(student);
    const names = (student.full_name || '').split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';

    setFormData({
      first_name: firstName,
      last_name: lastName,
      email: student.email,
      username: student.username,
      phone: student.phone || '',
      admission_number: student.admission_number,
      roll_number: student.roll_number || '',
      gender: student.gender || 'Male',
      date_of_birth: student.date_of_birth || '',
      blood_group: student.blood_group || 'O+',
      address: student.address || '',
      emergency_contact: student.emergency_contact || '',
      admission_date: student.admission_date || '',
      class_id: student.class_id || '',
      section_id: student.section_id || '',
      parent_id: student.parent_id || '',
      academic_year_id: student.academic_year_id || ''
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
        class_id: formData.class_id ? parseInt(formData.class_id) : null,
        section_id: formData.section_id ? parseInt(formData.section_id) : null,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
        academic_year_id: formData.academic_year_id ? parseInt(formData.academic_year_id) : null
      };

      if (editStudent) {
        await API.put(`/api/students/${editStudent.id}`, payload);
        setSuccessMsg('Student record updated successfully!');
      } else {
        await API.post('/api/students', payload);
        setSuccessMsg('Student enrolled successfully!');
      }

      setShowAddModal(false);
      fetchStudents();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save student record');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this student account?')) {
      try {
        await API.delete(`/api/students/${id}`);
        setSuccessMsg('Student deactivated.');
        fetchStudents();
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to deactivate student');
      }
    }
  };

  // Pagination Math
  const totalPages = Math.ceil(students.length / itemsPerPage) || 1;
  const paginatedStudents = students.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Users size={16} />
            <span>People Management</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100">Student Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enrolled students, academic sections, parent links, and status
          </p>
        </div>

        {isManagement && (
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition shrink-0"
          >
            <Plus size={16} />
            <span>Enroll New Student</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, roll #, admission #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl glass-input text-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Active" className="bg-slate-900">Active</option>
            <option value="Inactive" className="bg-slate-900">Inactive</option>
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Student Info</th>
                <th className="px-6 py-4">Admission #</th>
                <th className="px-6 py-4">Class & Section</th>
                <th className="px-6 py-4">Parent / Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading student directory...
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    No student records found.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-medium text-slate-100 flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                        {s.full_name ? s.full_name.charAt(0) : 'S'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-100">{s.full_name}</p>
                        <p className="text-[10px] text-slate-400">Roll #{s.roll_number || 'N/A'} • {s.gender}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-indigo-300">{s.admission_number}</td>
                    <td className="px-6 py-4">
                      {s.class_name ? (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px] font-semibold">
                          {s.class_name} {s.section_name ? `- ${s.section_name}` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-200 font-medium">{s.parent_name || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400">{s.emergency_contact || s.phone || 'No phone'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        s.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setViewStudent(s)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="View Profile"
                      >
                        <Eye size={15} />
                      </button>
                      {isManagement && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition"
                            title="Edit Student"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeactivate(s.id)}
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
          <span>Showing page {page} of {totalPages} ({students.length} total students)</span>
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
              {editStudent ? 'Edit Student Profile' : 'Enroll New Student'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">Fill in student identity and academic assignment fields</p>

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
                  <label className="block font-semibold text-slate-300 mb-1">Admission # *</label>
                  <input
                    type="text"
                    required
                    value={formData.admission_number}
                    onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={formData.roll_number}
                    onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none bg-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Class Assignment</label>
                  <select
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value, section_id: '' })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none bg-slate-900"
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Section</label>
                  <select
                    value={formData.section_id}
                    onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none bg-slate-900"
                  >
                    <option value="">Select Section</option>
                    {sections.map(sec => (
                      <option key={sec.id} value={sec.id}>Section {sec.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Parent / Guardian</label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none bg-slate-900"
                  >
                    <option value="">Select Parent</option>
                    {parents.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Emergency Contact Phone</label>
                  <input
                    type="text"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editStudent ? 'Update Student' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PROFILE MODAL */}
      {viewStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-3xl p-6 border border-slate-800 relative">
            <button
              onClick={() => setViewStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
            >
              <X size={20} />
            </button>

            <div className="text-center pb-4 border-b border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-2xl mx-auto mb-3">
                {viewStudent.full_name.charAt(0)}
              </div>
              <h3 className="text-lg font-bold text-slate-100">{viewStudent.full_name}</h3>
              <p className="text-xs text-indigo-400 font-mono">Admission: {viewStudent.admission_number}</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Class & Section:</span>
                <span className="font-semibold text-slate-200">{viewStudent.class_name || 'Unassigned'} ({viewStudent.section_name || 'N/A'})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Roll Number:</span>
                <span className="font-semibold text-slate-200">{viewStudent.roll_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Parent / Guardian:</span>
                <span className="font-semibold text-slate-200">{viewStudent.parent_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Emergency Contact:</span>
                <span className="font-semibold text-slate-200">{viewStudent.emergency_contact || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Gender & DOB:</span>
                <span className="font-semibold text-slate-200">{viewStudent.gender} • {viewStudent.date_of_birth || 'N/A'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewStudent(null)}
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

export default Students;
