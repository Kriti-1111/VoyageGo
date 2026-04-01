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

function SpecItem({ label, value }) {
  if (!value) return null;
  return (
    <div
      style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px" }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: "#94a3b8",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 3,
        }}
      >
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
        {value}
      </p>
    </div>
  );
}

// ── Pricing preview (read-only) ───────────────────────────────────────────────
function PricePreview({ pricePerHour }) {
  const dailyBase = pricePerHour * 24;
  const dailyDisc = Math.round(dailyBase * 0.85);
  const weeklyDisc = Math.round(dailyBase * 7 * 0.7);

  return (
    <div
      style={{
        border: "1px solid #e8edf3",
        borderRadius: 12,
        overflow: "hidden",
        marginTop: 16,
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          background: "#f8fafc",
          borderBottom: "1px solid #e8edf3",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Pricing overview
        </p>
      </div>
      {[
        {
          period: "Hourly",
          price: `Rs ${pricePerHour.toLocaleString()}`,
          note: "Standard rate",
        },
        {
          period: "Daily",
          price: `Rs ${dailyDisc.toLocaleString()}`,
          note: "15% off daily rate",
        },
        {
          period: "Weekly",
          price: `Rs ${weeklyDisc.toLocaleString()}`,
          note: "30% off — per week",
        },
      ].map(({ period, price, note }) => (
        <div
          key={period}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 14px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
              {period}
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>
              {note}
            </span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
            {price}
          </span>
        </div>
      ))}
      <div style={{ padding: "8px 14px", background: "#f8fafc" }}>
        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
          Max rental: 30 days. Discounts applied automatically at booking.
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CarDetails() {
  const { carId } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "DM Sans, system-ui",
        }}
      >
        <p style={{ color: "#64748b" }}>Loading vehicle…</p>
      </div>
    );

  if (error)
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          fontFamily: "DM Sans, system-ui",
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
          {error}
        </div>
      </div>
    );

  const isAvailable = vehicle?.isActive;
  const dailyFrom = Math.round(vehicle.pricePerHour * 24 * 0.85);

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "32px 20px 80px",
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
      }}
    >
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{
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
        }}
      >
        Back
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 32,
          alignItems: "start",
        }}
      >
        {/* ── Left: vehicle info ── */}
        <div>
          {/* Image */}
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              height: 360,
              background: "#f1f5f9",
              marginBottom: 24,
            }}
          >
            {vehicle.imageUrl ? (
              <img
                src={`${API}/${vehicle.imageUrl}`}
                alt={vehicle.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 64, color: "#cbd5e1" }}>—</span>
              </div>
            )}
          </div>

          {/* Details card */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e8edf3",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {vehicle.name}
                </h1>
                <p
                  style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}
                >
                  {vehicle.type} · {vehicle.model}
                </p>
              </div>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  background: isAvailable ? "#dcfce7" : "#fee2e2",
                  color: isAvailable ? "#15803d" : "#dc2626",
                }}
              >
                {isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #f1f5f9",
                margin: "0 0 16px",
              }}
            />

            {vehicle.description && (
              <p
                style={{
                  fontSize: 14,
                  color: "#475569",
                  lineHeight: 1.7,
                  marginBottom: 20,
                }}
              >
                {vehicle.description}
              </p>
            )}

            <h3
              style={{
                margin: "0 0 12px",
                fontSize: 15,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Specifications
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 10,
              }}
            >
              <SpecItem label="Company" value={vehicle.company} />
              <SpecItem label="Fuel type" value={vehicle.fuelType} />
              <SpecItem
                label="Seats"
                value={
                  vehicle.passengerSeat && `${vehicle.passengerSeat} seats`
                }
              />
              <SpecItem label="Plate no." value={vehicle.plateNumber} />
            </div>

            <PricePreview pricePerHour={vehicle.pricePerHour} />
          </div>
        </div>

        {/* ── Right: sticky booking card ── */}
        <div style={{ position: "sticky", top: 24 }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e8edf3",
              padding: "24px",
              boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
            }}
          >
            {/* Price headline */}
            <div style={{ marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.5px",
                }}
              >
                Rs {dailyFrom.toLocaleString()}
              </span>
              <span style={{ fontSize: 14, color: "#94a3b8", marginLeft: 4 }}>
                /day
              </span>
            </div>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: "#94a3b8" }}>
              Rs {vehicle.pricePerHour.toLocaleString()} per hour · discounts on
              longer rentals
            </p>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #f1f5f9",
                margin: "0 0 20px",
              }}
            />

            {/* Booking type note */}
            <div style={{ marginBottom: 20 }}>
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Rental options
              </p>
              {[
                "Hourly — 1 to 23 hours, standard rate",
                "Daily — 1 to 6 days, 15% off",
                "Weekly — 7 to 30 days, 30% off",
              ].map((t) => (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "#6366f1",
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, color: "#475569" }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Driver note */}
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 20,
                border: "1px solid #e8edf3",
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                You can optionally add a professional driver during the booking
                step.
              </p>
            </div>

            {/* CTA */}
            {isAvailable ? (
              <button
                onClick={() => {
                  if (!user) {
                    navigate("/login");
                    return;
                  }
                  navigate(`/booking/${carId}`);
                }}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {user ? "Book this vehicle" : "Sign in to book"}
              </button>
            ) : (
              <button
                disabled
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 12,
                  border: "none",
                  background: "#f1f5f9",
                  color: "#94a3b8",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "not-allowed",
                }}
              >
                Currently unavailable
              </button>
            )}

            <p
              style={{
                margin: "10px 0 0",
                fontSize: 11,
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              No payment collected until booking is confirmed by the driver.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
