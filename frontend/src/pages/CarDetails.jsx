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
      style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px" }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: "#94a3b8",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
        {value}
      </p>
    </div>
  );
}

function PriceRow({ period, price, note, highlight }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        background: highlight ? "#eef2ff" : "transparent",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <div>
        <span
          style={{
            fontSize: 14,
            fontWeight: highlight ? 700 : 600,
            color: highlight ? "#4338ca" : "#334155",
          }}
        >
          {period}
        </span>
        <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>
          {note}
        </span>
      </div>
      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: highlight ? "#4338ca" : "#0f172a",
        }}
      >
        {price}
      </span>
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
  const pricePerHour = vehicle?.pricePerHour || 0;
  const dailyFrom = Math.round(pricePerHour * 24 * 0.8);

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "32px 24px 80px",
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
          padding: "8px 16px",
          borderRadius: 9,
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
          gridTemplateColumns: "1fr 360px",
          gap: 32,
          alignItems: "start",
        }}
      >
        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Vehicle image */}
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              background: "#f1f5f9",
              aspectRatio: "16/9",
              maxHeight: 400,
            }}
          >
            {vehicle.imageUrl ? (
              <img
                src={`${API}/${vehicle.imageUrl}`}
                alt={vehicle.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
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
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  minHeight: 240,
                }}
              >
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="1" y="3" width="15" height="13" rx="2" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>
                  No image available
                </span>
              </div>
            )}
          </div>

          {/* Details card */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e8edf3",
              padding: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 20,
              }}
            >
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {vehicle.name}
                </h1>
                <p
                  style={{ margin: "5px 0 0", fontSize: 15, color: "#64748b" }}
                >
                  {vehicle.type} · {vehicle.model}
                </p>
              </div>
              <span
                style={{
                  padding: "5px 14px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  background: isAvailable ? "#dcfce7" : "#fee2e2",
                  color: isAvailable ? "#15803d" : "#dc2626",
                  flexShrink: 0,
                }}
              >
                {isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>

            {vehicle.description && (
              <p
                style={{
                  fontSize: 14,
                  color: "#475569",
                  lineHeight: 1.8,
                  marginBottom: 24,
                  paddingBottom: 24,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {vehicle.description}
              </p>
            )}

            <h3
              style={{
                margin: "0 0 14px",
                fontSize: 16,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Specifications
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 12,
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
          </div>

          {/* Pricing table */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e8edf3",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Pricing overview
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                Discounts applied automatically at booking
              </p>
            </div>
            <PriceRow
              period="Hourly"
              price={`Rs ${pricePerHour.toLocaleString()}/hr`}
              note="Standard rate — 1 to 23 hrs"
              highlight={false}
            />
            <PriceRow
              period="Daily"
              price={`Rs ${dailyFrom.toLocaleString()}/day`}
              note="20% off — 1 to 6 days"
              highlight={true}
            />
            <PriceRow
              period="Weekly"
              price={`Rs ${Math.round(pricePerHour * 24 * 0.7).toLocaleString()}/day`}
              note="30% off — 7 to 30 days"
              highlight={false}
            />
            <div style={{ padding: "10px 16px", background: "#f8fafc" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                Maximum rental: 30 days (1 month)
              </p>
            </div>
          </div>
        </div>

        {/* ── Right column: booking card ── */}
        <div style={{ position: "sticky", top: 24 }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e8edf3",
              padding: "28px",
              boxShadow: "0 4px 24px rgba(15,23,42,0.07)",
            }}
          >
            {/* Price headline */}
            <div style={{ marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: "-1px",
                }}
              >
                Rs {dailyFrom.toLocaleString()}
              </span>
              <span style={{ fontSize: 15, color: "#94a3b8", marginLeft: 5 }}>
                /day
              </span>
            </div>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "#94a3b8" }}>
              Rs {pricePerHour.toLocaleString()} per hour · discounts on longer
              rentals
            </p>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #f1f5f9",
                margin: "0 0 24px",
              }}
            />

            {/* Rental options */}
            <div style={{ marginBottom: 20 }}>
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
                Rental options
              </p>
              {[
                "Hourly — 1 to 23 hours, standard rate",
                "Daily — 1 to 6 days, 20% off",
                "Weekly — 7 to 30 days, 30% off",
              ].map((t) => (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#6366f1",
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ fontSize: 14, color: "#475569", lineHeight: 1.5 }}
                  >
                    {t}
                  </span>
                </div>
              ))}
            </div>

            {/* Driver note */}
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 24,
                border: "1px solid #e8edf3",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#64748b",
                  lineHeight: 1.6,
                }}
              >
                You can optionally add a professional driver during the booking
                step.
              </p>
            </div>

            {/* How booking works */}
            <div style={{ marginBottom: 24 }}>
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
                How it works
              </p>
              {[
                { n: "1", t: "Book & driver confirms" },
                { n: "2", t: "Pay to confirm your trip" },
                { n: "3", t: "Admin activates" },
                { n: "4", t: "Upload photos & start" },
              ].map((s) => (
                <div
                  key={s.n}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 7,
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#eef2ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6366f1",
                      flexShrink: 0,
                    }}
                  >
                    {s.n}
                  </span>
                  <span style={{ fontSize: 13, color: "#475569" }}>{s.t}</span>
                </div>
              ))}
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
                  padding: "15px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                  letterSpacing: "-0.2px",
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
                Currently unavailable
              </button>
            )}

            <p
              style={{
                margin: "10px 0 0",
                fontSize: 12,
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
