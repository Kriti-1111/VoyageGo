import { useState, useEffect } from "react";
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

function StarRating({ count = 5 }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={i <= count ? "#F97316" : "#e2e8f0"}
          stroke="none"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function Spec({ icon, label, value }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        background: "#f8fafc",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 10,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </p>
        <p
          style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0f172a" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function CarDetails() {
  const { carId } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    axios
      .get(`${API}/api/vehicles/${carId}`)
      .then(({ data }) => setVehicle(data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load vehicle."),
      )
      .finally(() => setLoading(false));
  }, [carId]);

  if (loading)
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 14,
          fontFamily: "'DM Sans',system-ui",
        }}
      >
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div
          style={{
            width: 34,
            height: 34,
            border: "3px solid #e2e8f0",
            borderTopColor: "#F97316",
            borderRadius: "50%",
            animation: "spin 0.75s linear infinite",
          }}
        />
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
          Loading vehicle…
        </p>
      </div>
    );

  if (error)
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          fontFamily: "'DM Sans',system-ui",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
          }}
        >
          ⚠️
        </div>
        <p
          style={{ fontWeight: 700, fontSize: 18, color: "#0f172a", margin: 0 }}
        >
          Something went wrong
        </p>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>{error}</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: 8,
            padding: "10px 24px",
            borderRadius: 10,
            border: "none",
            background: "#F97316",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Go Back
        </button>
      </div>
    );

  const isAvailable = vehicle?.isActive;
  const pricePerHour = vehicle?.pricePerHour || 0;
  const dailyFrom = Math.round(pricePerHour * 24 * 0.8);
  const weeklyFrom = Math.round(pricePerHour * 24 * 0.7);

  const imgSrc = vehicle.imageUrl?.startsWith("data:")
    ? vehicle.imageUrl
    : vehicle.imageUrl
      ? `${API}/${vehicle.imageUrl}`
      : null;
  const hasImage = imgSrc && !imgError;

  const autoDesc = `The ${vehicle.name} is a ${vehicle.type?.toLowerCase() || "vehicle"} from ${vehicle.company || "our fleet"}${vehicle.passengerSeat ? `, accommodating up to ${vehicle.passengerSeat} passengers` : ""}. ${vehicle.fuelType ? `Powered by ${vehicle.fuelType}.` : ""} Available for hourly and daily rentals with optional professional driver service.`;

  return (
    <>
      <style>{`
        * { box-sizing:border-box; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @media(max-width:768px){ .cd-layout{flex-direction:column!important} }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        }}
      >
        {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid #f1f5f9",
            padding: "12px 32px",
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "#94a3b8",
            }}
          >
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: 0,
                fontSize: 13,
              }}
            >
              Home
            </button>
            <span>›</span>
            <button
              onClick={() => navigate("/explore")}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: 0,
                fontSize: 13,
              }}
            >
              Vehicles
            </button>
            <span>›</span>
            <span style={{ color: "#0f172a", fontWeight: 600 }}>
              {vehicle.name}
            </span>
          </div>
        </div>

        {/* ── Main layout ───────────────────────────────────────────────────── */}
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "32px 20px 80px",
          }}
        >
          <div
            className="cd-layout"
            style={{
              display: "flex",
              gap: 40,
              alignItems: "flex-start",
              animation: "fadeIn 0.4s ease both",
            }}
          >
            {/* ── LEFT: Image panel ─────────────────────────────────────────── */}
            <div style={{ flex: "0 0 480px", position: "sticky", top: 24 }}>
              {/* Main image */}
              <div
                style={{
                  background: hasImage
                    ? "#fff"
                    : "linear-gradient(135deg,#FFF7ED,#FED7AA)",
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  aspectRatio: "4/3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
              >
                {hasImage ? (
                  <img
                    src={imgSrc}
                    alt={vehicle.name}
                    onError={() => setImgError(true)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <svg
                      width="72"
                      height="72"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FDBA74"
                      strokeWidth="1"
                    >
                      <rect x="1" y="3" width="15" height="13" rx="2" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: 13,
                        color: "#FDBA74",
                        fontWeight: 600,
                      }}
                    >
                      No photo
                    </p>
                  </div>
                )}
              </div>

              {/* Thumbnail row (placeholder for future gallery) */}
              <div style={{ display: "flex", gap: 8 }}>
                <div
                  style={{
                    width: 72,
                    height: 56,
                    borderRadius: 8,
                    border: "2px solid #F97316",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  {hasImage ? (
                    <img
                      src={imgSrc}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "#FFF7ED",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Details panel ──────────────────────────────────────── */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Brand + badges */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: "#F97316" }}
                >
                  {vehicle.company}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    background: isAvailable ? "#dcfce7" : "#f1f5f9",
                    color: isAvailable ? "#15803d" : "#94a3b8",
                    padding: "2px 8px",
                    borderRadius: 20,
                  }}
                >
                  {isAvailable ? "● In Stock" : "● Unavailable"}
                </span>
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
                  {vehicle.type}
                </span>
              </div>

              {/* Vehicle name */}
              <h1
                style={{
                  margin: "0 0 10px",
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "-0.5px",
                  lineHeight: 1.2,
                }}
              >
                {vehicle.name}
              </h1>

              {/* Star rating placeholder */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <StarRating count={4} />
                <span style={{ fontSize: 13, color: "#64748b" }}>
                  4.0 · Vehicle rating
                </span>
              </div>

              {/* Pricing */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "18px 20px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{ fontSize: 30, fontWeight: 800, color: "#F97316" }}
                  >
                    Rs {dailyFrom.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 15, color: "#94a3b8" }}>/day</span>
                  <span
                    style={{
                      fontSize: 13,
                      color: "#94a3b8",
                      textDecoration: "line-through",
                      marginLeft: 4,
                    }}
                  >
                    Rs {Math.round(pricePerHour * 24).toLocaleString()}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      background: "#dcfce7",
                      color: "#15803d",
                      padding: "2px 8px",
                      borderRadius: 20,
                    }}
                  >
                    20% off
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                  Rs {pricePerHour.toLocaleString()}/hr &nbsp;·&nbsp; Rs{" "}
                  {weeklyFrom.toLocaleString()}/day (7+ days, 30% off)
                </p>
              </div>

              {/* Quick specs row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <Spec
                  icon="💺"
                  label="Passenger seats"
                  value={
                    vehicle.passengerSeat && `${vehicle.passengerSeat} seats`
                  }
                />
                <Spec icon="⛽" label="Fuel type" value={vehicle.fuelType} />
                <Spec
                  icon="🪪"
                  label="Plate number"
                  value={vehicle.plateNumber}
                />
                <Spec icon="📅" label="Model year" value={vehicle.model} />
              </div>

              {/* Description */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "16px 18px",
                  marginBottom: 20,
                }}
              >
                <h3
                  style={{
                    margin: "0 0 8px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  About this vehicle
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "#4b5563",
                    lineHeight: 1.8,
                  }}
                >
                  {vehicle.description || autoDesc}
                </p>
              </div>

              {/* Trust badges — like the reference image */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {[
                  {
                    icon: "✅",
                    title: "Verified Vehicle",
                    sub: "Inspected before every booking",
                  },
                  {
                    icon: "🔄",
                    title: "Easy cancellation",
                    sub: "Cancel before trip starts",
                  },
                  {
                    icon: "🧑‍✈️",
                    title: "Optional driver",
                    sub: "Add a pro driver at booking",
                  },
                  {
                    icon: "📍",
                    title: "Kathmandu & beyond",
                    sub: "Available across Nepal",
                  },
                ].map((b) => (
                  <div
                    key={b.title}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      padding: "12px 14px",
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                    }}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0 }}>
                      {b.icon}
                    </span>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {b.title}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: 12,
                          color: "#94a3b8",
                        }}
                      >
                        {b.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              {isAvailable ? (
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => {
                      if (!user) {
                        navigate("/login");
                        return;
                      }
                      navigate(`/booking/${carId}`);
                    }}
                    style={{
                      flex: 1,
                      padding: "15px",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg,#F97316,#EA580C)",
                      color: "#fff",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.opacity = "0.88")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    {user ? "Book Now →" : "Sign in to Book →"}
                  </button>
                  <button
                    onClick={() => navigate("/explore")}
                    style={{
                      padding: "15px 22px",
                      borderRadius: 12,
                      border: "1.5px solid #e2e8f0",
                      background: "#fff",
                      color: "#374151",
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#F97316";
                      e.currentTarget.style.color = "#F97316";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.color = "#374151";
                    }}
                  >
                    ← Back
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    disabled
                    style={{
                      flex: 1,
                      padding: "15px",
                      borderRadius: 12,
                      border: "none",
                      background: "#f1f5f9",
                      color: "#94a3b8",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "not-allowed",
                    }}
                  >
                    Currently Unavailable
                  </button>
                  <button
                    onClick={() => navigate("/explore")}
                    style={{
                      padding: "15px 22px",
                      borderRadius: 12,
                      border: "1.5px solid #e2e8f0",
                      background: "#fff",
                      color: "#374151",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ← Back
                  </button>
                </div>
              )}

              {/* No payment note */}
              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: 12,
                  color: "#94a3b8",
                  textAlign: "center",
                }}
              >
                No payment collected until booking is confirmed by driver
              </p>
            </div>
          </div>

          {/* ── Pricing table ─────────────────────────────────────────────── */}
          <div
            style={{
              marginTop: 40,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Pricing breakdown
                </h2>
                <p
                  style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}
                >
                  Discounts applied automatically at checkout
                </p>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: "#f0fdf4",
                  color: "#15803d",
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: "1px solid #bbf7d0",
                }}
              >
                Max 30 days
              </span>
            </div>
            {[
              {
                period: "Hourly",
                price: `Rs ${pricePerHour.toLocaleString()}/hr`,
                note: "Standard rate · 1–23 hours",
                discount: null,
              },
              {
                period: "Daily",
                price: `Rs ${dailyFrom.toLocaleString()}/day`,
                note: "20% off · 1–6 days",
                discount: "20% off",
                highlight: true,
              },
              {
                period: "Weekly",
                price: `Rs ${weeklyFrom.toLocaleString()}/day`,
                note: "30% off · 7–30 days",
                discount: "30% off",
              },
            ].map((row) => (
              <div
                key={row.period}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 24px",
                  background: row.highlight ? "#FFF7ED" : "transparent",
                  borderBottom: "1px solid #f8fafc",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: row.highlight ? 700 : 600,
                      color: row.highlight ? "#EA580C" : "#374151",
                    }}
                  >
                    {row.period}
                  </span>
                  <span
                    style={{ fontSize: 12, color: "#94a3b8", marginLeft: 10 }}
                  >
                    {row.note}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {row.discount && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: "#dcfce7",
                        color: "#15803d",
                        padding: "2px 8px",
                        borderRadius: 20,
                      }}
                    >
                      {row.discount}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: row.highlight ? "#EA580C" : "#111827",
                    }}
                  >
                    {row.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
