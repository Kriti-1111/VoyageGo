import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

// ─── PRICING LOGIC (matches your tiered pricing spec) ────────────────────────
const calculatePrice = (pricePerHour, totalHours) => {
  if (totalHours >= 168) {
    // Weekly: 7 days = 168 hours → 20% discount
    const dailyRate = pricePerHour * 24;
    return dailyRate * 7 * 0.80;
  } else if (totalHours >= 24) {
    // Daily: 24+ hours → 15% discount
    return pricePerHour * 24 * 0.85 * Math.ceil(totalHours / 24);
  } else {
    // Hourly: standard rate
    return pricePerHour * totalHours;
  }
};

const getDiscountLabel = (totalHours) => {
  if (totalHours >= 168) return { label: "Weekly package discount applied", pct: "20%" };
  if (totalHours >= 24)  return { label: "Daily package discount applied",  pct: "15%" };
  return null;
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const CarDetails = () => {
  const { carId } = useParams();
  const navigate  = useNavigate();

  const [vehicle,       setVehicle]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime,   setEndDateTime]   = useState("");
  const [totalPrice,    setTotalPrice]    = useState(0);
  const [timeDiff,      setTimeDiff]      = useState({ hours: 0, minutes: 0, totalHours: 0, isValid: false });
  const [isLoggedIn,    setIsLoggedIn]    = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms,     setShowTerms]     = useState(false);
  const [notification,  setNotification]  = useState({ open: false, message: "", severity: "success" });
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  // ── AUTH CHECK ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  // ── FETCH VEHICLE ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`http://localhost:5000/api/vehicles/${carId}`);
        setVehicle(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load vehicle.");
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [carId]);

  // ── PRICE CALCULATION ───────────────────────────────────────────────────────
  useEffect(() => {
    if (vehicle && startDateTime && endDateTime) {
      const start = new Date(startDateTime);
      const end   = new Date(endDateTime);
      const diffMs    = end - start;
      const totalHours = diffMs / (1000 * 60 * 60);
      const hours   = Math.floor(totalHours);
      const minutes = Math.round((totalHours - hours) * 60);
      const isValid = diffMs >= 60 * 60 * 1000; // minimum 1 hour

      setTimeDiff({ hours, minutes, totalHours, isValid });
      setTotalPrice(isValid ? calculatePrice(vehicle.pricePerHour, totalHours) : 0);
    } else {
      setTimeDiff({ hours: 0, minutes: 0, totalHours: 0, isValid: false });
      setTotalPrice(0);
    }
  }, [startDateTime, endDateTime, vehicle]);

  // ── DATE HANDLERS ───────────────────────────────────────────────────────────
  const getMinStart = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  };

  const getMinEnd = () => {
    if (!startDateTime) return "";
    const start = new Date(startDateTime);
    start.setHours(start.getHours() + 1);
    return start.toISOString().slice(0, 16);
  };

  const handleStartChange = (e) => {
    if (!isLoggedIn) { showNotif("Please login first", "error"); return; }
    const val = e.target.value;
    if (new Date(val) < new Date()) { showNotif("Start time cannot be in the past", "error"); return; }
    setStartDateTime(val);
    if (endDateTime && new Date(endDateTime) <= new Date(val)) setEndDateTime("");
  };

  const handleEndChange = (e) => {
    if (!isLoggedIn) { showNotif("Please login first", "error"); return; }
    if (!startDateTime) { showNotif("Select a start time first", "error"); return; }
    const val = e.target.value;
    if ((new Date(val) - new Date(startDateTime)) < 60 * 60 * 1000) {
      showNotif("Minimum booking duration is 1 hour", "error"); return;
    }
    setEndDateTime(val);
  };

  // ── BOOKING SUBMIT ──────────────────────────────────────────────────────────
  // NOTE: No payment redirect — booking goes straight to Pending status.
  // The driver will then Accept or Reject from their dashboard.
  const handleBooking = async () => {
    if (!isLoggedIn)      { showNotif("Please login to book", "error"); navigate("/login"); return; }
    if (!vehicle?.isActive) { showNotif("This vehicle is not available", "error"); return; }
    if (!startDateTime || !endDateTime) { showNotif("Select both dates", "error"); return; }
    if (!timeDiff.isValid) { showNotif("Minimum booking is 1 hour", "error"); return; }
    if (!termsAccepted)   { showNotif("Please accept the terms", "error"); return; }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");

      // POST to your bookingController — creates a Pending booking
      await axios.post(
        "http://localhost:5000/api/bookings",
        {
          vehicleId:  carId,
          startDate:  startDateTime,
          endDate:    endDateTime,
          totalPrice,
          notes: "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotif("Booking submitted! Waiting for driver confirmation.", "success");

      // Redirect customer to their dashboard after 2 seconds
      setTimeout(() => navigate("/customer"), 2000);

    } catch (err) {
      showNotif(err.response?.data?.message || "Booking failed. Try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── NOTIFICATION ────────────────────────────────────────────────────────────
  const showNotif = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
    setTimeout(() => setNotification(prev => ({ ...prev, open: false })), 4000);
  };

  // ── LOADING / ERROR STATES ──────────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      <p className="ml-4 text-gray-600">Loading vehicle…</p>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">{error}</div>
    </div>
  );

  const isAvailable   = vehicle?.isActive;
  const bookingDisabled = !timeDiff.isValid || !isAvailable || !isLoggedIn || !termsAccepted || isSubmitting;
  const discount      = getDiscountLabel(timeDiff.totalHours);
  const basePrice     = vehicle?.pricePerHour * timeDiff.totalHours;

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg
          hover:bg-gray-50 text-gray-700 mb-6 text-sm font-medium"
      >
        ← Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* ── LEFT: Vehicle Info ── */}
        <div className="md:col-span-2 space-y-6">

          {/* Image */}
          <div className="rounded-2xl overflow-hidden shadow-lg h-[400px] bg-gray-100">
            {vehicle?.imageUrl ? (
              <img
                src={`http://localhost:5000/${vehicle.imageUrl}`}
                alt={vehicle.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = '/placeholder-vehicle.jpg'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">🚗</div>
            )}
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{vehicle?.name}</h1>
                <p className="text-gray-500 mt-1">{vehicle?.type} · {vehicle?.model}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold
                ${isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>

            <hr className="my-4" />

            {vehicle?.description && (
              <p className="text-gray-600 mb-6">{vehicle.description}</p>
            )}

            <h3 className="text-lg font-bold mb-3">Vehicle Specs</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                { label: "Company",  value: vehicle?.company     },
                { label: "Fuel",     value: vehicle?.fuelType    },
                { label: "Seats",    value: vehicle?.passengerSeat && `${vehicle.passengerSeat} Adults` },
                { label: "Plate No.", value: vehicle?.plateNumber },
              ].filter(i => i.value).map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">{label}</p>
                  <p className="font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Booking Panel ── */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-md p-6 sticky top-5 space-y-5">
            <h2 className="text-2xl font-bold text-gray-800">Book This Vehicle</h2>

            {/* Price display */}
            <div>
              <p className="text-3xl font-bold text-blue-600">
                Rs {vehicle?.pricePerHour?.toLocaleString()}
              </p>
              <p className="text-gray-400 text-sm">per hour</p>
            </div>

            <hr />

            {/* Login warning */}
            {!isLoggedIn && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded text-sm text-yellow-700">
                You must{" "}
                <button onClick={() => navigate("/login")} className="underline font-semibold">
                  login
                </button>{" "}
                to make a booking.
              </div>
            )}

            {/* Date pickers */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={handleStartChange}
                  min={getMinStart()}
                  disabled={!isLoggedIn || !isAvailable}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={handleEndChange}
                  min={getMinEnd()}
                  disabled={!startDateTime || !isLoggedIn || !isAvailable}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Duration */}
            {startDateTime && endDateTime && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-700 mb-1">Duration</p>
                {timeDiff.isValid ? (
                  <p className="text-gray-600">
                    {timeDiff.hours > 0 && `${timeDiff.hours}h `}
                    {timeDiff.minutes > 0 && `${timeDiff.minutes}m`}
                  </p>
                ) : (
                  <p className="text-red-500">Minimum booking is 1 hour</p>
                )}
              </div>
            )}

            {/* Price summary */}
            {timeDiff.isValid && (
              <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
                <p className="font-semibold text-gray-700 mb-2">Price Summary</p>
                <div className="flex justify-between text-gray-600">
                  <span>Rs {vehicle?.pricePerHour} × {timeDiff.totalHours.toFixed(1)} hrs</span>
                  <span>Rs {basePrice?.toFixed(2)}</span>
                </div>
                {discount && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>{discount.label} (-{discount.pct})</span>
                    <span>- Rs {(basePrice - totalPrice).toFixed(2)}</span>
                  </div>
                )}
                <hr className="border-blue-200 my-1" />
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Total</span>
                  <span>Rs {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Terms checkbox — only show when dates are valid */}
            {isLoggedIn && isAvailable && timeDiff.isValid && (
              <div className="flex items-start gap-2 text-sm">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="text-gray-700">
                  I accept the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-blue-600 underline hover:text-blue-500"
                  >
                    Terms & Conditions
                  </button>
                </label>
              </div>
            )}

            {/* Book Button */}
            <button
              onClick={handleBooking}
              disabled={bookingDisabled}
              className={`w-full py-3 rounded-xl text-white font-bold text-base transition-all
                ${bookingDisabled
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
                }`}
            >
              {isSubmitting
                ? "Submitting…"
                : !isLoggedIn
                  ? "Login to Book"
                  : !isAvailable
                    ? "Not Available"
                    : !termsAccepted && timeDiff.isValid
                      ? "Accept Terms to Continue"
                      : "Book Now"}
            </button>

            {/* Info note */}
            <p className="text-xs text-gray-400 text-center">
              Your booking will be sent to the driver for confirmation.
              No payment is collected until confirmed.
            </p>
          </div>
        </div>
      </div>

      {/* ── TERMS MODAL ── */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Terms & Conditions</h2>
              <button onClick={() => setShowTerms(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-gray-600 space-y-4">
              <div>
                <h3 className="font-bold text-gray-800 mb-1">1. Rental Agreement</h3>
                <p>By booking, you agree to use the vehicle responsibly and return it on time.</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">2. Cancellation Policy</h3>
                <p>Cancellations more than 24 hours before start time are fully refundable. Within 24 hours are non-refundable.</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">3. Damage Responsibility</h3>
                <p>The renter is responsible for any damage during the rental period.</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">4. Vehicle Use</h3>
                <p>The vehicle must be used in accordance with all traffic laws. No smoking or pets allowed.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => { setTermsAccepted(true); setShowTerms(false); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      {notification.open && (
        <div className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-xl text-white text-sm font-semibold
          shadow-xl transition-all ${notification.severity === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default CarDetails;
