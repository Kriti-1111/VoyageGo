import { useNavigate } from "react-router-dom";

function FeatureIcon({ type }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const icons = {
    vehicle: (
      <svg {...props} stroke="#6366f1">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    driver: (
      <svg {...props} stroke="#6366f1">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    booking: (
      <svg {...props} stroke="#6366f1">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    secure: (
      <svg {...props} stroke="#6366f1">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    tracking: (
      <svg {...props} stroke="#6366f1">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    rating: (
      <svg {...props} stroke="#6366f1">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  };
  return icons[type] || icons.vehicle;
}

function StepIcon({ type }) {
  const props = {
    width: 24,
    height: 24,
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
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      {/* Hero */}
      <section
        style={{
          background:
            "linear-gradient(135deg,#0f172a 0%,#1e1b4b 55%,#3730a3 100%)",
          padding: "100px 32px 120px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(99,102,241,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-60px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(139,92,246,0.1)",
          }}
        />
        <div
          style={{ maxWidth: "700px", margin: "0 auto", position: "relative" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "20px",
              padding: "6px 16px",
              marginBottom: "24px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                background: "#a5b4fc",
                borderRadius: "50%",
              }}
            />
            <span
              style={{ fontSize: "13px", color: "#a5b4fc", fontWeight: "600" }}
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
                background: "linear-gradient(135deg,#a5b4fc,#c4b5fd)",
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
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "#fff",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
                boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 32px rgba(99,102,241,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(99,102,241,0.4)";
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

      {/* Stats bar */}
      <section
        style={{
          background: "#fff",
          borderBottom: "1px solid #f1f5f9",
          padding: "32px",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: "32px",
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
                  fontSize: "32px",
                  fontWeight: "800",
                  color: "#6366f1",
                  margin: 0,
                  letterSpacing: "-1px",
                }}
              >
                {s.value}
              </p>
              <p
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  margin: "4px 0 0",
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
      <section style={{ padding: "80px 32px", background: "#f8fafc" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2
              style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "#0f172a",
                margin: "0 0 12px",
                letterSpacing: "-0.5px",
              }}
            >
              Why choose VoyageGo?
            </h2>
            <p style={{ fontSize: "16px", color: "#64748b", margin: 0 }}>
              Everything you need for stress-free travel
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: "20px",
            }}
          >
            {[
              {
                icon: "vehicle",
                bg: "#eef2ff",
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
                  padding: "24px",
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
                    width: "48px",
                    height: "48px",
                    background: f.bg,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <FeatureIcon type={f.icon} />
                </div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: "700",
                    color: "#0f172a",
                    margin: "0 0 8px",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    margin: 0,
                    lineHeight: 1.6,
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
      <section style={{ padding: "80px 32px", background: "#fff" }}>
        <div
          style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}
        >
          <h2
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: "#0f172a",
              margin: "0 0 12px",
              letterSpacing: "-0.5px",
            }}
          >
            How it works
          </h2>
          <p style={{ fontSize: "16px", color: "#64748b", margin: "0 0 56px" }}>
            Get on the road in 3 simple steps
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: "32px",
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
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
                  }}
                >
                  <StepIcon type={s.icon} />
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    color: "#6366f1",
                    letterSpacing: "1.5px",
                  }}
                >
                  STEP {s.step}
                </span>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — guests only */}
      {!user && (
        <section
          style={{
            background: "linear-gradient(135deg,#0f172a,#1e1b4b)",
            padding: "80px 32px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "#fff",
                margin: "0 0 12px",
                letterSpacing: "-0.5px",
              }}
            >
              Ready to get started?
            </h2>
            <p
              style={{ fontSize: "16px", color: "#94a3b8", margin: "0 0 32px" }}
            >
              Join thousands of travellers already using VoyageGo
            </p>
            <div
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
            >
              <button
                onClick={() => navigate("/register")}
                style={{
                  padding: "13px 28px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Sign Up Free
              </button>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "13px 28px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#e2e8f0",
                  fontSize: "15px",
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
