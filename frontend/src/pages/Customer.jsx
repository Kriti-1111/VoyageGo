import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";

const API = "http://localhost:5000";

const fmt = (d) => {
  try {
    return format(parseISO(d), "MMM d, yyyy · h:mm a");
  } catch {
    return d || "—";
  }
};

const STATUS = {
  Pending: { bg: "#fffbeb", color: "#b45309", dot: "#f59e0b" },
  PENDING: { bg: "#fffbeb", color: "#b45309", dot: "#f59e0b" },
  Accepted: { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  CONFIRMED: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  Active: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  Completed: { bg: "#f8fafc", color: "#475569", dot: "#94a3b8" },
  COMPLETED: { bg: "#f8fafc", color: "#475569", dot: "#94a3b8" },
  Cancelled: { bg: "#fff1f2", color: "#be123c", dot: "#f43f5e" },
  CANCELLED: { bg: "#fff1f2", color: "#be123c", dot: "#f43f5e" },
};

function Badge({ status }) {
  const s = STATUS[status] || STATUS.Pending;
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        background: s.bg,
        color: s.color,
        padding: "4px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: s.dot,
        }}
      />
      {label}
    </span>
  );
}

function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          border: "3px solid #e2e8f0",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>Loading…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Customer() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("browse");
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadV, setLoadV] = useState(true);
  const [loadB, setLoadB] = useState(true);
  const [loadD, setLoadD] = useState(true);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    loadVehicles();
    loadBookings();
    loadDrivers();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoadV(true);
      const { data } = await axios.get(`${API}/api/vehicles`);
      setVehicles(Array.isArray(data) ? data.filter((v) => v.isActive) : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadV(false);
    }
  };

  const loadBookings = async () => {
    try {
      setLoadB(true);
      const { data } = await axios.get(`${API}/api/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadB(false);
    }
  };

  const loadDrivers = async () => {
    try {
      setLoadD(true);
      const { data } = await axios.get(`${API}/api/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Only show verified drivers to customers
      setDrivers(
        Array.isArray(data) ? data.filter((d) => d.isDriverVerified) : [],
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoadD(false);
    }
  };

  const filtered = vehicles.filter((v) =>
    [v.name, v.type, v.company, v.model].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase()),
    ),
  );
  const activeBookings = bookings.filter((b) =>
    ["Pending", "PENDING", "Accepted", "CONFIRMED", "Active"].includes(
      b.status,
    ),
  );

  return (
    <div
      style={{
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        background: "#f8fafc",
        minHeight: "100%",
      }}
    >
      {/* Hero */}
      <div
        style={{
          background:
            "linear-gradient(135deg,#0f172a 0%,#1e1b4b 55%,#3730a3 100%)",
          padding: "52px 32px 72px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "rgba(99,102,241,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "30%",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: "rgba(139,92,246,0.1)",
          }}
        />
        <div
          style={{ maxWidth: "1100px", margin: "0 auto", position: "relative" }}
        >
          <p
            style={{
              color: "#a5b4fc",
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              margin: "0 0 8px",
            }}
          >
            Customer Portal
          </p>
          <h1
            style={{
              color: "#fff",
              fontSize: "34px",
              fontWeight: "800",
              margin: "0 0 6px",
              letterSpacing: "-0.5px",
            }}
          >
            Find Your Perfect Ride
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "15px", margin: "0 0 32px" }}>
            Browse vehicles, hire drivers, and manage your trips in one place
          </p>
          {/* Stats pills */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "28px",
            }}
          >
            {[
              {
                label: "Available Vehicles",
                value: vehicles.length,
                color: "#a5b4fc",
              },
              {
                label: "Available Drivers",
                value: drivers.length,
                color: "#c4b5fd",
              },
              {
                label: "Active Bookings",
                value: activeBookings.length,
                color: "#86efac",
              },
              {
                label: "Total Trips",
                value: bookings.length,
                color: "#fde68a",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "12px",
                  padding: "12px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: "800",
                    color: s.color,
                  }}
                >
                  {s.value}
                </span>
                <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          {/* Search */}
          <div style={{ display: "flex", gap: "10px", maxWidth: "500px" }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "12px",
                padding: "12px 16px",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setTab("browse");
                }}
                placeholder="Search by name, type, model…"
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: "14px",
                  width: "100%",
                }}
              />
            </div>
            <button
              onClick={() => setTab("browse")}
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #f1f5f9",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 32px",
            display: "flex",
          }}
        >
          {[
            { key: "browse", label: "Browse Vehicles", count: filtered.length },
            { key: "drivers", label: "Hire a Driver", count: drivers.length },
            { key: "bookings", label: "My Bookings", count: bookings.length },
          ].map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "16px 20px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: active ? "700" : "500",
                  color: active ? "#6366f1" : "#64748b",
                  borderBottom: active
                    ? "2px solid #6366f1"
                    : "2px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.15s",
                }}
              >
                {t.label}
                {t.count > 0 && (
                  <span
                    style={{
                      background: active ? "#eef2ff" : "#f1f5f9",
                      color: active ? "#6366f1" : "#64748b",
                      borderRadius: "20px",
                      padding: "2px 8px",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px" }}>
        {tab === "browse" && (
          <BrowseTab vehicles={filtered} loading={loadV} navigate={navigate} />
        )}
        {tab === "drivers" && <DriversTab drivers={drivers} loading={loadD} />}
        {tab === "bookings" && (
          <BookingsTab bookings={bookings} loading={loadB} setTab={setTab} />
        )}
      </div>
    </div>
  );
}

// ─── Browse Tab ───────────────────────────────────────────────────────────────
function BrowseTab({ vehicles, loading, navigate }) {
  if (loading) return <Spinner />;
  if (!vehicles.length)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px 24px",
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #f1f5f9",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🚗</div>
        <p style={{ color: "#475569", fontWeight: "600", margin: 0 }}>
          No vehicles available
        </p>
        <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "6px" }}>
          Check back later for new listings
        </p>
      </div>
    );
  return (
    <div>
      <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
        {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} available
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
          gap: "20px",
        }}
      >
        {vehicles.map((v) => (
          <VehicleCard key={v._id || v.id} v={v} navigate={navigate} />
        ))}
      </div>
    </div>
  );
}

