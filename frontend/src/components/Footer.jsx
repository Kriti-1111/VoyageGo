import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#d16314f1",
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Main Footer Content */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "48px 32px 40px",
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: "40px",
        }}
      >
        {/* Brand Column */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
              }}
            ></div>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#fff",
                letterSpacing: "-0.3px",
              }}
            >
              VoyageGo
            </span>
          </div>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.9)",
              lineHeight: "1.7",
              maxWidth: "280px",
              margin: 0,
            }}
          >
            Reliable vehicle rental service for personal and business travel
            across Nepal.
          </p>

          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "20px",
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "20px",
              padding: "5px 12px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                background: "#ffffff",
                borderRadius: "50%",
              }}
            />
            <span
              style={{ fontSize: "12px", color: "#ffffff", fontWeight: "500" }}
            >
              Available 24/7
            </span>
          </div>
        </div>

        {/* Services Column */}
        <div>
          <h4
            style={{
              fontSize: "13px",
              fontWeight: "700",
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: "16px",
            }}
          >
            Services
          </h4>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {[
              "Car Rentals",
              "Driver Rentals",
              "Airport Pickup",
              "Corporate Travel",
            ].map((item) => (
              <li key={item}>
                <span
                  style={{
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.9)",
                    transition: "color 0.15s",
                    cursor: "default",
                  }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Column */}
        <div>
          <h4
            style={{
              fontSize: "13px",
              fontWeight: "700",
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: "16px",
            }}
          >
            Contact
          </h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {[
              { label: "", value: "Kathmandu, Nepal" },
              { label: "", value: "support@voyagego.com" },
              { label: "", value: "+977 01-000-0000" },
            ].map((item) => (
              <div
                key={item.value}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "13px" }}>{item.label}</span>
                <span
                  style={{
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            color: "rgba(255, 255, 255, 0.8)",
            margin: 0,
          }}
        >
          © {new Date().getFullYear()} VoyageGo. All rights reserved.
        </p>
        <div style={{ display: "flex", gap: "20px" }}>
          {["Privacy Policy", "Terms of Service"].map((item) => (
            <span
              key={item}
              style={{
                fontSize: "13px",
                color: "rgba(255, 255, 255, 0.8)",
                cursor: "pointer",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)")
              }
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
