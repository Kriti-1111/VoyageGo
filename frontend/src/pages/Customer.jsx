import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLE = {
  PendingPayment: {
    bg: "#FFF7ED",
    color: "#EA580C",
    dot: "#3b82f6",
    border: "#FDBA74",
    label: "Pay now",
  },
  PendingDriver: {
    bg: "#fffbeb",
    color: "#b45309",
    dot: "#f59e0b",
    border: "#fde68a",
    label: "Awaiting driver",
  },
  Confirmed: {
    bg: "#FFF7ED",
    color: "#EA580C",
    dot: "#3b82f6",
    border: "#FDBA74",
    label: "Confirmed",
  },
  Active: {
    bg: "#f0fdf4",
    color: "#15803d",
    dot: "#22c55e",
    border: "#bbf7d0",
    label: "Active",
  },
  Completed: {
    bg: "#f8fafc",
    color: "#475569",
    dot: "#94a3b8",
    border: "#e2e8f0",
    label: "Completed",
  },
  Cancelled: {
    bg: "#fff1f2",
    color: "#be123c",
    dot: "#f43f5e",
    border: "#fecdd3",
    label: "Cancelled",
  },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.PendingDriver;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }}
      />
      {s.label}
    </span>
  );
}

function BookingActions({ booking, onCancel, navigate }) {
  const id = booking._id || booking.id;

  // Self-drive: waiting for payment → show pay button directly
  if (booking.status === "PendingPayment") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          onClick={() => navigate(`/payment/${id}`)}
          style={{
            padding: "11px 18px",
            borderRadius: 9,
            border: "none",
            background: "linear-gradient(135deg,#F97316,#EA580C)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          Pay Rs {(booking.totalPrice || 0).toLocaleString()} to confirm
        </button>
        <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
          Self-drive ·{" "}
          {booking.pickupType === "delivery"
            ? `📦 Delivery to: ${booking.pickupLocation || "your address"}`
            : "🏢 You collect the vehicle"}
        </p>
        <button
          onClick={() => onCancel(id)}
          style={actionBtn("#dc2626", "#fff1f2", "#fca5a5")}
        >
          Cancel booking
        </button>
      </div>
    );
  }

  // With-driver: waiting for driver to accept
  if (booking.status === "PendingDriver") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 9,
            background: "#fffbeb",
            border: "1px solid #fde68a",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color: "#b45309",
            }}
          >
            Waiting for driver confirmation
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#a16207" }}>
            A driver has been assigned and will respond shortly.
          </p>
        </div>
        <button
          onClick={() => onCancel(id)}
          style={actionBtn("#dc2626", "#fff1f2", "#fca5a5")}
        >
          Cancel booking
        </button>
      </div>
    );
  }

  // With-driver: driver confirmed, now pay
  if (booking.status === "Confirmed") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          onClick={() => navigate(`/payment/${id}`)}
          style={{
            padding: "10px 18px",
            borderRadius: 9,
            border: "none",
            background: "linear-gradient(135deg,#F97316,#EA580C)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          Pay Rs {(booking.totalPrice || 0).toLocaleString()} to activate
        </button>
        <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
          Driver confirmed — pay now to start your trip
        </p>
      </div>
    );
  }

  if (booking.status === "Active") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          onClick={() => navigate(`/booking/${id}/return`)}
          style={actionBtn("#F97316", "#FFF7ED", "#FDBA74")}
        >
          Return vehicle
        </button>
        <button
          onClick={() => navigate(`/booking/${id}/condition-report`)}
          style={{
            padding: "8px 16px",
            borderRadius: 9,
            border: "1.5px solid #FDBA74",
            background: "#FFF7ED",
            color: "#EA580C",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          📋 Report vehicle condition{" "}
          <span style={{ fontWeight: 400, fontSize: 11 }}>(optional)</span>
        </button>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          Protect yourself by documenting any scratches or issues
        </p>
      </div>
    );
  }

  if (booking.status === "Cancelled") {
    return (
      <button
        onClick={() => navigate("/explore")}
        style={actionBtn("#F97316", "#FFF7ED", "#FDBA74")}
      >
        Book another vehicle
      </button>
    );
  }

  return null;
}

function actionBtn(color, bg, border) {
  return {
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    border: `1px solid ${border}`,
    background: bg,
    color,
    whiteSpace: "nowrap",
  };
}