function VehicleCard({ v, navigate }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid #f1f5f9",
        overflow: "hidden",
        transition: "transform 0.2s,box-shadow 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div
        style={{
          height: "180px",
          background: "linear-gradient(135deg,#e0e7ff,#f5f3ff)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {v.imageUrl ? (
          <img
            src={`${API}/${v.imageUrl}`}
            alt={v.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => (e.target.style.display = "none")}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "56px",
            }}
          >
            🚗
          </div>
        )}
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "700",
            boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
          }}
        >
          Rs {v.pricePerHour}/hr
        </div>
      </div>
      <div style={{ padding: "18px" }}>
        <h3
          style={{
            fontSize: "15px",
            fontWeight: "700",
            color: "#0f172a",
            margin: "0 0 3px",
          }}
        >
          {v.name}
        </h3>
        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 14px" }}>
          {v.type}
          {v.model ? ` · ${v.model}` : ""}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "7px",
            marginBottom: "14px",
          }}
        >
          {[
            { icon: "👥", label: `${v.passengerSeat || 4} seats` },
            { icon: "⛽", label: v.fuelType || "Petrol" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#f8fafc",
                padding: "7px 10px",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#64748b",
                fontWeight: "500",
              }}
            >
              <span>{icon}</span>
              {label}
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate(`/vehicles/${v._id || v.id}`)}
          style={{
            width: "100%",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "10px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          View Details & Book
        </button>
      </div>
    </div>
  );
}

