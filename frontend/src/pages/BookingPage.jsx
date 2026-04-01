import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}
function getToken() {
  return localStorage.getItem("token");
}

// ── Pricing mirrors server exactly ────────────────────────────────────────────
// mode: "hourly" | "daily"
// Uses Math.ceil for hours and days — matches server
function calcPrice(
  pricePerHour,
  startDate,
  endDate,
  driverRatePerHour = 0,
  mode = "hourly",
) {
  if (!startDate || !endDate) return null;
  const diffMs = new Date(endDate) - new Date(startDate);
  const rawHours = diffMs / (1000 * 60 * 60);
  const totalHours = Math.ceil(rawHours);
  const totalDays = Math.ceil(totalHours / 24);

  if (rawHours < 1 || rawHours > 30 * 24) return null;

  const dailyBase = pricePerHour * 24;
  const vehicleDailyRate = totalDays <= 6 ? dailyBase * 0.8 : dailyBase * 0.7;
  const driverDailyRate = driverRatePerHour * 8;

  let vehicleCost = 0;
  let driverCost = 0;

  if (mode === "hourly") {
    vehicleCost = Math.round(totalHours * pricePerHour);
    driverCost =
      driverRatePerHour > 0 ? Math.round(totalHours * driverRatePerHour) : 0;
  } else {
    vehicleCost = Math.round(totalDays * vehicleDailyRate);
    driverCost =
      driverRatePerHour > 0 ? Math.round(totalDays * driverDailyRate) : 0;
  }

  return {
    vehicleCost,
    driverCost,
    total: vehicleCost + driverCost,
    vehicleDailyRate: Math.round(vehicleDailyRate),
    driverDailyRate: Math.round(driverDailyRate),
    totalHours,
    totalDays,
    mode,
    discount: mode === "daily" ? (totalDays <= 6 ? 20 : 30) : 0,
  };
}

