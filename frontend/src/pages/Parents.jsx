import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  AlertCircle,
  Heart,
  Baby,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Parents = () => {
  const { user } = useAuth();
  const isManagement = ['Super Admin', 'School Admin', 'Principal'].includes(user?.role?.name);

  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editParent, setEditParent] = useState(null);
  const [viewParent, setViewParent] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: 'password123',
    phone: '',
    occupation: 'Software Engineer',
    relationship_type: 'Father',
    address: 'House 12, Street 5, F-8/3, Islamabad'
  });

  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchParents = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/parents?search=${encodeURIComponent(search)}`);
      setParents(res.data);
    } catch (err) {
      console.error('Failed to fetch parents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, [search]);

  const handleOpenAdd = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormData({
      first_name: '',
      last_name: '',
      email: `parent_${randomNum}@school.com`,
      username: `parent_${randomNum}`,
      password: 'password123',
      phone: '+1 555-0177',
      occupation: 'Architect',
      relationship_type: 'Father',
      address: '789 Guardian Avenue'
    });
    setEditParent(null);
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditParent(p);
    const names = (p.full_name || '').split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';

    setFormData({
      first_name: firstName,
      last_name: lastName,
      email: p.email,
      username: p.username,
      phone: p.phone || '',
      occupation: p.occupation || '',
      relationship_type: p.relationship_type || 'Father',
      address: p.address || ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (editParent) {
        await API.put(`/api/parents/${editParent.id}`, formData);
        setSuccessMsg('Parent record updated successfully!');
      } else {
        await API.post('/api/parents', formData);
        setSuccessMsg('Parent record created successfully!');
      }

      setShowAddModal(false);
      fetchParents();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save parent record');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (window.confirm('Deactivate parent account?')) {
      try {
        await API.delete(`/api/parents/${id}`);
        setSuccessMsg('Parent account deactivated.');
        fetchParents();
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to deactivate parent');
      }
    }
  };

  const totalPages = Math.ceil(parents.length / itemsPerPage) || 1;
  const paginatedParents = parents.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Heart size={16} />
            <span>Guardian Directory</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100">Parent Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Parent profiles, occupation, relationship, and enrolled children mapping
          </p>
        </div>

        {isManagement && (
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center space-x-2 transition shrink-0"
          >
            <Plus size={16} />
            <span>Add Parent / Guardian</span>
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
            placeholder="Search parent name, email, occupation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input text-slate-100 focus:outline-none"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Parent / Guardian</th>
                <th className="px-6 py-4">Relationship</th>
                <th className="px-6 py-4">Occupation</th>
                <th className="px-6 py-4">Phone / Email</th>
                <th className="px-6 py-4">Enrolled Children</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading guardian directory...
                  </td>
                </tr>
              ) : paginatedParents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    No parent records found.
                  </td>
                </tr>
              ) : (
                paginatedParents.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-medium text-slate-100 flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                        {p.full_name ? p.full_name.charAt(0) : 'P'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-100">{p.full_name}</p>
                        <p className="text-[10px] text-slate-400">@{p.username}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {p.relationship_type || 'Guardian'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-200 font-medium">{p.occupation || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <p className="text-slate-200 font-medium">{p.phone || 'No Phone'}</p>
                      <p className="text-[10px] text-slate-400">{p.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <Baby size={14} className="text-rose-400" />
                        <span className="font-bold text-slate-100">{p.children_count} Students</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setViewParent(p)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="View Profile & Children"
                      >
                        <Eye size={15} />
                      </button>
                      {isManagement && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition"
                            title="Edit Parent"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeactivate(p.id)}
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
          <span>Showing page {page} of {totalPages} ({parents.length} total guardians)</span>
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
          <div className="max-w-xl w-full glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-100 mb-1">
              {editParent ? 'Edit Parent Profile' : 'Add Parent / Guardian'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">Enter parent contact details and occupation</p>

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
                  <label className="block font-semibold text-slate-300 mb-1">Relationship</label>
                  <select
                    value={formData.relationship_type}
                    onChange={(e) => setFormData({ ...formData, relationship_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none bg-slate-900"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Residential Address</label>
                <textarea
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold transition shadow-lg shadow-rose-600/20 disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editParent ? 'Update Parent' : 'Add Parent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PROFILE MODAL */}
      {viewParent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-3xl p-6 border border-slate-800 relative">
            <button
              onClick={() => setViewParent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
            >
              <X size={20} />
            </button>

            <div className="text-center pb-4 border-b border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center font-bold text-2xl mx-auto mb-3">
                {viewParent.full_name.charAt(0)}
              </div>
              <h3 className="text-lg font-bold text-slate-100">{viewParent.full_name}</h3>
              <p className="text-xs text-rose-400 font-medium">{viewParent.relationship_type || 'Guardian'} • {viewParent.occupation}</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Email:</span>
                <span className="font-semibold text-slate-200">{viewParent.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Phone:</span>
                <span className="font-semibold text-slate-200">{viewParent.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Address:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[200px]">{viewParent.address || 'N/A'}</span>
              </div>
            </div>

            {/* Children List */}
            <div className="mt-2 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Enrolled Children</h4>
              {viewParent.children.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No linked students found.</p>
              ) : (
                <div className="space-y-2">
                  {viewParent.children.map(child => (
                    <div key={child.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{child.full_name}</p>
                        <p className="text-[10px] text-slate-400">{child.class_name || 'Class N/A'} • Adm #{child.admission_number}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">Student</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setViewParent(null)}
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

export default Parents;
