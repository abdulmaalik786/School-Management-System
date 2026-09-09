import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bus,
  Plus,
  Search,
  MapPin,
  Clock,
  Phone,
  User,
  Users,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Navigation,
  DollarSign
} from 'lucide-react';

const Transport = () => {
  const { user } = useAuth();
  const roleName = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isAdmin = ['Super Admin', 'School Admin', 'Principal', 'Accountant'].includes(roleName);

  const [activeTab, setActiveTab] = useState('routes'); // 'routes', 'vehicles', 'allocations'
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [students, setStudents] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vehicle Modal
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    vehicle_number: '',
    model: '',
    capacity: 30,
    driver_name: '',
    driver_phone: '',
    license_number: '',
    status: 'Active'
  });

  // Route Modal
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeForm, setRouteForm] = useState({
    route_name: '',
    start_point: '',
    end_point: '',
    vehicle_id: '',
    fare_amount: 2500,
    stops: [
      { stop_name: 'Main Point', pickup_time: '07:15 AM', drop_time: '02:45 PM', stop_fee: 2500 }
    ]
  });

  // Assign Student Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    student_id: '',
    route_id: '',
    academic_year_id: ''
  });

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, vRes, aRes, sRes, yRes] = await Promise.all([
        API.get('/api/transport/routes'),
        API.get('/api/transport/vehicles'),
        API.get('/api/transport/allocations'),
        API.get('/api/students'),
        API.get('/api/academic-years')
      ]);
      setRoutes(rRes.data);
      setVehicles(vRes.data);
      setAllocations(aRes.data);
      setStudents(sRes.data);
      setAcademicYears(yRes.data);

      if (vRes.data.length > 0 && !routeForm.vehicle_id) {
        setRouteForm(prev => ({ ...prev, vehicle_id: vRes.data[0].id }));
      }
      if (sRes.data.length > 0 && !assignForm.student_id) {
        setAssignForm(prev => ({
          ...prev,
          student_id: sRes.data[0].id,
          route_id: rRes.data[0]?.id || '',
          academic_year_id: yRes.data[0]?.id || ''
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await API.post('/api/transport/vehicles', {
        ...vehicleForm,
        capacity: parseInt(vehicleForm.capacity)
      });
      setShowVehicleModal(false);
      setMsg('Vehicle registered successfully!');
      setTimeout(() => setMsg(''), 4000);
      fetchData();
    } catch (error) {
      setErr(error.response?.data?.detail || 'Failed to save vehicle');
    }
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await API.post('/api/transport/routes', {
        route_name: routeForm.route_name,
        start_point: routeForm.start_point,
        end_point: routeForm.end_point,
        vehicle_id: routeForm.vehicle_id ? Number(routeForm.vehicle_id) : null,
        fare_amount: parseFloat(routeForm.fare_amount),
        stops: routeForm.stops
      });
      setShowRouteModal(false);
      setMsg('Transport route created successfully!');
      setTimeout(() => setMsg(''), 4000);
      fetchData();
    } catch (error) {
      setErr(error.response?.data?.detail || 'Failed to save route');
    }
  };

  const handleAssignStudent = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await API.post('/api/transport/allocations', {
        student_id: Number(assignForm.student_id),
        route_id: Number(assignForm.route_id),
        academic_year_id: Number(assignForm.academic_year_id)
      });
      setShowAssignModal(false);
      setMsg('Student assigned to route successfully!');
      setTimeout(() => setMsg(''), 4000);
      fetchData();
    } catch (error) {
      setErr(error.response?.data?.detail || 'Failed to allocate transport');
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('Delete this transport route?')) return;
    try {
      await API.delete(`/api/transport/routes/${id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete route');
    }
  };

  const addStopField = () => {
    setRouteForm(prev => ({
      ...prev,
      stops: [
        ...prev.stops,
        { stop_name: '', pickup_time: '07:30 AM', drop_time: '02:30 PM', stop_fee: prev.fare_amount }
      ]
    }));
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900/50 via-slate-900/60 to-teal-900/50 border border-slate-800 p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <Bus className="w-3.5 h-3.5" /> Fleet & Logistics
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Transport Management</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Organize transport fleet, route stops with pickup times, driver contacts, and student bus pass assignments.
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowVehicleModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                + Add Vehicle
              </button>
              <button
                onClick={() => setShowRouteModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create Route
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'routes'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Navigation className="w-4 h-4" /> Routes & Stops ({routes.length})
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'vehicles'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Bus className="w-4 h-4" /> Vehicles & Drivers ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'allocations'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Student Bus Passes ({allocations.length})
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {msg}
        </div>
      )}

      {/* TAB 1: ROUTES */}
      {activeTab === 'routes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {routes.map((r) => (
            <div key={r.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{r.route_name}</h3>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{r.start_point} &rarr; {r.end_point}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                  ${r.fare_amount}/term
                </span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Assigned Bus</span>
                  <strong className="text-white">{r.vehicle_number || 'No vehicle'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Driver</span>
                  <strong className="text-slate-300">{r.driver_name || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Driver Phone</span>
                  <span className="text-emerald-400">{r.driver_phone || 'N/A'}</span>
                </div>
              </div>

              {/* Stops Timeline */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-bold text-slate-400 block">Route Stops</span>
                <div className="space-y-1.5">
                  {r.stops?.map((s, idx) => (
                    <div key={s.id} className="p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-white">{s.stop_name}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] space-x-2">
                        <span>Pickup: <strong className="text-emerald-400">{s.pickup_time}</strong></span>
                        <span>Drop: <strong className="text-indigo-400">{s.drop_time}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isAdmin && (
                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button onClick={() => handleDeleteRoute(r.id)} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Route
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-white font-mono">{v.vehicle_number}</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">
                  {v.status}
                </span>
              </div>
              <div className="text-xs text-slate-400">Model: <strong className="text-white">{v.model || 'Standard Bus'}</strong></div>
              <div className="text-xs text-slate-400">Seating Capacity: <strong className="text-white">{v.capacity} Passengers</strong></div>

              <div className="pt-3 border-t border-slate-800 text-xs space-y-1">
                <div className="text-slate-400">Driver: <strong className="text-white">{v.driver_name || 'Unassigned'}</strong></div>
                <div className="text-slate-400">Phone: <strong className="text-emerald-400">{v.driver_phone || 'N/A'}</strong></div>
                <div className="text-slate-500 font-mono text-[11px]">License: {v.license_number || 'N/A'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ALLOCATIONS */}
      {activeTab === 'allocations' && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Issue Bus Pass
              </button>
            </div>
          )}

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Bus</th>
                  <th className="py-3 px-4">Driver Contact</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allocations.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-white">{a.student_name} ({a.admission_number})</td>
                    <td className="py-3 px-4 font-semibold text-emerald-400">{a.route_name}</td>
                    <td className="py-3 px-4 font-mono text-white">{a.vehicle_number || '-'}</td>
                    <td className="py-3 px-4 text-slate-300">{a.driver_name} ({a.driver_phone})</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE VEHICLE MODAL */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Add Vehicle</h3>
              <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            {err && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{err}</div>}
            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Vehicle Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BUS-01"
                  value={vehicleForm.vehicle_number}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Toyota Coaster"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Capacity</label>
                  <input
                    type="number"
                    min="5"
                    value={vehicleForm.capacity}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={vehicleForm.driver_name}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driver_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Driver Phone</label>
                  <input
                    type="text"
                    value={vehicleForm.driver_phone}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driver_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ROUTE MODAL */}
      {showRouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Create Transport Route</h3>
              <button onClick={() => setShowRouteModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            {err && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{err}</div>}
            <form onSubmit={handleSaveRoute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Route Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Route 1 - Downtown to Campus"
                  value={routeForm.route_name}
                  onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Start Point *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Central Station"
                    value={routeForm.start_point}
                    onChange={(e) => setRouteForm({ ...routeForm, start_point: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">End Point *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. School Campus"
                    value={routeForm.end_point}
                    onChange={(e) => setRouteForm({ ...routeForm, end_point: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Assign Bus</label>
                  <select
                    value={routeForm.vehicle_id}
                    onChange={(e) => setRouteForm({ ...routeForm, vehicle_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    <option value="">No vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number} ({v.model})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Term Fare ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={routeForm.fare_amount}
                    onChange={(e) => setRouteForm({ ...routeForm, fare_amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-bold"
                  />
                </div>
              </div>

              {/* Stops Config */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-bold text-slate-400">Route Stops</span>
                  <button type="button" onClick={addStopField} className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold">+ Add Stop</button>
                </div>
                {routeForm.stops.map((st, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <input
                      type="text"
                      placeholder="Stop Name"
                      required
                      value={st.stop_name}
                      onChange={(e) => {
                        const copy = [...routeForm.stops];
                        copy[idx].stop_name = e.target.value;
                        setRouteForm({ ...routeForm, stops: copy });
                      }}
                      className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Pickup e.g. 07:15 AM"
                      value={st.pickup_time}
                      onChange={(e) => {
                        const copy = [...routeForm.stops];
                        copy[idx].pickup_time = e.target.value;
                        setRouteForm({ ...routeForm, stops: copy });
                      }}
                      className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Drop e.g. 02:45 PM"
                      value={st.drop_time}
                      onChange={(e) => {
                        const copy = [...routeForm.stops];
                        copy[idx].drop_time = e.target.value;
                        setRouteForm({ ...routeForm, stops: copy });
                      }}
                      className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowRouteModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold">Save Route</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN PASS MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Issue Student Bus Pass</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            {err && <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{err}</div>}
            <form onSubmit={handleAssignStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Student *</label>
                <select
                  value={assignForm.student_id}
                  onChange={(e) => setAssignForm({ ...assignForm, student_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                >
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name || `${s.first_name} ${s.last_name}`} ({s.admission_number})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Route *</label>
                <select
                  value={assignForm.route_id}
                  onChange={(e) => setAssignForm({ ...assignForm, route_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                >
                  {routes.map(r => <option key={r.id} value={r.id}>{r.route_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Academic Year *</label>
                <select
                  value={assignForm.academic_year_id}
                  onChange={(e) => setAssignForm({ ...assignForm, academic_year_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                >
                  {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold">Assign Pass</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transport;
