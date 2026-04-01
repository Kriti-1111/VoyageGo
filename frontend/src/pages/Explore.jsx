import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// ── fetch vehicles ─────────────────────────────────────────────────────────
function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/vehicles")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) =>
        setVehicles(Array.isArray(data) ? data : (data.vehicles ?? [])),
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { vehicles, loading, error };
}

// ── Vehicle card ───────────────────────────────────────────────────────────
// Default price display: per day (discounted daily rate = pricePerHour * 24 * 0.85)
// Hourly price shown as secondary info.
function VehicleCard({ vehicle, user }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const typeColors = {
    Car: { bg: "#dbeafe", color: "#1d4ed8" },
    Van: { bg: "#ede9fe", color: "#6d28d9" },
    Bus: { bg: "#dcfce7", color: "#15803d" },
    Truck: { bg: "#fef9c3", color: "#a16207" },
  };
  const badge = typeColors[vehicle.type] || { bg: "#f1f5f9", color: "#64748b" };

  // Prices
  const pricePerDay = Math.round(vehicle.pricePerHour * 24 * 0.85); // 15% daily discount

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/car/${vehicle._id || vehicle.id}`)}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e8edf3",
        padding: "20px 22px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        transition: "box-shadow 0.2s, transform 0.2s",
        boxShadow: hovered
          ? "0 8px 28px rgba(15,23,42,0.10)"
          : "0 2px 8px rgba(15,23,42,0.04)",
        transform: hovered ? "translateY(-2px)" : "none",
        cursor: "pointer",
      }}
    >
      {/* Image or placeholder */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          flexShrink: 0,
          background: vehicle.imageUrl ? "transparent" : "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          border: vehicle.imageUrl ? "1px solid #e8edf3" : "none",
        }}
      >
        {vehicle.imageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={vehicle.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 22, color: "#cbd5e1" }}>—</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: "#0f172a",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {vehicle.name}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              background: badge.bg,
              color: badge.color,
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            {vehicle.type}
          </span>
        </div>

        <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>
          {vehicle.company} · {vehicle.model} · {vehicle.fuelType}
        </div>

        <div
          style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              background: "#f0fdf4",
              color: "#15803d",
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            {vehicle.passengerSeat} seats
          </span>
          {/* Daily price — prominent */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              background: "#eef2ff",
              color: "#4338ca",
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            Rs {pricePerDay.toLocaleString()} / day
          </span>
          {/* Hourly — secondary */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              background: "#fef3c7",
              color: "#b45309",
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            Rs {vehicle.pricePerHour} / hr
          </span>
          {vehicle.isActive !== undefined && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 20,
                background: vehicle.isActive ? "#dbeafe" : "#f1f5f9",
                color: vehicle.isActive ? "#1d4ed8" : "#94a3b8",
              }}
            >
              {vehicle.isActive ? "Available" : "Inactive"}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/car/${vehicle._id || vehicle.id}`);
        }}
        style={{
          padding: "9px 18px",
          borderRadius: 10,
          border: "none",
          background: user
            ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
            : "#f1f5f9",
          color: user ? "#fff" : "#94a3b8",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => {
          if (user) e.currentTarget.style.opacity = "0.88";
        }}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        {user ? "View & Book" : "Login to book"}
      </button>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e8edf3",
        padding: "20px 22px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: "#e2e8f0",
          animation: "pulse 1.4s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            height: 14,
            width: "45%",
            borderRadius: 6,
            background: "#e2e8f0",
            marginBottom: 8,
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 11,
            width: "70%",
            borderRadius: 6,
            background: "#e2e8f0",
            animation: "pulse 1.4s ease-in-out infinite 0.2s",
          }}
        />
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function Explore() {
  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  const { vehicles, loading, error } = useVehicles();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterActive, setFilterActive] = useState(false);

  const types = ["All", "Car", "Van", "Bus", "Truck"];

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      v.name?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.company?.toLowerCase().includes(q);
    const matchType = filterType === "All" || v.type === filterType;
    const matchActive = !filterActive || v.isActive;
    return matchSearch && matchType && matchActive;
  });

  const dashRoute = {
    OWNER: "/management",
    ADMIN: "/management",
    STAFF: "/management",
    DRIVER: "/driver",
    CUSTOMER: "/customer",
  };

  return (
    <>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} } * { box-sizing: border-box; }`}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
          padding: "40px 20px 80px",
        }}
      >
        {/* Header */}
        <div style={{ maxWidth: 700, margin: "0 auto 32px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.5px",
            }}
          >
            Find a Vehicle
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
            Browse vehicles available for rental · prices shown from daily rate
          </p>
        </div>

        {/* Search + available filter */}
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto 14px",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Search by name, model or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: "1 1 220px",
              padding: "11px 16px",
              borderRadius: 12,
              border: "1px solid #dde3ec",
              background: "#fff",
              fontSize: 14,
              color: "#0f172a",
              outline: "none",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          />
          <button
            onClick={() => setFilterActive((v) => !v)}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              border: `1.5px solid ${filterActive ? "#6366f1" : "#dde3ec"}`,
              background: filterActive ? "#eef2ff" : "#fff",
              color: filterActive ? "#4f46e5" : "#64748b",
            }}
          >
            Available only
          </button>
        </div>

        {/* Type tabs */}
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto 24px",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              style={{
                padding: "7px 16px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                border: `1.5px solid ${filterType === t ? "#6366f1" : "#dde3ec"}`,
                background: filterType === t ? "#6366f1" : "#fff",
                color: filterType === t ? "#fff" : "#64748b",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Vehicle list */}
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {loading && [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}

          {!loading && error && (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #fee2e2",
                color: "#dc2626",
              }}
            >
              <p style={{ fontWeight: 700, marginBottom: 4 }}>
                Could not load vehicles
              </p>
              <p style={{ fontSize: 13, color: "#94a3b8" }}>{error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 24px",
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #e8edf3",
                color: "#64748b",
              }}
            >
              <p style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                No vehicles found
              </p>
              <p style={{ fontSize: 13 }}>
                Try adjusting your filters or search.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            filtered.map((vehicle) => (
              <VehicleCard
                key={vehicle._id || vehicle.id}
                vehicle={vehicle}
                user={user}
              />
            ))}
        </div>

        {/* Bottom nav */}
        <div
          style={{
            maxWidth: 700,
            margin: "40px auto 0",
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#334155",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back to Home
          </button>
          {!user && (
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sign In to Book
            </button>
          )}
          {user && (
            <button
              onClick={() => navigate(dashRoute[user.role] || "/")}
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              My Dashboard
            </button>
          )}
        </div>
      </div>
    </>
  );
}
