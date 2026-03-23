import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaBell,
  FaChevronDown,
  FaSignOutAlt,
  FaTachometerAlt,
  FaHome,
  FaCar,
  FaUserTie,
} from "react-icons/fa";

const ROLE_CONFIG = {
  OWNER: {
    label: "Owner",
    badge: "👑",
    color: "#7c3aed",
    dashTo: "/management",
    dashLabel: "Dashboard",
  },
  ADMIN: {
    label: "Admin",
    badge: "⚙️",
    color: "#6366f1",
    dashTo: "/management",
    dashLabel: "Dashboard",
  },
  STAFF: {
    label: "Staff",
    badge: "🛡️",
    color: "#0891b2",
    dashTo: "/management",
    dashLabel: "Dashboard",
  },
  DRIVER: {
    label: "Driver",
    badge: "🧑‍✈️",
    color: "#f59e0b",
    dashTo: "/driver",
    dashLabel: "My Dashboard",
  },
  CUSTOMER: {
    label: "Customer",
    badge: "👤",
    color: "#10b981",
    dashTo: "/customer",
    dashLabel: "My Bookings",
  },
};

// All roles (including admin/staff/driver) can always reach public pages
const PUBLIC_NAV = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore Vehicles" },
  { to: "/drivers", label: "Explore Drivers" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropRef = useRef(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  const role = user?.role || "GUEST";
  const cfg = ROLE_CONFIG[role];

  const [dropOpen, setDropOpen] = useState(false);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => {
    setDropOpen(false);
  }, [location.pathname]);

  const logout = () => {
    localStorage.clear();
    setDropOpen(false);
    navigate("/");
  };

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  return (
    <header
      style={{
        background: "#fff",
        borderBottom: "1px solid #f1f5f9",
        position: "sticky",
        top: 0,
        zIndex: 200,
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 32px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
        }}
      >
        {/* ── Logo ── */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            🚗
          </div>
          <span
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#0f172a",
              letterSpacing: "-0.3px",
            }}
          >
            VoyageGo
          </span>
        </Link>

        {/* ── Center nav — PUBLIC links visible to ALL roles ── */}
        <nav
          style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}
        >
          {PUBLIC_NAV.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              active={isActive(link.to)}
              label={link.label}
            />
          ))}
          {/* Dashboard shortcut for logged-in users */}
          {cfg && (
            <NavLink
              to={cfg.dashTo}
              active={location.pathname.startsWith(cfg.dashTo)}
              label={cfg.dashLabel}
              icon={<FaTachometerAlt style={{ fontSize: "11px" }} />}
              accent
            />
          )}
        </nav>

        {/* ── Right side ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {user ? (
            <>
              {/* Bell */}
              <button
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  fontSize: "15px",
                  flexShrink: 0,
                }}
              >
                <FaBell />
              </button>

              {/* Profile dropdown */}
              <div ref={dropRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 10px 6px 6px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f8fafc")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#fff")
                  }
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: `linear-gradient(135deg,${cfg?.color || "#6366f1"},${cfg?.color || "#8b5cf6"}88)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: "700",
                      flexShrink: 0,
                    }}
                  >
                    {(user.name || user.email || "U")[0].toUpperCase()}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#0f172a",
                        margin: 0,
                        maxWidth: "90px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.2,
                      }}
                    >
                      {user.name || user.email}
                    </p>
                    <p
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        color: cfg?.color || "#94a3b8",
                        margin: 0,
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                        lineHeight: 1.2,
                      }}
                    >
                      {cfg?.label || role}
                    </p>
                  </div>
                  <FaChevronDown
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      transform: dropOpen ? "rotate(180deg)" : "rotate(0)",
                      transition: "transform 0.2s",
                      flexShrink: 0,
                    }}
                  />
                </button>

                {/* ── Dropdown ── */}
                {dropOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      background: "#fff",
                      border: "1px solid #f1f5f9",
                      borderRadius: "14px",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                      minWidth: "220px",
                      overflow: "hidden",
                      zIndex: 300,
                    }}
                  >
                    {/* User info */}
                    <div
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid #f1f5f9",
                        background: "#fafafa",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: `linear-gradient(135deg,${cfg?.color || "#6366f1"},${cfg?.color || "#8b5cf6"}88)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "15px",
                            fontWeight: "700",
                            flexShrink: 0,
                          }}
                        >
                          {(user.name || user.email || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: "13px",
                              fontWeight: "700",
                              color: "#0f172a",
                              margin: 0,
                            }}
                          >
                            {user.name || "User"}
                          </p>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "#94a3b8",
                              margin: "1px 0 0",
                              maxWidth: "140px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "8px",
                          fontSize: "10px",
                          fontWeight: "700",
                          padding: "2px 9px",
                          borderRadius: "20px",
                          background: (cfg?.color || "#6366f1") + "18",
                          color: cfg?.color || "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {cfg?.badge} {cfg?.label}
                      </span>
                    </div>

                    {/* Dashboard */}
                    {cfg && (
                      <DropItem
                        to={cfg.dashTo}
                        icon={<FaTachometerAlt />}
                        label={cfg.dashLabel}
                        onClick={() => setDropOpen(false)}
                      />
                    )}

                    {/* Public pages — always accessible regardless of role */}
                    <DropItem
                      to="/"
                      icon={<FaHome />}
                      label="Home"
                      onClick={() => setDropOpen(false)}
                    />
                    <DropItem
                      to="/explore"
                      icon={<FaCar />}
                      label="Explore Vehicles"
                      onClick={() => setDropOpen(false)}
                    />
                    <DropItem
                      to="/drivers"
                      icon={<FaUserTie />}
                      label="Explore Drivers"
                      onClick={() => setDropOpen(false)}
                    />

                    {/* Sign out — always last, always red */}
                    <div style={{ borderTop: "1px solid #f1f5f9" }}>
                      <button
                        onClick={logout}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "12px 16px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#ef4444",
                          textAlign: "left",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#fef2f2")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <FaSignOutAlt style={{ fontSize: "13px" }} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Guest */
            <div style={{ display: "flex", gap: "8px" }}>
              <Link
                to="/login"
                style={{
                  padding: "8px 18px",
                  borderRadius: "9px",
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  color: "#334155",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.borderColor = "#c7d2fe";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                style={{
                  padding: "8px 18px",
                  borderRadius: "9px",
                  border: "none",
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, active, label, icon, accent }) {
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "7px 14px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: active ? "700" : "500",
        textDecoration: "none",
        color: active ? "#6366f1" : "#64748b",
        background: active ? "#eef2ff" : "transparent",
        transition: "all 0.15s",
        border:
          accent && !active ? "1px dashed #c7d2fe" : "1px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "#f8fafc";
          e.currentTarget.style.color = "#0f172a";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#64748b";
        }
      }}
    >
      {icon}
      {label}
    </Link>
  );
}

function DropItem({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "11px 16px",
        fontSize: "13px",
        fontWeight: "500",
        color: "#334155",
        textDecoration: "none",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ color: "#6366f1", fontSize: "12px" }}>{icon}</span>
      {label}
    </Link>
  );
}
