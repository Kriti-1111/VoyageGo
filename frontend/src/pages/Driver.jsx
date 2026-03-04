import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

// ─── BOOKING STATUS ENUM ──────────────────────────────────────────────────────
const BOOKING_STATUS = {
  PENDING:   'Pending',
  ACCEPTED:  'Accepted',
  ACTIVE:    'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  try { return format(parseISO(dateString), 'MMM d, yyyy h:mm a'); }
  catch { return dateString || '—'; }
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const statusConfig = {
  Pending:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30'  },
  Accepted:  { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/30'   },
  Active:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Completed: { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/30'  },
  Cancelled: { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/30'    },
};

const StatusBadge = ({ status }) => {
  const c = statusConfig[status] || statusConfig.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
      border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.text.replace('text-', 'bg-')}
        ${status === 'Active' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DriverDashboard() {
  const [bookings,     setBookings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [isOnline,     setIsOnline]     = useState(true);   // Driver availability toggle
  const [activeTab,    setActiveTab]    = useState('pending'); // pending | active | history
  const [expandedId,   setExpandedId]   = useState(null);   // expanded booking card
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  useEffect(() => {
    fetchMyBookings();
    fetchMyAvailability();
  }, []);

  // ── FETCH DRIVER'S BOOKINGS ────────────────────────────────────────────────
  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const { data } = await axios.get('http://localhost:5000/api/bookings/driver/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookings(data);
    } catch (err) {
      setError('Could not load your bookings. Try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/drivers/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsOnline(data.isAvailable);
    } catch (err) {
      console.error('Could not fetch availability:', err);
    }
  };

  // ── TOGGLE AVAILABILITY ───────────────────────────────────────────────────
  const toggleAvailability = async () => {
    setTogglingAvailability(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.patch(
        'http://localhost:5000/api/drivers/availability',
        { isAvailable: !isOnline },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsOnline(data.isAvailable);
      showToast(data.isAvailable ? 'You are now Online ✓' : 'You are now Offline');
    } catch (err) {
      showToast('Could not update availability.', 'error');
    } finally {
      setTogglingAvailability(false);
    }
  };

  // ── RESPOND TO BOOKING (Accept / Reject) ──────────────────────────────────
  const respondToBooking = async (bookingId, action) => {
    // action: 'accept' | 'reject'
    const newStatus = action === 'accept' ? BOOKING_STATUS.ACCEPTED : BOOKING_STATUS.CANCELLED;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/bookings/${bookingId}/driver-response`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(action === 'accept' ? 'Booking accepted!' : 'Booking rejected.');
      fetchMyBookings();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed.', 'error');
    }
  };

  // ── TOAST ─────────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    const el = document.createElement('div');
    el.className = `fixed bottom-5 right-5 z-50 px-5 py-3 rounded-xl text-white text-sm
      font-semibold shadow-2xl transition-all duration-300
      ${type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`;
    el.innerText = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  };

  // ── TABS FILTER ───────────────────────────────────────────────────────────
  const tabFilter = {
    pending:  [BOOKING_STATUS.PENDING],
    active:   [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.ACTIVE],
    history:  [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
  };

  const visibleBookings = bookings.filter(b =>
    tabFilter[activeTab]?.includes(b.status)
  );

  const pendingCount = bookings.filter(b => b.status === BOOKING_STATUS.PENDING).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Driver Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-0.5">VoyageGo</p>
        </div>

        {/* Online / Offline Toggle */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-zinc-400">Availability</span>
          <button
            onClick={toggleAvailability}
            disabled={togglingAvailability}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
              transition-all duration-300 border
              ${isOnline
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              } disabled:opacity-50`}
          >
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0
              ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            {togglingAvailability ? 'Updating…' : isOnline ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>

      {/* ── QUICK STAT ROW ── */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'New Requests', value: bookings.filter(b => b.status === 'Pending').length,   color: 'text-amber-400'   },
          { label: 'Active Trips',  value: bookings.filter(b => b.status === 'Active').length,    color: 'text-emerald-400' },
          { label: 'Completed',     value: bookings.filter(b => b.status === 'Completed').length, color: 'text-blue-400'    },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-zinc-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6">
        {[
          { key: 'pending', label: 'New Requests' },
          { key: 'active',  label: 'Active Trips'  },
          { key: 'history', label: 'History'        },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === key
                ? 'bg-white text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            {label}
            {key === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-black
                px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
          <button onClick={fetchMyBookings} className="ml-3 underline">Retry</button>
        </div>
      )}

      {/* ── BOOKING CARDS ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <svg className="animate-spin w-7 h-7 mb-3 text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Loading your bookings…
        </div>
      ) : visibleBookings.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="font-semibold text-zinc-400">No bookings here yet.</p>
          <p className="text-xs mt-1">
            {activeTab === 'pending' && 'New requests will appear here.'}
            {activeTab === 'active'  && 'Your accepted and active trips show here.'}
            {activeTab === 'history' && 'Completed and cancelled trips will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleBookings.map((b) => (
            <BookingCard
              key={b._id}
              booking={b}
              isExpanded={expandedId === b._id}
              onToggle={() => setExpandedId(expandedId === b._id ? null : b._id)}
              onRespond={respondToBooking}
              activeTab={activeTab}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── BOOKING CARD ─────────────────────────────────────────────────────────────
function BookingCard({ booking: b, isExpanded, onToggle, onRespond, activeTab }) {
  return (
    <div className={`bg-zinc-900 border rounded-xl overflow-hidden transition-all duration-200
      ${b.status === 'Pending' ? 'border-amber-500/30' : 'border-zinc-800'}`}>

      {/* Card Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar placeholder */}
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700
            flex items-center justify-center text-zinc-400 font-bold text-sm flex-shrink-0">
            {b.customer?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{b.customer?.name || 'Customer'}</p>
            <p className="text-zinc-400 text-xs truncate">{b.vehicle?.name || 'Vehicle'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <StatusBadge status={b.status} />
          <svg className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Trip Date Summary — always visible */}
      <div className="px-5 pb-3 flex gap-4 text-xs text-zinc-500 border-t border-zinc-800/50 pt-3">
        <span>📅 {formatDate(b.startDate)}</span>
        <span>→</span>
        <span>{formatDate(b.endDate)}</span>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-zinc-800 pt-4 space-y-4">

          {/* Customer Contact — only visible after booking is Accepted+ */}
          {(b.status === BOOKING_STATUS.ACCEPTED || b.status === BOOKING_STATUS.ACTIVE) ? (
            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                Customer Contact
              </p>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-white">{b.customer?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${b.customer?.phone}`} className="text-emerald-400 underline">
                  {b.customer?.phone || 'N/A'}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="text-zinc-300">{b.pickupLocation || 'See booking details'}</span>
              </div>
            </div>
          ) : b.status === BOOKING_STATUS.PENDING ? (
            // Pending — show a teaser only (customer details hidden)
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Customer contact unlocks after you accept this booking.
            </div>
          ) : null}

          {/* Vehicle details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-zinc-500 text-xs mb-1">Vehicle</p>
              <p className="text-white font-medium">{b.vehicle?.name || '—'}</p>
              <p className="text-zinc-400 text-xs">{b.vehicle?.type}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-zinc-500 text-xs mb-1">Plate No.</p>
              <p className="text-white font-medium font-mono">{b.vehicle?.plateNumber || '—'}</p>
            </div>
          </div>

          {/* Notes */}
          {b.notes && (
            <div className="bg-zinc-800/50 rounded-lg p-3 text-sm">
              <p className="text-zinc-500 text-xs mb-1">Customer Note</p>
              <p className="text-zinc-300 italic">"{b.notes}"</p>
            </div>
          )}

          {/* ACTION BUTTONS */}
          {b.status === BOOKING_STATUS.PENDING && (
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => onRespond(b._id, 'reject')}
                className="flex-1 py-2.5 rounded-xl border border-red-700/50 text-red-400
                  hover:bg-red-900/30 text-sm font-semibold transition-all"
              >
                ✕ Reject
              </button>
              <button
                onClick={() => onRespond(b._id, 'accept')}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500
                  text-white text-sm font-bold transition-all shadow-lg shadow-emerald-900/40"
              >
                ✓ Accept
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