function BookingCard({ booking, onCancel, navigate }) {
  const [open, setOpen] = useState(false);
  const needsPayment = ["PendingPayment", "Confirmed"].includes(booking.status);
  const isPendingDriver = booking.status === "PendingDriver";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        overflow: "hidden",
        border: `1.5px solid ${needsPayment ? "#F97316" : isPendingDriver ? "#fde68a" : "#f1f5f9"}`,
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
    >
      {needsPayment && (
        <div
          style={{
            background:
              booking.status === "PendingPayment" ? "#3b82f6" : "#F97316",
            padding: "5px 16px",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.04em",
            }}
          >
            {booking.status === "PendingPayment"
              ? "ACTION REQUIRED — pay to confirm your self-drive booking"
              : "ACTION REQUIRED — driver confirmed, pay to activate"}
          </span>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              flexShrink: 0,
              background: "linear-gradient(135deg,#FFF7ED,#f5f3ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {booking.vehicle?.imageUrl ? (
              <img
                src={booking.vehicle.imageUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 16, fontWeight: 700, color: "#F97316" }}>
                {(booking.vehicle?.name || "V")[0]}
              </span>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontWeight: 700,
                color: "#0f172a",
                margin: "0 0 2px",
                fontSize: 14,
              }}
            >
              {booking.vehicle?.name || "Vehicle"}
            </p>
            <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>
              Rs {(booking.totalPrice || 0).toLocaleString()}
              {booking.requiresDriver === false
                ? " · Self-drive"
                : booking.driver
                  ? ` · ${booking.driver.name}`
                  : " · Driver pending"}
            </p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <StatusBadge status={booking.status} />
          <span style={{ color: "#94a3b8", fontSize: 11 }}>
            {open ? "▲" : "▼"}
          </span>
        </div>
      </button>

      <div
        style={{
          padding: "0 20px 12px",
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "#64748b",
            background: "#f8fafc",
            padding: "3px 9px",
            borderRadius: 6,
          }}
        >
          {fmtDate(booking.startDate)}
        </span>
        <span style={{ color: "#94a3b8", fontSize: 11 }}>to</span>
        <span
          style={{
            fontSize: 12,
            color: "#64748b",
            background: "#f8fafc",
            padding: "3px 9px",
            borderRadius: 6,
          }}
        >
          {fmtDate(booking.endDate)}
        </span>
      </div>

      {open && (
        <div
          style={{ padding: "14px 20px 18px", borderTop: "1px solid #f1f5f9" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {[
              { label: "Vehicle", value: booking.vehicle?.name },
              { label: "Plate", value: booking.vehicle?.plateNumber },
              { label: "Type", value: booking.vehicle?.type },
              {
                label: "Total",
                value: `Rs ${(booking.totalPrice || 0).toLocaleString()}`,
              },
              {
                label: "Mode",
                value:
                  booking.requiresDriver === false
                    ? "Self-drive"
                    : "With driver",
              },
              {
                label: "Pickup",
                value:
                  booking.requiresDriver === false
                    ? booking.pickupType === "delivery"
                      ? `Delivery → ${booking.pickupLocation || "address"}`
                      : "Self pickup"
                    : booking.driver?.name || "Awaiting driver",
              },
              { label: "Payment", value: booking.paymentStatus || "Unpaid" },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: "#f8fafc",
                  borderRadius: 8,
                  padding: "10px 12px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "#94a3b8",
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>
          {booking.notes && (
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 14,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "#94a3b8",
                }}
              >
                Notes
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#334155" }}>
                {booking.notes}
              </p>
            </div>
          )}
          <BookingActions
            booking={booking}
            onCancel={onCancel}
            navigate={navigate}
          />
        </div>
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
        border: "1px solid #f1f5f9",
        padding: "16px 20px",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: "#e2e8f0",
            animation: "pulse 1.4s infinite",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: 14,
              width: "40%",
              background: "#e2e8f0",
              borderRadius: 6,
              marginBottom: 8,
              animation: "pulse 1.4s infinite",
            }}
          />
          <div
            style={{
              height: 11,
              width: "60%",
              background: "#e2e8f0",
              borderRadius: 6,
              animation: "pulse 1.4s infinite 0.2s",
            }}
          />
        </div>
      </div>
    </div>
  );
}

const TABS = [
  {
    key: "pending",
    label: "Pending",
    statuses: ["PendingPayment", "PendingDriver", "Confirmed"],
  },
  { key: "active", label: "Active", statuses: ["Active"] },
  { key: "completed", label: "Completed", statuses: ["Completed"] },
  { key: "cancelled", label: "Cancelled", statuses: ["Cancelled"] },
];

