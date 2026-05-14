import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function FeatureIcon({ type }) {
  const props = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const icons = {
    vehicle: (
      <svg {...props} stroke="#F97316">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    driver: (
      <svg {...props} stroke="#F97316">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    booking: (
      <svg {...props} stroke="#F97316">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    secure: (
      <svg {...props} stroke="#F97316">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    tracking: (
      <svg {...props} stroke="#F97316">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    rating: (
      <svg {...props} stroke="#F97316">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  };
  return icons[type] || icons.vehicle;
}

function StepIcon({ type }) {
  const props = {
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    stroke: "#fff",
  };
  const icons = {
    account: (
      <svg {...props}>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    search: (
      <svg {...props}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    ride: (
      <svg {...props}>
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  };
  return icons[type] || icons.ride;
}

export default function Home() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/vehicles")
      .then(({ data }) => setVehicles(data.filter((v) => v.isActive)));
    axios
      .get("http://localhost:5000/api/drivers")
      .then(({ data }) =>
        setDrivers(data.filter((d) => d.isDriverVerified).slice(0, 4)),
      );
  }, []);

  const featured = vehicles.slice(0, 4);
  const popular = vehicles.slice(4, 8);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .home-grid {
            grid-template-columns: repeat(1, 1fr) !important;
          }
          .home-section-padding {
            padding: 48px 20px !important;
          }
        }
      `}</style>
      {/* Hero */}
      <section
        style={{
          background:
            "linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url('/hero-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          padding: "100px 32px 120px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{ maxWidth: "700px", margin: "0 auto", position: "relative" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(30,58,138,0.15)",
              border: "1px solid rgba(249,115,22,0.3)",
              borderRadius: "20px",
              padding: "6px 16px",
              marginBottom: "24px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                background: "#F97316",
                borderRadius: "50%",
              }}
            />
            <span
              style={{ fontSize: "13px", color: "#FED7AA", fontWeight: "600" }}
            >
              Available across Kathmandu
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(36px,6vw,60px)",
              fontWeight: "900",
              color: "#fff",
              margin: "0 0 16px",
              lineHeight: 1.1,
              letterSpacing: "-1px",
            }}
          >
            Travel Nepal
            <br />
            <span
              style={{
                background: "linear-gradient(135deg,#F97316,#EA580C)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Your Way
            </span>
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "#94a3b8",
              margin: "0 0 40px",
              lineHeight: 1.7,
            }}
          >
            Book vehicles, hire professional drivers, and explore Nepal with
            complete confidence. Simple. Fast. Reliable.
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => navigate("/explore")}
              style={{
                padding: "14px 32px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg,#F97316,#EA580C)",
                color: "#fff",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
                boxShadow: "0 8px 24px rgba(30,58,138,0.4)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 32px rgba(30,58,138,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(30,58,138,0.4)";
              }}
            >
              Explore Vehicles
            </button>
            {!user && (
              <button
                onClick={() => navigate("/register")}
                style={{
                  padding: "14px 32px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#e2e8f0",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
                }
              >
                Create Account
              </button>
            )}
          </div>
        </div>
      </section>

      {/*  Featured Vehicles */}
      <div
        className="home-section-padding"
        style={{ padding: "72px 40px 0", maxWidth: 1280, margin: "0 auto" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 8,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
              Featured Vehicles
            </h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
              Handpicked vehicles for your next trip
            </p>
          </div>
          <a
            href="/explore"
            style={{
              color: "#F97316",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            View All →
          </a>
        </div>

        <div
          className="home-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
            marginTop: 24,
          }}
        >
          {featured.map((v) => (
            <div
              key={v._id}
              style={{
                background: "#fff",
                borderRadius: 14,
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onClick={() => navigate(`/car/${v._id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 32px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow =
                  "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)";
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "3/2",
                  background: "#f8fafc",
                  overflow: "hidden",
                }}
              >
                <img
                  src={v.imageUrl}
                  alt={v.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {v.name}
                  </h3>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#F97316",
                      background: "#FFF7ED",
                      padding: "2px 7px",
                      borderRadius: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      flexShrink: 0,
                    }}
                  >
                    {v.type}
                  </span>
                </div>
                <p
                  style={{
                    margin: "4px 0 10px",
                    fontSize: 11,
                    color: "#64748b",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {v.description || v.company}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontWeight: 700, color: "#F97316", fontSize: 13 }}
                  >
                    Rs {v.pricePerHour}/hr
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/car/${v._id}`);
                    }}
                    style={{
                      background: "#F97316",
                      color: "#fff",
                      border: "none",
                      borderRadius: 7,
                      padding: "6px 14px",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/*  Most Popular */}
      <div
        className="home-section-padding"
        style={{ padding: "48px 40px 72px", maxWidth: 1280, margin: "0 auto" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 8,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
              Most Popular
            </h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
              Top choices from our fleet
            </p>
          </div>
          <a
            href="/explore"
            style={{
              color: "#F97316",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            View All →
          </a>
        </div>

        <div
          className="home-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginTop: 24,
          }}
        >
          {popular.map((v) => (
            <div
              key={v._id}
              style={{
                background: "#fff",
                borderRadius: 14,
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onClick={() => navigate(`/car/${v._id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 32px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow =
                  "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)";
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "3/2",
                  background: "#f8fafc",
                  overflow: "hidden",
                }}
              >
                <img
                  src={v.imageUrl}
                  alt={v.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {v.name}
                  </h3>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#F97316",
                      background: "#FFF7ED",
                      padding: "2px 7px",
                      borderRadius: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      flexShrink: 0,
                    }}
                  >
                    {v.type}
                  </span>
                </div>
                <p
                  style={{
                    margin: "4px 0 10px",
                    fontSize: 11,
                    color: "#64748b",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {v.description || v.company}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontWeight: 700, color: "#F97316", fontSize: 13 }}
                  >
                    Rs {v.pricePerHour}/hr
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/car/${v._id}`);
                    }}
                    style={{
                      background: "#F97316",
                      color: "#fff",
                      border: "none",
                      borderRadius: 7,
                      padding: "6px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                  >
                    Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/*  Professional Drivers  */}
      <div style={{ background: "#f8fafc" }}>
        <div
          className="home-section-padding"
          style={{ padding: "72px 40px", maxWidth: 1280, margin: "0 auto" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 8,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
                Professional Drivers
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
                Experienced drivers ready to take you anywhere
              </p>
            </div>
            <a
              href="/drivers"
              style={{
                color: "#F97316",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              View All →
            </a>
          </div>

          <div
            className="home-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 16,
              marginTop: 24,
            }}
          >
            {drivers.map((d) => {
              const isNew = d.ratingCount === 0;
              const avg = isNew
                ? null
                : (d.totalRating / d.ratingCount).toFixed(1);
              const initials = d.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <div
                  key={d._id}
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onClick={() => navigate("/drivers")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 32px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow =
                      "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)";
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "3/2",
                      background:
                        "linear-gradient(135deg,#FFF7ED 0%, #FFEDD5 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#F97316,#EA580C)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        fontWeight: 700,
                        boxShadow: "0 8px 24px rgba(249,115,22,0.3)",
                      }}
                    >
                      {initials}
                    </div>
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        fontSize: 9,
                        color: "#0369a1",
                        background: "#e0f2fe",
                        padding: "2px 7px",
                        borderRadius: 10,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                      }}
                    >
                      VERIFIED
                    </span>
                  </div>

                  <div style={{ padding: "14px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 700,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.name}
                      </h3>
                      {isNew ? (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            color: "#059669",
                            background: "#ecfdf5",
                            padding: "2px 7px",
                            borderRadius: 10,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            flexShrink: 0,
                          }}
                        >
                          NEW
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#f59e0b",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {avg}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: "4px 0 10px",
                        fontSize: 11,
                        color: "#64748b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {d.district} district
                      {d.languages?.length
                        ? ` • ${d.languages.join(", ")}`
                        : ""}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#F97316",
                          fontSize: 13,
                        }}
                      >
                        Rs {d.driverRatePerHour}/hr
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/drivers");
                        }}
                        style={{
                          background: "#F97316",
                          color: "#fff",
                          border: "none",
                          borderRadius: 7,
                          padding: "6px 12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontSize: 11,
                        }}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <section
        style={{
          background: "#fff",
          borderBottom: "1px solid #f1f5f9",
          padding: "40px 32px",
        }}
      >
        <div
          style={{
            maxWidth: "1080px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: "40px",
            textAlign: "center",
          }}
        >
          {[
            { value: "500+", label: "Happy Customers" },
            { value: "50+", label: "Verified Drivers" },
            { value: "30+", label: "Vehicles" },
            { value: "24/7", label: "Support" },
          ].map((s) => (
            <div key={s.label}>
              <p
                style={{
                  fontSize: "40px",
                  fontWeight: "800",
                  color: "#F97316",
                  margin: 0,
                  letterSpacing: "-1px",
                }}
              >
                {s.value}
              </p>
              <p
                style={{
                  fontSize: "15px",
                  color: "#64748b",
                  margin: "6px 0 0",
                  fontWeight: "500",
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "96px 32px", background: "#f8fafc" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2
              style={{
                fontSize: "40px",
                fontWeight: "800",
                color: "#0f172a",
                margin: "0 0 14px",
                letterSpacing: "-0.5px",
              }}
            >
              Why choose VoyageGo?
            </h2>
            <p style={{ fontSize: "17px", color: "#64748b", margin: 0 }}>
              Everything you need for stress-free travel
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
              gap: "24px",
            }}
          >
            {[
              {
                icon: "vehicle",
                bg: "#FFF7ED",
                title: "Wide Vehicle Selection",
                desc: "From sedans to vans — pick the vehicle that fits your journey and group size.",
              },
              {
                icon: "driver",
                bg: "#f0fdf4",
                title: "Professional Drivers",
                desc: "All drivers are verified, experienced, and trained to deliver safe trips.",
              },
              {
                icon: "booking",
                bg: "#fffbeb",
                title: "Easy Booking",
                desc: "Book in minutes. Track your ride, manage bookings, and cancel anytime.",
              },
              {
                icon: "secure",
                bg: "#fff1f2",
                title: "Safe & Secure",
                desc: "Your payments and personal data are protected at every step of your journey.",
              },
              {
                icon: "tracking",
                bg: "#ecfeff",
                title: "Real-time Tracking",
                desc: "Know where your driver is at all times with live location updates.",
              },
              {
                icon: "rating",
                bg: "#fdf4ff",
                title: "Rated by Thousands",
                desc: "Join our growing community of happy travellers across Nepal.",
              },
            ].map((f) => (
              <div
                key={f.title}
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "32px",
                  border: "1px solid #f1f5f9",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 32px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    background: f.bg,
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "20px",
                  }}
                >
                  <FeatureIcon type={f.icon} />
                </div>
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: "700",
                    color: "#0f172a",
                    margin: "0 0 10px",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                    margin: 0,
                    lineHeight: 1.7,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "96px 32px", background: "#fff" }}>
        <div
          style={{ maxWidth: "1080px", margin: "0 auto", textAlign: "center" }}
        >
          <h2
            style={{
              fontSize: "40px",
              fontWeight: "800",
              color: "#0f172a",
              margin: "0 0 14px",
              letterSpacing: "-0.5px",
            }}
          >
            How it works
          </h2>
          <p style={{ fontSize: "17px", color: "#64748b", margin: "0 0 64px" }}>
            Get on the road in 3 simple steps
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: "40px",
            }}
          >
            {[
              {
                step: "01",
                icon: "account",
                title: "Create an account",
                desc: "Sign up free in under a minute as a customer or driver.",
              },
              {
                step: "02",
                icon: "search",
                title: "Browse & book",
                desc: "Pick your vehicle, set your dates, and confirm your booking.",
              },
              {
                step: "03",
                icon: "ride",
                title: "Enjoy your ride",
                desc: "Your driver picks you up and you travel in comfort.",
              },
            ].map((s) => (
              <div
                key={s.step}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    background: "linear-gradient(135deg,#F97316,#EA580C)",
                    borderRadius: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 24px rgba(249,115,22,0.3)",
                  }}
                >
                  <StepIcon type={s.icon} />
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    color: "#F97316",
                    letterSpacing: "1.5px",
                  }}
                >
                  STEP {s.step}
                </span>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                    margin: 0,
                    lineHeight: 1.7,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  guests only */}
      {!user && (
        <section
          style={{
            background: "linear-gradient(135deg,#1F2937,#111827)",
            padding: "96px 32px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "40px",
                fontWeight: "800",
                color: "#fff",
                margin: "0 0 14px",
                letterSpacing: "-0.5px",
              }}
            >
              Ready to get started?
            </h2>
            <p
              style={{ fontSize: "17px", color: "#94a3b8", margin: "0 0 36px" }}
            >
              Join thousands of travellers already using VoyageGo
            </p>
            <div
              style={{ display: "flex", gap: "14px", justifyContent: "center" }}
            >
              <button
                onClick={() => navigate("/register")}
                style={{
                  padding: "15px 32px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg,#F97316,#EA580C)",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Sign Up Free
              </button>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "15px 32px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#e2e8f0",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
