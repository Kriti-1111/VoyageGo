import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

//  Driver card
function DriverCard({ driver, onBook, isLoggedIn }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e8edf3",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: hovered
          ? "0 6px 24px rgba(15,23,42,0.08)"
          : "0 1px 4px rgba(15,23,42,0.04)",
        transform: hovered ? "translateY(-2px)" : "none",
        transition: "all 0.2s",
      }}
    >
      {/* Avatar */}
      {driver.profilePhoto ? (
        <img
          src={driver.profilePhoto}
          alt={driver.name}
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            flexShrink: 0,
            background: "linear-gradient(135deg,#F97316,#EA580C)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          {(driver.name || "D")[0].toUpperCase()}
        </div>
      )}

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
          <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
            {driver.name}
          </span>
          {driver.ratingCount > 0 ? (
            <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>
              ⭐ {(driver.totalRating / driver.ratingCount).toFixed(1)} ·{" "}
              {driver.totalRides || 0} rides
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
              New driver
            </span>
          )}
          {driver.district && (
            <span
              style={{
                fontSize: 11,
                color: "#475569",
                background: "#f1f5f9",
                padding: "2px 6px",
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              📍 {driver.district}
            </span>
          )}
          {driver.isDriverVerified && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: "#FED7AA",
                color: "#EA580C",
                padding: "2px 7px",
                borderRadius: 20,
              }}
            >
              Verified
            </span>
          )}
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 20,
              background: driver.isAvailable ? "#f0fdf4" : "#f1f5f9",
              color: driver.isAvailable ? "#15803d" : "#94a3b8",
            }}
          >
            {driver.isAvailable ? "Available" : "Offline"}
          </span>
        </div>

        <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 3 }}>
          {driver.email}
        </div>

        <div
          style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}
        >
          {(driver.languages || []).map((lang) => (
            <span
              key={lang}
              style={{
                fontSize: 11,
                fontWeight: 600,
                background: "#f1f5f9",
                color: "#334155",
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              {lang}
            </span>
          ))}
          {(driver.vehicleSpecialization || []).map((spec) => (
            <span
              key={spec}
              style={{
                fontSize: 11,
                fontWeight: 600,
                background: "#ede9fe",
                color: "#6d28d9",
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              {spec}
            </span>
          ))}
        </div>
      </div>

      {/* Book button */}
      {driver.isAvailable && isLoggedIn ? (
        <button
          onClick={() => onBook(driver)}
          style={{
            padding: "9px 16px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg,#F97316,#EA580C)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            flexShrink: 0,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Book with vehicle
        </button>
      ) : !isLoggedIn ? (
        <span
          style={{
            fontSize: 12,
            color: "#94a3b8",
            flexShrink: 0,
            fontStyle: "italic",
          }}
        >
          Sign in to book
        </span>
      ) : (
        <span
          style={{
            fontSize: 12,
            color: "#94a3b8",
            flexShrink: 0,
            fontStyle: "italic",
          }}
        >
          Offline
        </span>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e8edf3",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "#e2e8f0",
          animation: "pulse 1.4s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            height: 14,
            width: "30%",
            borderRadius: 6,
            background: "#e2e8f0",
            marginBottom: 8,
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 11,
            width: "55%",
            borderRadius: 6,
            background: "#e2e8f0",
            animation: "pulse 1.4s ease-in-out infinite 0.2s",
          }}
        />
      </div>
    </div>
  );
}

//  Main page
export default function ExploreDrivers() {
  const navigate = useNavigate();
  const user = getUser();
  const isLoggedIn = !!user;

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterAvail, setFilterAvail] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState("");

  // Fetch is public
  useEffect(() => {
    const controller = new AbortController();

    const fetchDrivers = async () => {
      try {
        const headers = {};
        const token = getToken();
        if (token) headers.Authorization = `Bearer ${token}`;

        const r = await fetch(`${API}/api/drivers`, {
          headers,
          signal: controller.signal,
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        setDrivers(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
    return () => controller.abort();
  }, []);

  function handleBook(driver) {
    // Takes user to Explore, they pick a vehicle and BookingPage handles driver pre selection
    navigate("/explore", { state: { preselectedDriver: driver } });
  }

  const filtered = drivers
    .filter((d) => d.isDriverVerified)
    .filter((d) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        d.name?.toLowerCase().includes(q) ||
        (d.languages || []).some((l) => l.toLowerCase().includes(q)) ||
        (d.vehicleSpecialization || []).some((s) =>
          s.toLowerCase().includes(q),
        );
      const matchAvail = !filterAvail || d.isAvailable;
      const matchDistrict =
        !selectedDistrict || d.district === selectedDistrict;
      return matchSearch && matchAvail && matchDistrict;
    })
    .sort((a, b) => {
      // 1. Available online first
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      // 2. Highest rated
      const ratingA = a.ratingCount > 0 ? a.totalRating / a.ratingCount : 0;
      const ratingB = b.ratingCount > 0 ? b.totalRating / b.ratingCount : 0;
      if (ratingA !== ratingB) return ratingB - ratingA;
      // 3. Most rides completed
      return (b.totalRides || 0) - (a.totalRides || 0);
    });

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
            Explore Drivers
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
            Verified professional drivers available for hire
            {!isLoggedIn && (
              <span
                style={{ marginLeft: 8, color: "#F97316", fontWeight: 600 }}
              >
                —{" "}
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#F97316",
                    fontWeight: 600,
                    fontSize: 14,
                    padding: 0,
                  }}
                >
                  Sign in
                </button>{" "}
                to book
              </span>
            )}
          </p>
        </div>

        {/* Search + filter */}
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto 14px",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Search by name, language or specialization…"
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
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{
              padding: "11px 16px",
              borderRadius: 12,
              border: "1px solid #dde3ec",
              background: "#fff",
              fontSize: 14,
              color: "#0f172a",
              outline: "none",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <option value="">All Districts</option>
            <option value="Kathmandu">Kathmandu</option>
            <option value="Lalitpur">Lalitpur</option>
            <option value="Bhaktapur">Bhaktapur</option>
          </select>
          <button
            onClick={() => setFilterAvail((v) => !v)}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              border: `1.5px solid ${filterAvail ? "#F97316" : "#dde3ec"}`,
              background: filterAvail ? "#FFF7ED" : "#fff",
              color: filterAvail ? "#F97316" : "#64748b",
            }}
          >
            Available only
          </button>
        </div>

        {/* Driver list */}
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {loading && [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}

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
                Could not load drivers
              </p>
              <p style={{ fontSize: 13, color: "#94a3b8" }}>{error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "56px 24px",
                background: "#fff",
                borderRadius: 14,
                border: "1px solid #e8edf3",
                color: "#64748b",
              }}
            >
              <p style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                No drivers found
              </p>
              <p style={{ fontSize: 13 }}>
                {search || filterAvail
                  ? "Try adjusting your filters."
                  : "No verified drivers are registered yet."}
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            filtered.map((driver) => (
              <DriverCard
                key={driver._id || driver.id}
                driver={driver}
                onBook={handleBook}
                isLoggedIn={isLoggedIn}
              />
            ))}
        </div>

        {/* Bottom nav */}
        <div
          style={{
            maxWidth: 700,
            margin: "36px auto 0",
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button onClick={() => navigate("/")} style={outlineBtn}>
            Back to Home
          </button>
          <button onClick={() => navigate("/explore")} style={primaryBtn}>
            Browse Vehicles
          </button>
        </div>
      </div>
    </>
  );
}

const primaryBtn = {
  padding: "10px 22px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg,#F97316,#EA580C)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const outlineBtn = {
  padding: "10px 22px",
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#334155",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