// ─── Drivers Tab ──────────────────────────────────────────────────────────────
function DriversTab({ drivers, loading }) {
  const [search, setSearch] = useState("");

  const filtered = drivers.filter((d) =>
    [d.name, ...(d.languages || []), ...(d.vehicleSpecialization || [])].some(
      (f) => f?.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  if (loading) return <Spinner />;

  return (
    <div>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
          {drivers.length} verified driver{drivers.length !== 1 ? "s" : ""}{" "}
          available
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "9px 14px",
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, language, specialization…"
            style={{
              border: "none",
              outline: "none",
              fontSize: "13px",
              color: "#0f172a",
              width: "240px",
              background: "transparent",
            }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 24px",
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #f1f5f9",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🧑‍✈️</div>
          <p style={{ color: "#475569", fontWeight: "600", margin: 0 }}>
            {search
              ? "No drivers match your search"
              : "No verified drivers available"}
          </p>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "6px" }}>
            {search
              ? "Try a different keyword."
              : "Check back soon — drivers are being verified."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
            gap: "20px",
          }}
        >
          {filtered.map((d) => (
            <DriverCard key={d._id || d.id} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function DriverCard({ d }) {
  const initials = (d.name || "D")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const langs = d.languages?.length ? d.languages.join(", ") : "—";
  const specs = d.vehicleSpecialization?.length
    ? d.vehicleSpecialization.join(", ")
    : "General";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid #f1f5f9",
        overflow: "hidden",
        transition: "transform 0.2s,box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      {/* Card top accent */}
      <div
        style={{
          height: "6px",
          background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
        }}
      />

      <div style={{ padding: "20px" }}>
        {/* Avatar + name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "18px",
              fontWeight: "800",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: "700",
                color: "#0f172a",
                margin: "0 0 2px",
              }}
            >
              {d.name}
            </h3>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "#f0fdf4",
                color: "#15803d",
                fontSize: "11px",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "20px",
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#22c55e",
                }}
              />
              Verified Driver
            </span>
          </div>
          {/* Availability dot */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: d.isAvailable ? "#22c55e" : "#94a3b8",
                margin: "0 auto 3px",
              }}
            />
            <p
              style={{
                fontSize: "10px",
                color: d.isAvailable ? "#15803d" : "#94a3b8",
                fontWeight: "600",
                margin: 0,
              }}
            >
              {d.isAvailable ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Info grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          {[
            { icon: "🌐", label: "Languages", value: langs },
            { icon: "🚗", label: "Specialization", value: specs },
            { icon: "📱", label: "Contact", value: d.phone || "—" },
            {
              icon: "📧",
              label: "Email",
              value: d.email ? d.email.split("@")[0] + "…" : "—",
            },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              style={{
                background: "#f8fafc",
                borderRadius: "8px",
                padding: "9px 11px",
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  color: "#94a3b8",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  margin: "0 0 2px",
                }}
              >
                {icon} {label}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#334155",
                  fontWeight: "500",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Shift hours if set */}
        {(d.shiftStart || d.shiftEnd) && (
          <div
            style={{
              background: "#f8fafc",
              borderRadius: "8px",
              padding: "9px 11px",
              marginBottom: "14px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                color: "#94a3b8",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                margin: "0 0 2px",
              }}
            >
              ⏰ Shift Hours
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "#334155",
                fontWeight: "500",
                margin: 0,
              }}
            >
              {d.shiftStart || "—"} → {d.shiftEnd || "—"}
            </p>
          </div>
        )}

        <div
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            textAlign: "center",
            padding: "8px 0 2px",
          }}
        >
          Add this driver when booking a vehicle
        </div>
      </div>
    </div>
  );
}

// ─── Bookings Tab ─────────────────────────────────────────────────────────────
function BookingsTab({ bookings, loading, setTab }) {
  if (loading) return <Spinner />;
  if (!bookings.length)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px 24px",
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #f1f5f9",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
        <p style={{ color: "#475569", fontWeight: "600", margin: 0 }}>
          No bookings yet
        </p>
        <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "6px" }}>
          Start exploring vehicles and make your first booking!
        </p>
        <button
          onClick={() => setTab("browse")}
          style={{
            marginTop: "20px",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Browse Vehicles
        </button>
      </div>
    );
  return (
    <div>
      <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
        {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {bookings.map((b) => (
          <BookingCard key={b._id || b.id} b={b} />
        ))}
      </div>
    </div>
  );
}

function BookingCard({ b }) {
  const status = b.status || "Pending";
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "14px",
        border: "1px solid #f1f5f9",
        padding: "20px",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "10px",
              background: "linear-gradient(135deg,#e0e7ff,#f5f3ff)",
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            {b.vehicle?.imageUrl ? (
              <img
                src={`${API}/${b.vehicle.imageUrl}`}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              "🚗"
            )}
          </div>
          <div>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: "700",
                color: "#0f172a",
                margin: "0 0 2px",
              }}
            >
              {b.vehicle?.name || "Vehicle"}
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
              {b.vehicle?.type}
              {b.vehicle?.plateNumber ? ` · ${b.vehicle.plateNumber}` : ""}
            </p>
            {b.driver && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#6366f1",
                  margin: "3px 0 0",
                  fontWeight: "600",
                }}
              >
                🧑‍✈️ Driver: {b.driver.name}
              </p>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "6px",
          }}
        >
          <Badge status={status} />
          <p
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "#0f172a",
              margin: 0,
            }}
          >
            Rs {(b.totalPrice || 0).toLocaleString()}
          </p>
        </div>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
      >
        {[
          { label: "Pickup", value: fmt(b.startDate) },
          { label: "Return", value: fmt(b.endDate) },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              background: "#f8fafc",
              borderRadius: "8px",
              padding: "10px 12px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                color: "#94a3b8",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                margin: "0 0 2px",
              }}
            >
              {label}
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "#334155",
                fontWeight: "500",
                margin: 0,
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
      {(status === "Pending" || status === "PENDING") && (
        <div
          style={{
            marginTop: "12px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "13px",
            color: "#92400e",
          }}
        >
          ⏳ Awaiting driver confirmation
        </div>
      )}
      {(status === "Accepted" || status === "CONFIRMED") && (
        <div
          style={{
            marginTop: "12px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "13px",
            color: "#1e40af",
          }}
        >
          ✅ Confirmed — driver will contact you before pickup
        </div>
      )}
    </div>
  );
}
