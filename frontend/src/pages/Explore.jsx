import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const API = "http://localhost:5000";

function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/vehicles`)
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

// ── Vehicle grid card ─────────────────────────────────────────────────────────
function VehicleCard({ vehicle, user, navigate }) {
  const imgSrc = vehicle.imageUrl?.startsWith("data:")
    ? vehicle.imageUrl
    : vehicle.imageUrl
      ? `${API}/${vehicle.imageUrl}`
      : null;
  const daily = Math.round(vehicle.pricePerHour * 24 * 0.8);
  const hasDrivers = vehicle.drivers && vehicle.drivers.length > 0;

  return (
    <div
      onClick={() => navigate(`/car/${vehicle._id || vehicle.id}`)}
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        cursor: "pointer",
        transition: "box-shadow 0.18s, transform 0.18s",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(249,115,22,0.13)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* Image */}
      <div
        style={{
          height: 160,
          background: "#f1f5f9",
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={vehicle.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg,#FFF7ED,#FED7AA)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FDBA74"
              strokeWidth="1.2"
            >
              <rect x="1" y="3" width="15" height="13" rx="2" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
        )}
        {/* Type badge */}
        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            fontSize: 11,
            fontWeight: 700,
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            padding: "3px 9px",
            borderRadius: 20,
            backdropFilter: "blur(4px)",
          }}
        >
          {vehicle.type}
        </span>
      </div>

      {/* Info */}
      <div
        style={{
          padding: "14px 16px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {/* Name + rating */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: "#111827",
                lineHeight: 1.3,
              }}
            >
              {vehicle.name}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
              {vehicle.company} · {vehicle.model}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              flexShrink: 0,
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="#F97316"
              stroke="none"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              4.0
            </span>
          </div>
        </div>

        {/* Price */}
        <div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#F97316" }}>
            Rs {vehicle.pricePerHour.toLocaleString()}
          </span>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>/hr</span>
          <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>
            · Rs {daily.toLocaleString()}/day
          </span>
        </div>

        {/* Chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {vehicle.passengerSeat && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                background: "#f1f5f9",
                color: "#64748b",
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              💺 {vehicle.passengerSeat} seats
            </span>
          )}
          {vehicle.fuelType && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                background: "#f1f5f9",
                color: "#64748b",
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              ⛽ {vehicle.fuelType}
            </span>
          )}
          {hasDrivers && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                background: "#FFF7ED",
                color: "#EA580C",
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              🧑‍✈️ Driver available
            </span>
          )}
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: 8,
            borderTop: "1px solid #f8fafc",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: vehicle.isActive ? "#22C55E" : "#94a3b8",
                display: "inline-block",
              }}
            />
            <span
              style={{
                color: vehicle.isActive ? "#15803d" : "#94a3b8",
                fontWeight: 600,
              }}
            >
              {vehicle.isActive ? "Available" : "Unavailable"}
            </span>
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                navigate("/login");
                return;
              }
              navigate(`/booking/${vehicle._id || vehicle.id}`);
            }}
            style={{
              padding: "7px 16px",
              borderRadius: 9,
              border: "none",
              background: "linear-gradient(135deg,#F97316,#EA580C)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
            }}
            onMouseEnter={(e) => e.stopPropagation()}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 160,
          background: "#e2e8f0",
          animation: "pulse 1.4s ease-in-out infinite",
        }}
      />
      <div style={{ padding: "14px 16px" }}>
        <div
          style={{
            height: 14,
            width: "60%",
            borderRadius: 6,
            background: "#e2e8f0",
            marginBottom: 8,
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 11,
            width: "40%",
            borderRadius: 6,
            background: "#e2e8f0",
            animation: "pulse 1.4s ease-in-out infinite 0.2s",
          }}
        />
      </div>
    </div>
  );
}

// ── Sidebar Filters ───────────────────────────────────────────────────────────
function Sidebar({
  filterType,
  setFilterType,
  priceRange,
  setPriceRange,
  filterDriver,
  setFilterDriver,
  filterAvail,
  setFilterAvail,
  onClear,
  counts,
}) {
  const types = ["Car", "Van"];
  const priceRanges = [
    { label: "Under Rs. 200/hr", key: "under200" },
    { label: "Rs. 200 - Rs. 500/hr", key: "200to500" },
    { label: "Rs. 500 - Rs. 1,000/hr", key: "500to1000" },
    { label: "Above Rs. 1,000/hr", key: "above1000" },
  ];

  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        padding: "20px",
        height: "fit-content",
        position: "sticky",
        top: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
          Filters
        </span>
        <button
          onClick={onClear}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#F97316",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Clear All
        </button>
      </div>

      {/* Quick toggles */}
      <div style={{ marginBottom: 20 }}>
        {[
          {
            label: "✓ Available only",
            active: filterAvail,
            toggle: () => setFilterAvail((v) => !v),
          },
          {
            label: "🧑‍✈️ Has driver",
            active: filterDriver,
            toggle: () => setFilterDriver((v) => !v),
          },
        ].map((f) => (
          <label
            key={f.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
              cursor: "pointer",
            }}
          >
            <div
              onClick={f.toggle}
              style={{
                width: 38,
                height: 22,
                borderRadius: 11,
                background: f.active ? "#F97316" : "#e2e8f0",
                position: "relative",
                transition: "background 0.2s",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: f.active ? 18 : 3,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 13,
                color: "#374151",
                fontWeight: f.active ? 600 : 400,
              }}
            >
              {f.label}
            </span>
          </label>
        ))}
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #f1f5f9",
          margin: "0 0 16px",
        }}
      />

      {/* Vehicle Type */}
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 12,
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Vehicle Type
      </p>
      {types.map((t) => (
        <label
          key={t}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 9,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={filterType === t}
            onChange={() => setFilterType(filterType === t ? "All" : t)}
            style={{
              width: 15,
              height: 15,
              accentColor: "#F97316",
              cursor: "pointer",
            }}
          />
          <span style={{ fontSize: 13, color: "#374151" }}>{t}</span>
          {counts[t] !== undefined && (
            <span
              style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}
            >
              ({counts[t]})
            </span>
          )}
        </label>
      ))}

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #f1f5f9",
          margin: "12px 0 16px",
        }}
      />

      {/* Price Range */}
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 12,
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Price Range
      </p>
      {priceRanges.map((p) => (
        <label
          key={p.key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 9,
            cursor: "pointer",
          }}
        >
          <input
            type="radio"
            name="price"
            checked={priceRange === p.key}
            onChange={() => setPriceRange(priceRange === p.key ? "all" : p.key)}
            style={{
              width: 15,
              height: 15,
              accentColor: "#F97316",
              cursor: "pointer",
            }}
          />
          <span style={{ fontSize: 13, color: "#374151" }}>{p.label}</span>
        </label>
      ))}
    </div>
  );
}

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
  const [priceRange, setPriceRange] = useState("all");
  const [filterAvail, setFilterAvail] = useState(false);
  const [filterDriver, setFilterDriver] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");

  function clearAll() {
    setFilterType("All");
    setPriceRange("all");
    setFilterAvail(false);
    setFilterDriver(false);
    setSearch("");
  }

  function matchesPrice(v) {
    const p = v.pricePerHour;
    if (priceRange === "under200") return p < 200;
    if (priceRange === "200to500") return p >= 200 && p <= 500;
    if (priceRange === "500to1000") return p > 500 && p <= 1000;
    if (priceRange === "above1000") return p > 1000;
    return true;
  }

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      v.name?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.company?.toLowerCase().includes(q);
    const matchType = filterType === "All" || v.type === filterType;
    const matchAvail = !filterAvail || v.isActive;
    const matchDriver = !filterDriver || (v.drivers && v.drivers.length > 0);
    return (
      matchSearch && matchType && matchAvail && matchDriver && matchesPrice(v)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price_asc") return a.pricePerHour - b.pricePerHour;
    if (sortBy === "price_desc") return b.pricePerHour - a.pricePerHour;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0; // recommended
  });

  // counts per type for sidebar
  const counts = vehicles.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {});

  const dashRoute = {
    OWNER: "/management",
    ADMIN: "/management",
    STAFF: "/management",
    DRIVER: "/driver",
    CUSTOMER: "/customer",
  };

  return (
    <>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}} * { box-sizing:border-box; }`}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        }}
      >
        {/* ── Top search bar ─────────────────────────────────────────────────── */}
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid #f1f5f9",
            padding: "16px 32px",
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1, position: "relative" }}>
              <svg
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search vehicles by name, model or company…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 16px 11px 40px",
                  borderRadius: 10,
                  border: "1.5px solid #e2e8f0",
                  fontSize: 14,
                  color: "#0f172a",
                  outline: "none",
                  background: "#fff",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#F97316")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            {user && (
              <button
                onClick={() => navigate(dashRoute[user.role] || "/")}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg,#F97316,#EA580C)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                My Dashboard
              </button>
            )}
            {!user && (
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg,#F97316,#EA580C)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Sign In to Book
              </button>
            )}
          </div>
        </div>

        {/* ── Body: sidebar + grid ───────────────────────────────────────────── */}
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "28px 20px 80px",
            display: "flex",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          {/* Sidebar */}
          <Sidebar
            filterType={filterType}
            setFilterType={setFilterType}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            filterDriver={filterDriver}
            setFilterDriver={setFilterDriver}
            filterAvail={filterAvail}
            setFilterAvail={setFilterAvail}
            onClear={clearAll}
            counts={counts}
          />

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Results header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  Available Vehicles
                </h1>
                <p
                  style={{ margin: "2px 0 0", fontSize: 13, color: "#94a3b8" }}
                >
                  {sorted.length} vehicle{sorted.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 9,
                  border: "1.5px solid #e2e8f0",
                  fontSize: 13,
                  color: "#374151",
                  background: "#fff",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="recommended">Sort by: Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

            {/* Grid */}
            {loading && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
                  gap: 18,
                }}
              >
                {[0, 1, 2, 3, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {!loading && error && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  background: "#fff",
                  borderRadius: 14,
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

            {!loading && !error && sorted.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 24px",
                  background: "#fff",
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>🚗</div>
                <p
                  style={{
                    fontWeight: 700,
                    color: "#111827",
                    margin: "0 0 6px",
                    fontSize: 16,
                  }}
                >
                  No vehicles match your filters
                </p>
                <p
                  style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px" }}
                >
                  Try adjusting your filters or clearing them.
                </p>
                <button
                  onClick={clearAll}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 9,
                    border: "none",
                    background: "#F97316",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Clear all filters
                </button>
              </div>
            )}

            {!loading && !error && sorted.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
                  gap: 18,
                }}
              >
                {sorted.map((v) => (
                  <VehicleCard
                    key={v._id || v.id}
                    vehicle={v}
                    user={user}
                    navigate={navigate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
