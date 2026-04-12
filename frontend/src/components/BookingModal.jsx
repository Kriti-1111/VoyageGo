import { useState, useEffect } from "react";
import { toast } from "react-toastify";

const TYPE_EMOJI = { Car: "🚗", Van: "🚐", Bus: "🚌", Truck: "🚚" };
const API = "http://localhost:5000";

export default function BookingModal({ vehicle, onClose, onSuccess }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Driver picker state
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null); // full driver object or null
  const [showDriverList, setShowDriverList] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch full user to get document status
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setCurrentUser(data))
      .catch((e) => console.error("Failed to fetch user", e));
  }, []);

  // Lock background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Fetch verified, available drivers when the picker is opened
  useEffect(() => {
    if (!showDriverList) return;
    const token = localStorage.getItem("token");
    setLoadingDrivers(true);
    fetch(`${API}/api/drivers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data.filter((d) => d.isDriverVerified)
          : [];
        setDrivers(list);
      })
      .catch(() => toast.error("Could not load drivers."))
      .finally(() => setLoadingDrivers(false));
  }, [showDriverList]);

  // ── Pricing ──────────────────────────────────────────────────────────────────
  const totalPrice = (() => {
    if (!startDate || !endDate) return null;
    const diffMs = new Date(endDate) - new Date(startDate);
    if (diffMs <= 0) return null;
    const hours = diffMs / (1000 * 60 * 60);
    return Math.ceil(hours * vehicle.pricePerHour);
  })();

  const durationLabel = (() => {
    if (!startDate || !endDate) return null;
    const diffMs = new Date(endDate) - new Date(startDate);
    if (diffMs <= 0) return null;
    const hours = diffMs / (1000 * 60 * 60);
    return hours < 24
      ? `${hours.toFixed(1)} hrs`
      : `${(hours / 24).toFixed(1)} days`;
  })();

  const filteredDrivers = drivers.filter((d) =>
    [d.name, ...(d.languages || []), ...(d.vehicleSpecialization || [])].some(
      (f) => f?.toLowerCase().includes(driverSearch.toLowerCase()),
    ),
  );

  // ── Submit ────────────────────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!startDate || !endDate) {
      toast.error("Please select start and end date/time.");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("End date must be after start date.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const body = {
        vehicleId: vehicle._id || vehicle.id,
        startDate,
        endDate,
        totalPrice,
        notes,
      };
      // Only send driverId if the customer explicitly picked one
      if (selectedDriver) {
        body.driverId = selectedDriver._id || selectedDriver.id;
      }

      const res = await fetch(`${API}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Booking failed.");
        return;
      }

      toast.success(
        selectedDriver
          ? `Booking created with driver ${selectedDriver.name}!`
          : "Booking created successfully!",
      );
      onSuccess?.(data);
      onClose();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isValid = startDate && endDate && totalPrice !== null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "28px 28px 24px",
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 22,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 4,
              }}
            >
              Confirm booking
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
              {vehicle.name}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
              {vehicle.type} · {vehicle.fuelType} · {vehicle.passengerSeat}{" "}
              seats
            </div>
          </div>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              flexShrink: 0,
              background: vehicle.imageUrl ? "transparent" : "#f1f5f9",
              border: "1px solid #e8edf3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              overflow: "hidden",
            }}
          >
            {vehicle.imageUrl ? (
              <img
                src={vehicle.imageUrl}
                alt={vehicle.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              TYPE_EMOJI[vehicle.type] || "🚗"
            )}
          </div>
        </div>

        {/* ── Date pickers ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 14,
          }}
        >
          {[
            {
              label: "Start",
              value: startDate,
              onChange: setStartDate,
              min: new Date().toISOString().slice(0, 16),
            },
            {
              label: "End",
              value: endDate,
              onChange: setEndDate,
              min: startDate || new Date().toISOString().slice(0, 16),
            },
          ].map(({ label, value, onChange, min }) => (
            <div key={label}>
              <label
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                {label}
              </label>
              <input
                type="datetime-local"
                value={value}
                min={min}
                onChange={(e) => onChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 10,
                  border: "1px solid #dde3ec",
                  fontSize: 13,
                  color: "#0f172a",
                  outline: "none",
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Driver section ── */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              fontSize: 12,
              color: "#64748b",
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Driver (optional)
          </label>

          {/* Selected driver pill OR add button */}
          {selectedDriver ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {(selectedDriver.name || "D")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  {selectedDriver.name}
                </p>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
                  {selectedDriver.languages?.join(", ") || ""}
                  {selectedDriver.vehicleSpecialization?.length
                    ? ` · ${selectedDriver.vehicleSpecialization.join(", ")}`
                    : ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setShowDriverList(true)}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6366f1",
                    background: "#eef2ff",
                    border: "1px solid #c7d2fe",
                    borderRadius: 7,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  Change
                </button>
                <button
                  onClick={() => setSelectedDriver(null)}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#dc2626",
                    background: "#fff1f2",
                    border: "1px solid #fca5a5",
                    borderRadius: 7,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDriverList(true)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1.5px dashed #c7d2fe",
                background: "#f8faff",
                color: "#6366f1",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#eef2ff";
                e.currentTarget.style.borderColor = "#6366f1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f8faff";
                e.currentTarget.style.borderColor = "#c7d2fe";
              }}
            >
              🧑‍✈️ Add a Driver to this booking
            </button>
          )}
        </div>

        {/* ── Driver list overlay ── */}
        {showDriverList && (
          <div
            style={{
              marginBottom: 14,
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
              background: "#fff",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            {/* Search bar */}
            <div
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                placeholder="Search drivers…"
                autoFocus
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "#0f172a",
                  background: "transparent",
                }}
              />
              <button
                onClick={() => {
                  setShowDriverList(false);
                  setDriverSearch("");
                }}
                style={{
                  fontSize: 18,
                  lineHeight: 1,
                  color: "#94a3b8",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 2px",
                }}
              >
                ×
              </button>
            </div>

            {/* Driver rows */}
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              {loadingDrivers ? (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  Loading drivers…
                </div>
              ) : filteredDrivers.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center" }}>
                  <p
                    style={{
                      color: "#64748b",
                      fontWeight: 600,
                      margin: 0,
                      fontSize: 13,
                    }}
                  >
                    {driverSearch
                      ? "No drivers match your search"
                      : "No verified drivers available"}
                  </p>
                  <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                    Only verified drivers are shown
                  </p>
                </div>
              ) : (
                filteredDrivers.map((d) => (
                  <div
                    key={d._id || d.id}
                    onClick={() => {
                      setSelectedDriver(d);
                      setShowDriverList(false);
                      setDriverSearch("");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 14px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f8fafc",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f8fafc")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {(d.name || "D")[0].toUpperCase()}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f172a",
                          margin: 0,
                        }}
                      >
                        {d.name}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          margin: "1px 0 0",
                        }}
                      >
                        {d.languages?.length ? d.languages.join(", ") : ""}
                        {d.vehicleSpecialization?.length
                          ? ` · ${d.vehicleSpecialization.join(", ")}`
                          : ""}
                      </p>
                    </div>
                    {/* Availability badge */}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: d.isAvailable ? "#f0fdf4" : "#f1f5f9",
                        color: d.isAvailable ? "#15803d" : "#64748b",
                        flexShrink: 0,
                      }}
                    >
                      {d.isAvailable ? "Online" : "Offline"}
                    </span>
                    {/* Select cue */}
                    <span
                      style={{
                        fontSize: 11,
                        color: "#6366f1",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      Select →
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Book without driver option */}
            <div
              style={{
                padding: "9px 14px",
                borderTop: "1px solid #f1f5f9",
                background: "#fafafa",
              }}
            >
              <button
                onClick={() => {
                  setSelectedDriver(null);
                  setShowDriverList(false);
                  setDriverSearch("");
                }}
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Continue without a driver →
              </button>
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              fontSize: 12,
              color: "#64748b",
              display: "block",
              marginBottom: 4,
              fontWeight: 600,
            }}
          >
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions…"
            rows={2}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 10,
              border: "1px solid #dde3ec",
              fontSize: 13,
              color: "#0f172a",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              background: "#fff",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* ── Price summary ── */}
        {totalPrice !== null && (
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 18,
              border: "1px solid #e8edf3",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#64748b",
                marginBottom: 4,
              }}
            >
              <span>
                Rs. {vehicle.pricePerHour}/hr × {durationLabel}
              </span>
              <span>Rs. {totalPrice.toLocaleString()}</span>
            </div>
            {selectedDriver && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "#64748b",
                  marginBottom: 4,
                }}
              >
                <span>🧑‍✈️ Driver: {selectedDriver.name}</span>
                <span style={{ color: "#10b981", fontWeight: 600 }}>
                  Included
                </span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 14,
                fontWeight: 700,
                color: "#0f172a",
                borderTop: "1px solid #e8edf3",
                paddingTop: 8,
                marginTop: 4,
              }}
            >
              <span>Total</span>
              <span>Rs. {totalPrice.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* ── Booking type indicator ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 20,
              background: selectedDriver ? "#eef2ff" : "#f1f5f9",
              color: selectedDriver ? "#6366f1" : "#64748b",
              border: `1px solid ${selectedDriver ? "#c7d2fe" : "#e2e8f0"}`,
            }}
          >
            {selectedDriver ? `🧑‍✈️ With driver` : "🚗 Vehicle only"}
          </span>
        </div>

        {/* ── Identity Verification Warning ── */}
        {currentUser &&
          (currentUser.documents?.status === "NotSubmitted" ||
            currentUser.documents?.status === "Rejected") && (
            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 16,
                display: "flex",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#b45309",
                  }}
                >
                  Your identity is not yet verified.
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#d97706" }}>
                  Your booking will be held until verification is complete.
                </p>
              </div>
            </div>
          )}

        {/* ── Actions ── */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#334155",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || !isValid}
            style={{
              flex: 2,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              background:
                submitting || !isValid
                  ? "#c7d2fe"
                  : "linear-gradient(135deg,#6366f1,#8b5cf6)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: submitting || !isValid ? "not-allowed" : "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => {
              if (isValid && !submitting)
                e.currentTarget.style.opacity = "0.88";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            {submitting
              ? "Booking…"
              : selectedDriver
                ? `Confirm with ${selectedDriver.name}`
                : "Confirm booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