export default function Customer() {
  const navigate = useNavigate();
  const user = getUser();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    fetchBookings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchBookings() {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/api/bookings/my`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      showToast("Could not load bookings.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking(id) {
    try {
      await axios.patch(
        `${API}/api/bookings/${id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      showToast("Booking cancelled.", "success");
      fetchBookings();
    } catch (e) {
      showToast(e.response?.data?.message || "Could not cancel.", "error");
    }
  }

  function showToast(msg, type) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  const visible = bookings.filter((b) =>
    TABS.find((t) => t.key === tab)?.statuses.includes(b.status),
  );
  const needsAction = bookings.filter((b) => b.status === "Confirmed").length;
  const pendingCount = bookings.filter((b) =>
    ["PendingPayment", "PendingDriver", "Confirmed"].includes(b.status),
  ).length;
  const activeCount = bookings.filter((b) => b.status === "Active").length;

  const STATS = [
    { label: "Active trips", value: activeCount, color: "#16a34a" },
    { label: "Pending", value: pendingCount, color: "#f59e0b" },
    {
      label: "Completed",
      value: bookings.filter((b) => b.status === "Completed").length,
      color: "#F97316",
    },
    { label: "Total bookings", value: bookings.length, color: "#3b82f6" },
  ];

  return (
    <>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}} *{box-sizing:border-box;}`}</style>
      <div
        style={{
          background: "#f8fafc",
          minHeight: "100%",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg,#0f172a,#1e293b)",
            padding: "32px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "rgba(30,58,138,0.1)",
            }}
          />
          <div
            style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}
          >
            <p
              style={{
                color: "#94a3b8",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                margin: "0 0 4px",
              }}
            >
              Customer Panel
            </p>
            <h1
              style={{
                color: "#fff",
                fontSize: 26,
                fontWeight: 800,
                margin: "0 0 4px",
                letterSpacing: "-0.3px",
              }}
            >
              {user?.name
                ? `Welcome, ${user.name.split(" ")[0]}`
                : "My Dashboard"}
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
              {user?.email}
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
          {/* Pay now banner */}
          {needsAction > 0 && (
            <div
              style={{
                background: "linear-gradient(135deg,#F97316,#EA580C)",
                borderRadius: 12,
                padding: "14px 20px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {needsAction} booking{needsAction > 1 ? "s" : ""} ready for
                  payment
                </p>
                <p
                  style={{ margin: "2px 0 0", fontSize: 12, color: "#FDBA74" }}
                >
                  Pay now to activate instantly.
                </p>
              </div>
              <button
                onClick={() => setTab("pending")}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Pay now
              </button>
            </div>
          )}

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: 14,
              marginBottom: 28,
            }}
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: "18px 20px",
                  border: "1px solid #f1f5f9",
                }}
              >
                <p
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: s.color,
                    margin: 0,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {s.value}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => navigate("/explore")}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg,#F97316,#EA580C)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Book a vehicle
            </button>
            <button
              onClick={fetchBookings}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "#fff",
                color: "#334155",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 4,
              background: "#fff",
              border: "1px solid #f1f5f9",
              borderRadius: 12,
              padding: 4,
              marginBottom: 20,
            }}
          >
            {TABS.map((t) => {
              const active = tab === t.key;
              const count = bookings.filter((b) =>
                t.statuses.includes(b.status),
              ).length;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    flex: 1,
                    padding: "8px 14px",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? "#0f172a" : "#64748b",
                    background: active ? "#f8fafc" : "transparent",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {t.label}
                  {count > 0 && (
                    <span
                      style={{
                        background:
                          t.key === "pending"
                            ? needsAction > 0
                              ? "#F97316"
                              : "#f59e0b"
                            : t.key === "active"
                              ? "#22c55e"
                              : "#e2e8f0",
                        color:
                          t.key === "pending" || t.key === "active"
                            ? "#fff"
                            : "#64748b",
                        borderRadius: 20,
                        padding: "1px 7px",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Booking list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {loading && [0, 1, 2].map((i) => <SkeletonCard key={i} />)}

            {!loading && visible.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "56px 24px",
                  background: "#fff",
                  borderRadius: 14,
                  border: "1px solid #f1f5f9",
                  color: "#64748b",
                }}
              >
                <p
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 6,
                    fontSize: 15,
                  }}
                >
                  No {tab} bookings
                </p>
                <p style={{ fontSize: 13, margin: 0 }}>
                  {tab === "pending" &&
                    "Bookings waiting for driver or payment appear here."}
                  {tab === "active" && "Your active trips appear here."}
                  {tab === "completed" && "Finished trips appear here."}
                  {tab === "cancelled" && "Cancelled bookings appear here."}
                </p>
                {(tab === "pending" || tab === "active") && (
                  <button
                    onClick={() => navigate("/explore")}
                    style={{
                      marginTop: 16,
                      padding: "9px 20px",
                      borderRadius: 9,
                      border: "none",
                      background: "linear-gradient(135deg,#F97316,#EA580C)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Browse vehicles
                  </button>
                )}
              </div>
            )}

            {!loading &&
              visible.map((b) => (
                <BookingCard
                  key={b._id || b.id}
                  booking={b}
                  onCancel={cancelBooking}
                  navigate={navigate}
                />
              ))}
          </div>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: 12,
            background: toast.type === "success" ? "#059669" : "#dc2626",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}
