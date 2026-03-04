import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
const statusStyle = {
  Pending:   { bg: 'bg-amber-100',   text: 'text-amber-800',   icon: '⏳' },
  Accepted:  { bg: 'bg-blue-100',    text: 'text-blue-800',    icon: '✓' },
  Active:    { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '🚗' },
  Completed: { bg: 'bg-gray-100',    text: 'text-gray-700',    icon: '✓' },
  Cancelled: { bg: 'bg-red-100',     text: 'text-red-800',     icon: '✕' },
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('browse'); // browse | myTrips
  const [vehicles, setVehicles] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVehicles();
    fetchMyBookings();
  }, []);

  // ── FETCH VEHICLES ─────────────────────────────────────────────────────────
  const fetchVehicles = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/vehicles');
      setVehicles(data.filter(v => v.isActive)); // Only show active vehicles
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  // ── FETCH MY BOOKINGS ──────────────────────────────────────────────────────
  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/bookings/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── FILTER VEHICLES ────────────────────────────────────────────────────────
  const filteredVehicles = vehicles.filter(v =>
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── TAB COUNTS ─────────────────────────────────────────────────────────────
  const activeBookings = myBookings.filter(b => 
    ['Pending', 'Accepted', 'Active'].includes(b.status)
  ).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">VoyageGo</h1>
              <p className="text-sm text-gray-500">Explore. Book. Drive.</p>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                navigate('/login');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 
                border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 pt-2">
            {[
              { key: 'browse', label: 'Browse Vehicles', count: filteredVehicles.length },
              { key: 'myTrips', label: 'My Trips', count: activeBookings },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all
                  ${activeTab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {label}
                {count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold
                    ${activeTab === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'browse' ? (
          <BrowseVehicles
            vehicles={filteredVehicles}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            navigate={navigate}
          />
        ) : (
          <MyTrips bookings={myBookings} loading={loading} navigate={navigate} />
        )}
      </div>
    </div>
  );
}

// ─── BROWSE VEHICLES TAB ──────────────────────────────────────────────────────
function BrowseVehicles({ vehicles, searchTerm, setSearchTerm, navigate }) {
  return (
    <div>
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by name, type, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Vehicle grid */}
      {vehicles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border">
          <div className="text-6xl mb-4">🚗</div>
          <p className="text-gray-500 text-lg font-medium">No vehicles available</p>
          <p className="text-gray-400 text-sm mt-1">Check back later for new listings</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <VehicleCard key={v._id} vehicle={v} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── VEHICLE CARD ─────────────────────────────────────────────────────────────
function VehicleCard({ vehicle: v, navigate }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 
      overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      
      {/* Image */}
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        {v.imageUrl ? (
          <img
            src={`http://localhost:5000/${v.imageUrl}`}
            alt={v.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">
            🚗
          </div>
        )}
        <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 
          rounded-full text-sm font-bold shadow-lg">
          Rs {v.pricePerHour}/hr
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{v.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{v.type} • {v.model}</p>

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <span>⛽</span>
            <span>{v.fuelType}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>👥</span>
            <span>{v.passengerSeat} seats</span>
          </div>
        </div>

        <button
          onClick={() => navigate(`/vehicle/${v._id}`)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold 
            py-2.5 rounded-lg transition-colors"
        >
          View Details & Book
        </button>
      </div>
    </div>
  );
}

// ─── MY TRIPS TAB ─────────────────────────────────────────────────────────────
function MyTrips({ bookings, loading, navigate }) {
  const formatDate = (dateString) => {
    try { return format(parseISO(dateString), 'MMM d, yyyy h:mm a'); }
    catch { return dateString; }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-gray-500 text-lg font-medium">No bookings yet</p>
        <p className="text-gray-400 text-sm mt-1 mb-6">Start exploring and book your first vehicle!</p>
        <button
          onClick={() => navigate('/customer')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 
            text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Browse Vehicles
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => (
        <BookingCard key={b._id} booking={b} formatDate={formatDate} />
      ))}
    </div>
  );
}

// ─── BOOKING CARD ─────────────────────────────────────────────────────────────
function BookingCard({ booking: b, formatDate }) {
  const s = statusStyle[b.status] || statusStyle.Pending;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 
      hover:shadow-md transition-shadow">
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          {/* Vehicle image thumbnail */}
          <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
            {b.vehicle?.imageUrl ? (
              <img
                src={`http://localhost:5000/${b.vehicle.imageUrl}`}
                alt={b.vehicle.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                🚗
              </div>
            )}
          </div>

          {/* Vehicle info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900">{b.vehicle?.name || 'Vehicle'}</h3>
            <p className="text-sm text-gray-500">{b.vehicle?.type} • {b.vehicle?.plateNumber}</p>
          </div>
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full 
          text-sm font-semibold ${s.bg} ${s.text}`}>
          <span>{s.icon}</span>
          {b.status}
        </span>
      </div>

      {/* Trip details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Pickup</p>
          <p className="text-gray-900 font-medium">{formatDate(b.startDate)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Return</p>
          <p className="text-gray-900 font-medium">{formatDate(b.endDate)}</p>
        </div>
      </div>

      {/* Price & Driver */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div>
          <p className="text-gray-500 text-xs">Total Price</p>
          <p className="text-xl font-bold text-gray-900">Rs {b.totalPrice?.toLocaleString()}</p>
        </div>
        {b.driver ? (
          <div className="text-right">
            <p className="text-gray-500 text-xs">Driver</p>
            <p className="text-sm font-medium text-gray-900">{b.driver.name}</p>
          </div>
        ) : b.status === 'Pending' ? (
          <p className="text-amber-600 text-sm font-medium">⏳ Awaiting driver confirmation</p>
        ) : null}
      </div>

      {/* Status messages */}
      {b.status === 'Pending' && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          Your booking request has been sent to the driver. You'll be notified once they respond.
        </div>
      )}
      {b.status === 'Accepted' && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          Your booking is confirmed! The driver will contact you before the pickup time.
        </div>
      )}
      {b.status === 'Active' && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
          🚗 Trip in progress. Have a safe journey!
        </div>
      )}
    </div>
  );
}
