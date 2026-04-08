import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaChevronDown,
  FaSignOutAlt,
  FaTachometerAlt,
  FaHome,
  FaCar,
  FaUserTie,
} from "react-icons/fa";
import axios from "axios";

const API = "http://localhost:5000";

const ROLE_CONFIG = {
  OWNER: {
    label: "Owner",
    color: "#EA580C",
    dashTo: "/management",
    dashLabel: "Dashboard",
  },
  ADMIN: {
    label: "Admin",
    color: "#F97316",
    dashTo: "/management",
    dashLabel: "Dashboard",
  },
  STAFF: {
    label: "Staff",
    color: "#0891b2",
    dashTo: "/management",
    dashLabel: "Dashboard",
  },
  DRIVER: {
    label: "Driver",
    color: "#f59e0b",
    dashTo: "/driver",
    dashLabel: "My Dashboard",
  },
  CUSTOMER: {
    label: "Customer",
    color: "#10b981",
    dashTo: "/customer",
    dashLabel: "My Bookings",
  },
};

const PUBLIC_NAV = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore Vehicles" },
  { to: "/drivers", label: "Explore Drivers" },
];

// ── Notification type config ──────────────────────────────────────────────────
const NOTIF_STYLE = {
  DRIVER_ACCEPTED: { dot: "#3b82f6", icon: "✓" },
  DRIVER_REJECTED: { dot: "#ef4444", icon: "✕" },
  BOOKING_ACTIVATED: { dot: "#22c55e", icon: "▶" },
  BOOKING_CANCELLED: { dot: "#ef4444", icon: "✕" },
  PAYMENT_CONFIRMED: { dot: "#F97316", icon: "$" },
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropRef = useRef(null);
  const bellRef = useRef(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  const token = localStorage.getItem("token");
  const role = user?.role || "GUEST";
  const cfg = ROLE_CONFIG[role];

  const [dropOpen, setDropOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [loadNotifs, setLoadNotifs] = useState(false);

  const unread = notifs.filter((n) => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setDropOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target))
        setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => {
    setDropOpen(false);
    setBellOpen(false);
  }, [location.pathname]);

  // Poll notifications every 60s when logged in
  useEffect(() => {
    if (!user || !token) return;
    fetchNotifs();
    const id = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  async function fetchNotifs() {
    if (!token) return;
    try {
      setLoadNotifs(true);
      const { data } = await axios.get(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifs(Array.isArray(data) ? data : []);
    } catch {
      /* silent */
    } finally {
      setLoadNotifs(false);
    }
  }

  async function markRead(id) {
    try {
      await axios.patch(
        `${API}/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNotifs((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
    } catch {
      /* silent */
    }
  }

  async function markAllRead() {
    try {
      await axios.patch(
        `${API}/api/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* silent */
    }
  }

  function handleBellClick() {
    setBellOpen((o) => !o);
    setDropOpen(false);
    if (!bellOpen) fetchNotifs(); // refresh on open
  }

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
        {/* Logo */}
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
              background: "linear-gradient(135deg,#F97316,#EA580C)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="1" y="3" width="15" height="13" rx="2" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
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

        {/* Center nav */}
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
          {cfg && (
            <NavLink
              to={cfg.dashTo}
              active={location.pathname.startsWith(cfg.dashTo)}
              label={cfg.dashLabel}
              accent
            />
          )}
        </nav>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {user ? (
            <>
              {/* Notification bell */}
              <div ref={bellRef} style={{ position: "relative" }}>
                <button
                  onClick={handleBellClick}
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    background: bellOpen ? "#FFF7ED" : "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={bellOpen ? "#F97316" : "currentColor"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                  {unread > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -3,
                        right: -3,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #fff",
                      }}
                    >
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                {bellOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      background: "#fff",
                      border: "1px solid #f1f5f9",
                      borderRadius: 14,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                      width: 340,
                      zIndex: 300,
                      overflow: "hidden",
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "#fafafa",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          Notifications
                        </span>
                        {unread > 0 && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: "#ef4444",
                              color: "#fff",
                              borderRadius: 20,
                              padding: "1px 6px",
                            }}
                          >
                            {unread}
                          </span>
                        )}
                      </div>
                      {unread > 0 && (
                        <button
                          onClick={markAllRead}
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
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div style={{ maxHeight: 360, overflowY: "auto" }}>
                      {loadNotifs && notifs.length === 0 && (
                        <p
                          style={{
                            textAlign: "center",
                            padding: "24px",
                            color: "#94a3b8",
                            fontSize: 13,
                          }}
                        >
                          Loading…
                        </p>
                      )}

                      {!loadNotifs && notifs.length === 0 && (
                        <div
                          style={{ textAlign: "center", padding: "36px 24px" }}
                        >
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#cbd5e1"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ margin: "0 auto 10px", display: "block" }}
                          >
                            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 01-3.46 0" />
                          </svg>
                          <p
                            style={{
                              color: "#64748b",
                              fontWeight: 600,
                              fontSize: 13,
                              margin: 0,
                            }}
                          >
                            No notifications yet
                          </p>
                          <p
                            style={{
                              color: "#94a3b8",
                              fontSize: 12,
                              marginTop: 4,
                            }}
                          >
                            Updates about your bookings will appear here.
                          </p>
                        </div>
                      )}

                      {notifs.map((n) => {
                        const style = NOTIF_STYLE[n.type] || {
                          dot: "#94a3b8",
                          icon: "·",
                        };
                        return (
                          <div
                            key={n._id}
                            onClick={() => {
                              markRead(n._id);
                              if (n.booking && role === "CUSTOMER")
                                navigate("/customer");
                              setBellOpen(false);
                            }}
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #f8fafc",
                              cursor: "pointer",
                              background: n.read ? "#fff" : "#f8faff",
                              display: "flex",
                              gap: 12,
                              alignItems: "flex-start",
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#f8fafc")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = n.read
                                ? "#fff"
                                : "#f8faff")
                            }
                          >
                            {/* Dot indicator */}
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: style.dot + "18",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: 2,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: style.dot,
                                }}
                              >
                                {style.icon}
                              </span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  margin: "0 0 2px",
                                  fontSize: 13,
                                  fontWeight: n.read ? 500 : 700,
                                  color: "#0f172a",
                                  lineHeight: 1.4,
                                }}
                              >
                                {n.title}
                              </p>
                              <p
                                style={{
                                  margin: "0 0 4px",
                                  fontSize: 12,
                                  color: "#64748b",
                                  lineHeight: 1.5,
                                }}
                              >
                                {n.message}
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: "#94a3b8",
                                }}
                              >
                                {timeAgo(n.createdAt)}
                              </p>
                            </div>
                            {!n.read && (
                              <span
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: "50%",
                                  background: "#F97316",
                                  flexShrink: 0,
                                  marginTop: 5,
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {notifs.length > 0 && (
                      <div
                        style={{
                          padding: "10px 16px",
                          borderTop: "1px solid #f1f5f9",
                          background: "#fafafa",
                          textAlign: "center",
                        }}
                      >
                        <button
                          onClick={() => {
                            setBellOpen(false);
                            navigate(cfg?.dashTo || "/");
                          }}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#F97316",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          View all in dashboard
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div ref={dropRef} style={{ position: "relative" }}>
                <button
                  onClick={() => {
                    setDropOpen(!dropOpen);
                    setBellOpen(false);
                  }}
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
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: `linear-gradient(135deg,${cfg?.color || "#F97316"},${cfg?.color || "#EA580C"}88)`,
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
                            background: `linear-gradient(135deg,${cfg?.color || "#F97316"},${cfg?.color || "#EA580C"}88)`,
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
                    </div>

                    {cfg && (
                      <DropItem
                        to={cfg.dashTo}
                        icon={<FaTachometerAlt />}
                        label={cfg.dashLabel}
                        onClick={() => setDropOpen(false)}
                      />
                    )}
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
                  e.currentTarget.style.borderColor = "#FDBA74";
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
                  background: "linear-gradient(135deg,#F97316,#EA580C)",
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

function NavLink({ to, active, label, accent }) {
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
        color: active ? "#F97316" : "#64748b",
        background: active ? "#FFF7ED" : "transparent",
        transition: "all 0.15s",
        border:
          accent && !active ? "1px dashed #FDBA74" : "1px solid transparent",
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
      <span style={{ color: "#F97316", fontSize: "12px" }}>{icon}</span>
      {label}
    </Link>
  );
}
