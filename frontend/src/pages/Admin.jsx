import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

// Import the AdminBookings component we already created
import AdminBookings from './AdminBookings';

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Bookings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  Vehicles: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Drivers: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

// ─── MAIN ADMIN COMPONENT ─────────────────────────────────────────────────────
export default function Admin() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Overview',  icon: Icons.Dashboard },
    { id: 'bookings',  label: 'Bookings',  icon: Icons.Bookings  },
    { id: 'vehicles',  label: 'Vehicles',  icon: Icons.Vehicles  },
    { id: 'drivers',   label: 'Drivers',   icon: Icons.Drivers   },
    { id: 'settings',  label: 'Settings',  icon: Icons.Settings  },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Sidebar */}
      <aside className={`bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white
        transition-all duration-300 flex flex-col
        ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-black tracking-tight">VoyageGo</h1>
                <p className="text-xs text-indigo-300 mt-0.5">Admin Control</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                transition-all duration-200
                ${activeSection === id
                  ? 'bg-white text-indigo-950 shadow-lg'
                  : 'text-indigo-100 hover:bg-white/10'
                }`}
            >
              <Icon />
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
              text-red-200 hover:bg-red-500/20 transition-all"
          >
            <Icons.Logout />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeSection === 'dashboard' && <DashboardOverview />}
        {activeSection === 'bookings'  && <AdminBookings />}
        {activeSection === 'vehicles'  && <VehiclesSection />}
        {activeSection === 'drivers'   && <DriversSection />}
        {activeSection === 'settings'  && <SettingsSection />}
      </main>
    </div>
  );
}

// ─── DASHBOARD OVERVIEW ───────────────────────────────────────────────────────
function DashboardOverview() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    totalVehicles: 0,
    totalDrivers: 0,
    revenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [bookingsRes, vehiclesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/bookings', { headers }),
        axios.get('http://localhost:5000/api/vehicles'),
      ]);

      const bookings = bookingsRes.data;
      const vehicles = vehiclesRes.data;

      setStats({
        totalBookings: bookings.length,
        activeBookings: bookings.filter(b => b.status === 'Active').length,
        totalVehicles: vehicles.length,
        totalDrivers: 0, // TODO: fetch from drivers API when ready
        revenue: bookings
          .filter(b => b.status === 'Completed')
          .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
      });

      setRecentBookings(bookings.slice(0, 5));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Bookings', value: stats.totalBookings, color: 'from-blue-500 to-blue-600', icon: '📊' },
    { label: 'Active Trips',   value: stats.activeBookings, color: 'from-emerald-500 to-emerald-600', icon: '🚗' },
    { label: 'Total Vehicles', value: stats.totalVehicles, color: 'from-purple-500 to-purple-600', icon: '🚙' },
    { label: 'Revenue (Rs)',   value: stats.revenue.toLocaleString(), color: 'from-amber-500 to-amber-600', icon: '💰' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Monitor your rental business at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ label, value, color, icon }) => (
          <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-lg
            transform hover:scale-105 transition-transform`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">{label}</p>
                <p className="text-3xl font-black">{value}</p>
              </div>
              <span className="text-4xl opacity-50">{icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentBookings.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No recent bookings</div>
          ) : (
            recentBookings.map((b) => (
              <div key={b._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{b.customer?.name}</p>
                    <p className="text-sm text-gray-500">{b.vehicle?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">Rs {b.totalPrice?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{b.status}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── VEHICLES SECTION ─────────────────────────────────────────────────────────
function VehiclesSection() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/vehicles');
      setVehicles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingVehicle(null);
    setShowModal(true);
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchVehicles();
    } catch (err) {
      alert('Failed to delete vehicle.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Vehicle Fleet</h1>
          <p className="text-gray-500 mt-1">Manage your rental vehicles</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl
            shadow-lg transition-all"
        >
          + Add Vehicle
        </button>
      </div>

      {/* Vehicle Grid */}
      {vehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border p-20 text-center">
          <p className="text-gray-400 text-lg">No vehicles yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <div key={v._id} className="bg-white rounded-2xl border shadow-sm overflow-hidden
              hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gray-100 flex items-center justify-center text-6xl">
                🚗
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900">{v.name}</h3>
                <p className="text-sm text-gray-500">{v.type} • {v.plateNumber}</p>
                <p className="text-xl font-black text-indigo-600 mt-2">Rs {v.pricePerHour}/hr</p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(v)}
                    className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(v._id)}
                    className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vehicle Modal */}
      {showModal && (
        <VehicleModal
          vehicle={editingVehicle}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchVehicles(); }}
        />
      )}
    </div>
  );
}

// ─── VEHICLE MODAL ────────────────────────────────────────────────────────────
function VehicleModal({ vehicle, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: vehicle?.name || '',
    type: vehicle?.type || '',
    model: vehicle?.model || '',
    company: vehicle?.company || '',
    fuelType: vehicle?.fuelType || 'Petrol',
    passengerSeat: vehicle?.passengerSeat || 4,
    plateNumber: vehicle?.plateNumber || '',
    pricePerHour: vehicle?.pricePerHour || '',
    description: vehicle?.description || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (vehicle) {
        await axios.put(`http://localhost:5000/api/vehicles/${vehicle._id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post('http://localhost:5000/api/vehicles', form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      onSuccess();
    } catch (err) {
      alert('Failed to save vehicle.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">{vehicle ? 'Edit' : 'Add'} Vehicle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            type="text"
            placeholder="Vehicle Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-4 py-3 border rounded-lg"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Type (e.g. SUV) *"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
              className="px-4 py-3 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Model *"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              required
              className="px-4 py-3 border rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Company *"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              required
              className="px-4 py-3 border rounded-lg"
            />
            <select
              value={form.fuelType}
              onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
              className="px-4 py-3 border rounded-lg"
            >
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Seats *"
              value={form.passengerSeat}
              onChange={(e) => setForm({ ...form, passengerSeat: e.target.value })}
              required
              min="1"
              className="px-4 py-3 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Plate Number *"
              value={form.plateNumber}
              onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
              required
              className="px-4 py-3 border rounded-lg"
            />
          </div>
          <input
            type="number"
            placeholder="Price per Hour (Rs) *"
            value={form.pricePerHour}
            onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
            required
            min="1"
            className="w-full px-4 py-3 border rounded-lg"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows="3"
            className="w-full px-4 py-3 border rounded-lg"
          />
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border rounded-lg font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            >
              {vehicle ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── DRIVERS SECTION (Placeholder) ────────────────────────────────────────────
function DriversSection() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-black text-gray-900 mb-4">Driver Management</h1>
      <div className="bg-white rounded-2xl border p-12 text-center">
        <p className="text-gray-400">Driver management coming soon...</p>
      </div>
    </div>
  );
}

// ─── SETTINGS SECTION (Placeholder) ───────────────────────────────────────────
function SettingsSection() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-black text-gray-900 mb-4">Settings</h1>
      <div className="bg-white rounded-2xl border p-12 text-center">
        <p className="text-gray-400">Settings panel coming soon...</p>
      </div>
    </div>
  );
}