function fmtHours(h) {
  const hrs = Math.floor(h);
  const m = Math.round((h - hrs) * 60);
  return m ? `${hrs}h ${m}m` : `${hrs}h`;
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function minNow() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 1);
  return d.toISOString().slice(0, 16);
}
function addDays(s, n) {
  if (!s) return "";
  const d = new Date(s);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── Driver popup ──────────────────────────────────────────────────────────────
function DriverPopup({ vehicleId, startDate, endDate, onSelect, onClose }) {
  const [drivers, setDrivers] = useState([]);
  const [slots, setSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    if (!vehicleId) return;
    setLoading(true);
    axios
      .get(`${API}/api/vehicles/${vehicleId}`)
      .then(async ({ data }) => {
        const driverList = data.drivers || [];
        setDrivers(driverList);
        const slotMap = {};
        await Promise.all(
          driverList.map(async (d) => {
            const id = d._id || d.id;
            try {
              const { data: s } = await axios.get(
                `${API}/api/drivers/${id}/availability`,
              );
              slotMap[id] = s;
            } catch {
              slotMap[id] = [];
            }
          }),
        );
        setSlots(slotMap);
      })
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  function isConflict(driverId) {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return (slots[driverId] || []).some(
      (s) => new Date(s.start) < end && new Date(s.end) > start,
    );
  }

  const filtered = drivers.filter(
    (d) =>
      !search || (d.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        left: 0,
        right: 0,
        zIndex: 200,
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        overflow: "hidden",
      }}
    >
      {/* Search */}
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search drivers…"
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
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: 18,
            color: "#94a3b8",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          &times;
        </button>
      </div>

      {/* List */}
      <div style={{ maxHeight: 260, overflowY: "auto" }}>
        {loading && (
          <p
            style={{
              padding: 20,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 13,
              margin: 0,
            }}
          >
            Loading drivers…
          </p>
        )}
        {!loading && filtered.length === 0 && (
          <p
            style={{
              padding: 20,
              textAlign: "center",
              color: "#64748b",
              fontSize: 13,
              margin: 0,
            }}
          >
            {drivers.length === 0
              ? "No drivers assigned to this vehicle."
              : "No match."}
          </p>
        )}
        {!loading &&
          filtered.map((d) => {
            const id = d._id || d.id;
            const conflict = isConflict(id);
            const rate = d.driverRatePerHour || 0;
            return (
              <div
                key={id}
                onClick={() => {
                  if (!conflict) {
                    onSelect(d);
                    onClose();
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  cursor: conflict ? "default" : "pointer",
                  borderBottom: "1px solid #f8fafc",
                  opacity: conflict ? 0.5 : 1,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!conflict) e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: conflict
                      ? "#e2e8f0"
                      : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: conflict ? "#94a3b8" : "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {(d.name || "D")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {d.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                    {conflict
                      ? "Not available for this time"
                      : d.isAvailable
                        ? "Available"
                        : "Offline"}
                    {rate > 0 && !conflict && ` · Rs ${rate}/hr`}
                  </p>
                </div>
                {!conflict && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#6366f1",
                      background: "#eef2ff",
                      border: "1px solid #c7d2fe",
                      padding: "3px 9px",
                      borderRadius: 20,
                      flexShrink: 0,
                    }}
                  >
                    Select
                  </span>
                )}
              </div>
            );
          })}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "10px 14px",
          borderTop: "1px solid #f1f5f9",
          background: "#fafafa",
        }}
      >
        <button
          onClick={() => {
            onSelect(null);
            onClose();
          }}
          style={{
            fontSize: 12,
            color: "#64748b",
            fontWeight: 600,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Continue without a driver
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BookingPage() {
  const { carId } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [vehicle, setVehicle] = useState(null);
  const [loadingV, setLoadingV] = useState(true);
  const [vehicleErr, setVehicleErr] = useState(null);

  const [mode, setMode] = useState("hourly");
  const [startDT, setStartDT] = useState("");
  const [endDT, setEndDT] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [numDays, setNumDays] = useState(1);
  const [driver, setDriver] = useState(null);
  const [showPop, setShowPop] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/api/vehicles/${carId}`)
      .then(({ data }) => setVehicle(data))
      .catch((err) =>
        setVehicleErr(err.response?.data?.message || "Failed to load vehicle."),
      )
      .finally(() => setLoadingV(false));
  }, [carId]);

  const dailyEndDate = startDate ? addDays(startDate, numDays) : "";

  const driverRate = driver?.driverRatePerHour || 0;

  const pricing = (() => {
    if (!vehicle) return null;
    if (mode === "hourly") {
      if (!startDT || !endDT) return null;
      return calcPrice(
        vehicle.pricePerHour,
        startDT,
        endDT,
        driverRate,
        "hourly",
      );
    }
    if (!startDate) return null;
    return calcPrice(
      vehicle.pricePerHour,
      startDate,
      dailyEndDate,
      driverRate,
      "daily",
    );
  })();

  const validationError = (() => {
    if (!vehicle?.isActive) return "This vehicle is currently unavailable.";
    if (mode === "hourly") {
      if (!startDT || !endDT) return null;
      const hrs = (new Date(endDT) - new Date(startDT)) / (1000 * 60 * 60);
      if (hrs < 1) return "Minimum booking is 1 hour.";
      if (hrs > 23)
        return "Hourly bookings max 23 hours. Switch to Daily for longer.";
    } else {
      if (numDays < 1) return "Minimum 1 day.";
      if (numDays > 30) return "Maximum 30 days.";
    }
    return null;
  })();

  const canSubmit = pricing && !validationError && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    const startISO =
      mode === "hourly"
        ? new Date(startDT).toISOString()
        : new Date(startDate).toISOString();
    const endISO =
      mode === "hourly"
        ? new Date(endDT).toISOString()
        : new Date(dailyEndDate).toISOString();
    const body = {
      vehicleId: carId,
      startDate: startISO,
      endDate: endISO,
      notes,
      mode,
    };
    if (driver) body.driverId = driver._id || driver.id;
    try {
      setSubmitting(true);
      await axios.post(`${API}/api/bookings`, body, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      showToast("Booking submitted!", "success");
      setTimeout(() => navigate("/customer"), 1800);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Booking failed. Try again.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function showToast(msg, type) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  if (loadingV)
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#64748b", fontFamily: "DM Sans,system-ui" }}>
          Loading vehicle…
        </p>
      </div>
    );

  if (vehicleErr)
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: 12,
            padding: "20px 28px",
            color: "#dc2626",
          }}
        >
          {vehicleErr}
        </div>
      </div>
    );

  const durationLabel = (() => {
    if (mode === "hourly" && startDT && endDT) {
      const hrs = (new Date(endDT) - new Date(startDT)) / (1000 * 60 * 60);
      if (hrs >= 1 && hrs <= 23) return `Duration: ${fmtHours(hrs)}`;
    }
    if (mode === "daily" && startDate) {
      return `${new Date(startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} → ${new Date(dailyEndDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return null;
  })();

  return (
    <>
      <style>{`* { box-sizing: border-box; } @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }`}</style>
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "32px 20px 60px",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        }}
      >
        <button onClick={() => navigate(-1)} style={backBtn}>
          Back
        </button>

        <h1
          style={{
            margin: "0 0 4px",
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          Book a vehicle
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "#64748b" }}>
          {vehicle.name} · {vehicle.type} · {vehicle.company}
        </p>

        {!vehicle.isActive && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 10,
              padding: "12px 16px",
              color: "#dc2626",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            This vehicle is currently unavailable.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Rental type toggle */}
          <div>
            <label style={lbl}>Rental type</label>
            <div
              style={{
                display: "flex",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                width: "fit-content",
              }}
            >
              {[
                {
                  key: "hourly",
                  text: "Hourly",
                  sub: "1–23 hrs · standard rate",
                },
                {
                  key: "daily",
                  text: "Daily / Weekly",
                  sub: "1–30 days · up to 30% off",
                },
              ].map(({ key, text, sub }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  style={{
                    padding: "10px 24px",
                    border: "none",
                    cursor: "pointer",
                    background: mode === key ? "#6366f1" : "#fff",
                    color: mode === key ? "#fff" : "#64748b",
                    fontSize: 13,
                    fontWeight: 600,
                    transition: "all 0.15s",
                    borderRight:
                      key === "hourly" ? "1px solid #e2e8f0" : "none",
                  }}
                >
                  <div>{text}</div>
                  <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.75 }}>
                    {sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date/time inputs */}
          {mode === "hourly" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label style={lbl}>Start date &amp; time</label>
                <input
                  type="datetime-local"
                  value={startDT}
                  min={minNow()}
                  onChange={(e) => {
                    setStartDT(e.target.value);
                    if (endDT && new Date(endDT) <= new Date(e.target.value))
                      setEndDT("");
                  }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={lbl}>End date &amp; time</label>
                <input
                  type="datetime-local"
                  value={endDT}
                  min={startDT || minNow()}
                  disabled={!startDT}
                  onChange={(e) => setEndDT(e.target.value)}
                  style={{
                    ...inputStyle,
                    background: !startDT ? "#f8fafc" : "#fff",
                    cursor: !startDT ? "not-allowed" : "auto",
                  }}
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                alignItems: "end",
              }}
            >
              <div>
                <label style={lbl}>Start date</label>
                <input
                  type="date"
                  value={startDate}
                  min={todayStr()}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={lbl}>Number of days</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => setNumDays((d) => Math.max(1, d - 1))}
                    style={dayBtn}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={numDays}
                    min={1}
                    max={30}
                    onChange={(e) =>
                      setNumDays(
                        Math.min(
                          30,
                          Math.max(1, parseInt(e.target.value) || 1),
                        ),
                      )
                    }
                    style={{
                      ...inputStyle,
                      width: 64,
                      textAlign: "center",
                      padding: "10px 6px",
                    }}
                  />
                  <button
                    onClick={() => setNumDays((d) => Math.min(30, d + 1))}
                    style={dayBtn}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Duration label */}
          {durationLabel && !validationError && (
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                color: "#334155",
                border: "1px solid #e2e8f0",
                marginTop: -8,
              }}
            >
              {durationLabel}
            </div>
          )}

          {/* Validation error */}
          {validationError && (startDT || endDT || mode === "daily") && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                color: "#dc2626",
                marginTop: -8,
              }}
            >
              {validationError}
            </div>
          )}

          {/* Driver section */}
          <div>
            <label style={lbl}>
              Driver{" "}
              <span style={{ fontWeight: 400, color: "#94a3b8" }}>
                (optional)
              </span>
            </label>
            <div style={{ position: "relative" }}>
              {driver ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #86efac",
                    background: "#f0fdf4",
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
                    {(driver.name || "D")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {driver.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                      Driver requested
                      {driver.driverRatePerHour > 0 &&
                        ` · Rs ${driver.driverRatePerHour}/hr`}
                    </p>
                  </div>
                  <button
                    onClick={() => setDriver(null)}
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
              ) : (
                <button
                  onClick={() => setShowPop((p) => !p)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    cursor: "pointer",
                    border: "1.5px dashed #c7d2fe",
                    background: "#f8faff",
                    color: "#6366f1",
                    fontSize: 13,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
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
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                    <line x1="12" y1="14" x2="12" y2="20" />
                    <line x1="9" y1="17" x2="15" y2="17" />
                  </svg>
                  Add a driver to this booking
                </button>
              )}

              {showPop && (
                <DriverPopup
                  vehicleId={carId}
                  startDate={mode === "hourly" ? startDT : startDate}
                  endDate={mode === "hourly" ? endDT : dailyEndDate}
                  onSelect={(d) => setDriver(d)}
                  onClose={() => setShowPop(false)}
                />
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={lbl}>
              Notes{" "}
              <span style={{ fontWeight: 400, color: "#94a3b8" }}>
                (optional)
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pickup details, special instructions…"
              rows={2}
              style={{ ...inputStyle, resize: "none", fontFamily: "inherit" }}
            />
          </div>

          {/* Price summary — shows breakdown */}
          {pricing && !validationError && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "16px 18px",
                animation: "fadeUp 0.2s ease",
              }}
            >
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Price summary
              </p>

              {/* Vehicle cost row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: "#64748b" }}>
                  Vehicle rental
                  {pricing.mode === "hourly"
                    ? ` (${pricing.totalHours}h × Rs ${vehicle.pricePerHour}/hr)`
                    : ` (${pricing.totalDays} day${pricing.totalDays > 1 ? "s" : ""} · ${pricing.discount}% off)`}
                </span>
                <span style={{ color: "#334155", fontWeight: 600 }}>
                  Rs {pricing.vehicleCost.toLocaleString()}
                </span>
              </div>

              {/* Driver cost row */}
              {driver && driverRate > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ color: "#64748b" }}>
                    Driver fee
                    {pricing.mode === "hourly"
                      ? ` (${pricing.totalHours}h × Rs ${driverRate}/hr)`
                      : ` (${pricing.totalDays} day${pricing.totalDays > 1 ? "s" : ""} × Rs ${pricing.driverDailyRate}/day)`}
                  </span>
                  <span style={{ color: "#334155", fontWeight: 600 }}>
                    Rs {pricing.driverCost.toLocaleString()}
                  </span>
                </div>
              )}

              {driver && driverRate === 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ color: "#64748b" }}>Driver fee</span>
                  <span style={{ color: "#16a34a", fontWeight: 600 }}>
                    Included
                  </span>
                </div>
              )}

              {/* Divider + total */}
              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  marginTop: 8,
                  paddingTop: 8,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}
                >
                  Total
                </span>
                <span
                  style={{ fontSize: 18, fontWeight: 800, color: "#6366f1" }}
                >
                  Rs {pricing.total.toLocaleString()}
                </span>
              </div>

              {pricing.driverCost > 0 && (
                <p
                  style={{ margin: "6px 0 0", fontSize: 11, color: "#94a3b8" }}
                >
                  Driver included · Late returns: Rs {vehicle.pricePerHour}/hr
                  (vehicle) + Rs {driverRate}/hr (driver)
                </p>
              )}
              {!driver && (
                <p
                  style={{ margin: "6px 0 0", fontSize: 11, color: "#94a3b8" }}
                >
                  No driver · Late returns charged at Rs {vehicle.pricePerHour}
                  /hr
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              border: "none",
              fontSize: 15,
              fontWeight: 700,
              cursor: canSubmit ? "pointer" : "not-allowed",
              background: canSubmit
                ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                : "#e2e8f0",
              color: canSubmit ? "#fff" : "#94a3b8",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => {
              if (canSubmit) e.currentTarget.style.opacity = "0.88";
            }}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {submitting
              ? "Submitting…"
              : !pricing
                ? "Fill in the details above"
                : driver
                  ? `Confirm booking with ${driver.name}`
                  : "Confirm booking"}
          </button>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: 12,
            background: toast.type === "success" ? "#059669" : "#dc2626",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            animation: "fadeUp 0.2s ease",
          }}
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}

const lbl = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#64748b",
  marginBottom: 6,
};
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #dde3ec",
  fontSize: 13,
  color: "#0f172a",
  outline: "none",
  background: "#fff",
};
const backBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#334155",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  marginBottom: 24,
};
const dayBtn = {
  width: 36,
  height: 36,
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#334155",
  fontSize: 18,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
