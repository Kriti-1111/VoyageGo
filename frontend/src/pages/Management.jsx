import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaChartBar,
  FaCar,
  FaUsers,
  FaClipboardList,
  FaUserTie,
  FaShieldAlt,
  FaExclamationTriangle,
  FaFileAlt,
  FaCheckCircle,
  FaTachometerAlt,
  FaMoneyBillWave,
  FaSearch,
  FaBell,
  FaCheck,
  FaTimes,
  FaPlay,
  FaFlag,
  FaUserCheck,
  FaUserSlash,
} from "react-icons/fa";
import { ENDPOINTS, BASE_URL } from "../services/api.js";

const ROLE_CONFIG = {
  OWNER: { label: "Owner", color: "#7c3aed", bg: "#f5f3ff", badge: "👑" },
  ADMIN: { label: "Admin", color: "#6366f1", bg: "#eef2ff", badge: "⚙️" },
  STAFF: { label: "Staff", color: "#0891b2", bg: "#ecfeff", badge: "🛡️" },
};

const ALL_TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: <FaTachometerAlt />,
    roles: ["OWNER", "ADMIN", "STAFF"],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: <FaChartBar />,
    roles: ["OWNER"],
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: <FaClipboardList />,
    roles: ["OWNER", "ADMIN"],
  },
  {
    id: "vehicles",
    label: "Vehicles",
    icon: <FaCar />,
    roles: ["OWNER", "ADMIN"],
  },
  {
    id: "drivers",
    label: "Drivers",
    icon: <FaUserTie />,
    roles: ["OWNER", "ADMIN"],
  },
  {
    id: "customers",
    label: "Customers",
    icon: <FaUsers />,
    roles: ["OWNER", "ADMIN"],
  },
  {
    id: "documents",
    label: "Documents",
    icon: <FaFileAlt />,
    roles: ["OWNER", "STAFF"],
  },
  {
    id: "disputes",
    label: "Disputes",
    icon: <FaExclamationTriangle />,
    roles: ["OWNER", "STAFF"],
  },
  { id: "staff", label: "Staff Mgmt", icon: <FaShieldAlt />, roles: ["OWNER"] },
];

const card = {
  background: "#fff",
  borderRadius: "16px",
  border: "1px solid #f0f0f5",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  overflow: "hidden",
};

const STATUS_COLOR = {
  Pending: "#f59e0b",
  Accepted: "#3b82f6",
  Active: "#22c55e",
  Completed: "#94a3b8",
  Cancelled: "#ef4444",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function PanelHeader({ title, subtitle, action }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 24px",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <div>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#0f172a",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: "2px 0 0" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon, label, hint }) {
  return (
    <div style={{ padding: "56px 24px", textAlign: "center" }}>
      <div
        style={{
          width: "56px",
          height: "56px",
          background: "#f1f5f9",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 14px",
          fontSize: "22px",
          color: "#94a3b8",
        }}
      >
        {icon}
      </div>
      <p
        style={{
          color: "#64748b",
          fontWeight: "600",
          fontSize: "14px",
          margin: 0,
        }}
      >
        {label}
      </p>
      <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "6px" }}>
        {hint}
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: "48px" }}>
      <div
        style={{
          width: "28px",
          height: "28px",
          border: "3px solid #e2e8f0",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 10px",
        }}
      />
      <p style={{ color: "#94a3b8", fontSize: "13px" }}>Loading…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, accent }) {
  return (
    <div
      style={{
        ...card,
        padding: "24px",
        position: "relative",
        transition: "transform 0.2s,box-shadow 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "4px",
          height: "100%",
          background: accent,
          borderRadius: "16px 0 0 16px",
        }}
      />
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "10px",
          background: accent + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "17px",
          color: accent,
          marginBottom: "14px",
          marginLeft: "8px",
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: "26px",
          fontWeight: "800",
          color: "#0f172a",
          marginLeft: "8px",
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </h3>
      <p
        style={{
          fontSize: "13px",
          color: "#64748b",
          marginTop: "3px",
          fontWeight: "500",
          marginLeft: "8px",
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          marginTop: "4px",
          marginLeft: "8px",
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

// ─── BOOKINGS TABLE ────────────────────────────────────────────────────────────
function BookingsTable({ bookings, onStatusChange, showActions = false }) {
  const [loadingId, setLoadingId] = useState(null);

  const handleAction = async (bookingId, newStatus) => {
    setLoadingId(bookingId + newStatus);
    await onStatusChange(bookingId, newStatus);
    setLoadingId(null);
  };

  const getActions = (booking) => {
    const s = booking.status;
    if (s === "Pending")
      return [
        {
          label: "Approve",
          status: "Accepted",
          icon: <FaCheck />,
          color: "#22c55e",
          bg: "#f0fdf4",
        },
        {
          label: "Cancel",
          status: "Cancelled",
          icon: <FaTimes />,
          color: "#ef4444",
          bg: "#fff1f2",
        },
      ];
    if (s === "Accepted")
      return [
        {
          label: "Activate",
          status: "Active",
          icon: <FaPlay />,
          color: "#3b82f6",
          bg: "#eff6ff",
        },
        {
          label: "Cancel",
          status: "Cancelled",
          icon: <FaTimes />,
          color: "#ef4444",
          bg: "#fff1f2",
        },
      ];
    if (s === "Active")
      return [
        {
          label: "Complete",
          status: "Completed",
          icon: <FaFlag />,
          color: "#6366f1",
          bg: "#eef2ff",
        },
        {
          label: "Cancel",
          status: "Cancelled",
          icon: <FaTimes />,
          color: "#ef4444",
          bg: "#fff1f2",
        },
      ];
    return [];
  };

  const headers = showActions
    ? ["Customer", "Vehicle", "Status", "Total", "Date", "Actions"]
    : ["Customer", "Vehicle", "Status", "Total", "Date"];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 16px",
                  textAlign: "left",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b, i) => {
            const actions = showActions ? getActions(b) : [];
            return (
              <tr
                key={b._id || i}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f8fafc")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#0f172a",
                  }}
                >
                  {b.customer?.name || "N/A"}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: "13px",
                    color: "#334155",
                  }}
                >
                  {b.vehicle?.name || "Vehicle"}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: STATUS_COLOR[b.status] || "#94a3b8",
                      background: (STATUS_COLOR[b.status] || "#94a3b8") + "18",
                      padding: "3px 9px",
                      borderRadius: "20px",
                    }}
                  >
                    {b.status}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#0f172a",
                  }}
                >
                  Rs {(b.totalPrice || 0).toLocaleString()}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  {b.createdAt
                    ? new Date(b.createdAt).toLocaleDateString()
                    : "—"}
                </td>
                {showActions && (
                  <td style={{ padding: "10px 16px" }}>
                    {actions.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {actions.map((a) => {
                          const key = b._id + a.status;
                          const isLoading = loadingId === key;
                          return (
                            <button
                              key={a.status}
                              disabled={isLoading}
                              onClick={() => handleAction(b._id, a.status)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "5px 12px",
                                border: `1px solid ${a.color}40`,
                                borderRadius: "7px",
                                fontSize: "11px",
                                fontWeight: "700",
                                color: a.color,
                                background: a.bg,
                                cursor: isLoading ? "not-allowed" : "pointer",
                                opacity: isLoading ? 0.6 : 1,
                                transition: "all 0.15s",
                                whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => {
                                if (!isLoading) {
                                  e.currentTarget.style.background = a.color;
                                  e.currentTarget.style.color = "#fff";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isLoading) {
                                  e.currentTarget.style.background = a.bg;
                                  e.currentTarget.style.color = a.color;
                                }
                              }}
                            >
                              {isLoading ? (
                                "…"
                              ) : (
                                <>
                                  {a.icon} {a.label}
                                </>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#cbd5e1" }}>
                        —
                      </span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── OVERVIEW PANEL ───────────────────────────────────────────────────────────
function OverviewPanel({ role, bookings, vehicles, onStatusChange }) {
  const stats =
    role === "STAFF"
      ? [
          {
            title: "Documents to Review",
            value: "0",
            subtitle: "0 pending",
            icon: <FaFileAlt />,
            accent: "#f59e0b",
          },
          {
            title: "Open Disputes",
            value: "0",
            subtitle: "0 awaiting",
            icon: <FaExclamationTriangle />,
            accent: "#ef4444",
          },
          {
            title: "Resolved Today",
            value: "0",
            subtitle: "+0 this week",
            icon: <FaCheckCircle />,
            accent: "#10b981",
          },
        ]
      : [
          {
            title: "Total Revenue",
            value: "Rs 0",
            subtitle: "+Rs 0 this month",
            icon: <FaMoneyBillWave />,
            accent: "#6366f1",
          },
          {
            title: "Active Bookings",
            value: bookings.filter((b) =>
              ["Active", "Accepted"].includes(b.status),
            ).length,
            subtitle: `${bookings.filter((b) => b.status === "Pending").length} pending`,
            icon: <FaClipboardList />,
            accent: "#f59e0b",
          },
          {
            title: "Total Bookings",
            value: bookings.length,
            subtitle: `${bookings.filter((b) => b.status === "Completed").length} completed`,
            icon: <FaChartBar />,
            accent: "#10b981",
          },
          {
            title: "Fleet Size",
            value: vehicles.length,
            subtitle: "vehicles registered",
            icon: <FaCar />,
            accent: "#3b82f6",
          },
        ];
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: "18px",
          marginBottom: "28px",
        }}
      >
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>
      {role !== "STAFF" && (
        <div style={card}>
          <PanelHeader title="Recent Bookings" subtitle="Latest activity" />
          {bookings.length === 0 ? (
            <EmptyState
              icon={<FaClipboardList />}
              label="No bookings yet"
              hint="Bookings will appear here once customers make reservations."
            />
          ) : (
            <BookingsTable
              bookings={bookings.slice(0, 5)}
              onStatusChange={onStatusChange}
              showActions={true}
            />
          )}
        </div>
      )}
      {role === "STAFF" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "18px",
          }}
        >
          <div style={card}>
            <PanelHeader
              title="Pending Documents"
              subtitle="Customer & driver verifications"
            />
            <EmptyState
              icon={<FaFileAlt />}
              label="No documents pending"
              hint="Documents submitted for review appear here."
            />
          </div>
          <div style={card}>
            <PanelHeader
              title="Open Disputes"
              subtitle="Damage reports & complaints"
            />
            <EmptyState
              icon={<FaExclamationTriangle />}
              label="No open disputes"
              hint="Disputes raised by customers or drivers appear here."
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VEHICLES PANEL ───────────────────────────────────────────────────────────
function VehiclesPanel({ isAdmin }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "",
    model: "",
    company: "",
    pricePerHour: "",
    passengerSeat: "",
    fuelType: "",
    plateNumber: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchV();
  }, []);
  const fetchV = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(ENDPOINTS.VEHICLES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVehicles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const submit = async () => {
    setSubmitting(true);
    try {
      await axios.post(ENDPOINTS.VEHICLES, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowForm(false);
      setForm({
        name: "",
        type: "",
        model: "",
        pricePerHour: "",
        passengerSeat: "",
        fuelType: "",
        plateNumber: "",
        description: "",
      });
      fetchV();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to add vehicle");
    } finally {
      setSubmitting(false);
    }
  };
  const deleteV = async (id) => {
    if (!confirm("Delete this vehicle?")) return;
    try {
      await axios.delete(`${ENDPOINTS.VEHICLES}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchV();
    } catch {
      alert("Failed to delete");
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "17px",
              fontWeight: "700",
              color: "#0f172a",
              margin: 0,
            }}
          >
            Vehicle Management
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
            {vehicles.length} vehicles in fleet
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "9px 18px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            + Add Vehicle
          </button>
        )}
      </div>
      {showForm && isAdmin && (
        <div style={{ ...card, padding: "24px", marginBottom: "24px" }}>
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "#0f172a",
              margin: "0 0 18px",
            }}
          >
            Add New Vehicle
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: "12px",
            }}
          >
            {[
              { key: "name", label: "Vehicle Name", ph: "e.g. Toyota Hiace" },
              { key: "model", label: "Model / Year", ph: "e.g. 2020" },
              { key: "company", label: "Company", ph: "e.g. Toyota" },
              {
                key: "plateNumber",
                label: "Plate Number",
                ph: "BA 1 KHA 1234",
              },
              { key: "pricePerHour", label: "Price/Hour (Rs)", ph: "e.g. 500" },
              { key: "passengerSeat", label: "Seats", ph: "e.g. 8" },
            ].map(({ key, label, ph }) => (
              <div key={key}>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#64748b",
                    display: "block",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {label}
                </label>
                <input
                  value={form[key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [key]: e.target.value }))
                  }
                  placeholder={ph}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "#0f172a",
                    outline: "none",
                    background: "#f8fafc",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
            ))}
            <div>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#64748b",
                  display: "block",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, type: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "13px",
                  outline: "none",
                  background: "#f8fafc",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
              >
                <option value="" disabled>
                  Select type…
                </option>
                <option value="Car">Car</option>
                <option value="Van">Van</option>
                <option value="Bus">Bus</option>
                <option value="Truck">Truck</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#64748b",
                  display: "block",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Fuel Type
              </label>
              <select
                value={form.fuelType}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fuelType: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "13px",
                  outline: "none",
                  background: "#f8fafc",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
              >
                <option value="" disabled>
                  Select fuel type…
                </option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: "9px 20px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#64748b",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              style={{
                padding: "9px 20px",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#fff",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                cursor: "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Adding…" : "Add Vehicle"}
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <Spinner />
      ) : vehicles.length === 0 ? (
        <div style={card}>
          <EmptyState
            icon={<FaCar />}
            label="No vehicles yet"
            hint="Add vehicles to start accepting bookings."
          />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
            gap: "16px",
          }}
        >
          {vehicles.map((v) => (
            <div key={v._id || v.id} style={{ ...card, padding: "16px" }}>
              <div
                style={{
                  height: "130px",
                  background: "linear-gradient(135deg,#e0e7ff,#f5f3ff)",
                  borderRadius: "10px",
                  overflow: "hidden",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "36px",
                }}
              >
                {v.imageUrl ? (
                  <img
                    src={`${BASE_URL}/${v.imageUrl}`}
                    alt={v.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  "🚗"
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "#0f172a",
                      margin: "0 0 2px",
                    }}
                  >
                    {v.name}
                  </h3>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                    {v.type} · Rs {v.pricePerHour}/hr
                  </p>
                </div>
                <span
                  style={{
                    background: v.isActive ? "#f0fdf4" : "#fff1f2",
                    color: v.isActive ? "#15803d" : "#be123c",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "20px",
                  }}
                >
                  {v.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {isAdmin && (
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <button
                    style={{
                      flex: 1,
                      padding: "7px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "7px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6366f1",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteV(v._id || v.id)}
                    style={{
                      flex: 1,
                      padding: "7px",
                      border: "1px solid #fca5a5",
                      borderRadius: "7px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#dc2626",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DRIVERS PANEL ────────────────────────────────────────────────────────────
function DriversPanel({ isAdmin }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDrivers();
  }, []);
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(ENDPOINTS.DRIVERS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDrivers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const toggleVerify = async (driverId, currentStatus) => {
    setVerifyingId(driverId);
    try {
      const { data } = await axios.patch(
        `${ENDPOINTS.DRIVERS}/${driverId}/verify`,
        { isDriverVerified: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDrivers((prev) =>
        prev.map((d) =>
          d._id === driverId || d.id === driverId
            ? { ...d, isDriverVerified: data.driver.isDriverVerified }
            : d,
        ),
      );
    } catch (e) {
      alert(
        e.response?.data?.message || "Failed to update driver verification.",
      );
    } finally {
      setVerifyingId(null);
    }
  };

  const verifiedCount = drivers.filter((d) => d.isDriverVerified).length;
  const unverifiedCount = drivers.filter((d) => !d.isDriverVerified).length;
  const filtered =
    filter === "verified"
      ? drivers.filter((d) => d.isDriverVerified)
      : filter === "unverified"
        ? drivers.filter((d) => !d.isDriverVerified)
        : drivers;

  if (loading)
    return (
      <div style={card}>
        <Spinner />
      </div>
    );
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "17px",
              fontWeight: "700",
              color: "#0f172a",
              margin: 0,
            }}
          >
            Driver Management
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
            {drivers.length} registered drivers
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { key: "all", label: `All (${drivers.length})` },
            {
              key: "unverified",
              label: `Pending (${unverifiedCount})`,
              alert: unverifiedCount > 0,
            },
            { key: "verified", label: `Verified (${verifiedCount})` },
          ].map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "6px 14px",
                  border: `1px solid ${active ? "#6366f1" : f.alert ? "#f59e0b" : "#e2e8f0"}`,
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  background: active ? "#6366f1" : f.alert ? "#fffbeb" : "#fff",
                  color: active ? "#fff" : f.alert ? "#b45309" : "#64748b",
                  transition: "all 0.15s",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div style={card}>
          <EmptyState
            icon={<FaUserTie />}
            label="No drivers found"
            hint="No drivers match this filter."
          />
        </div>
      ) : (
        <div style={{ ...card, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {[
                  "Driver",
                  "Email",
                  "Phone",
                  "License No",
                  "Availability",
                  "Status",
                  ...(isAdmin ? ["Action"] : []),
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.6px",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const isVerified = d.isDriverVerified === true;
                const dId = d._id || d.id;
                const isLoading = verifyingId === dId;
                return (
                  <tr
                    key={dId || i}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f8fafc")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg,#6366f1,#8b5cf6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "13px",
                            fontWeight: "700",
                            flexShrink: 0,
                          }}
                        >
                          {(d.name || "D")[0].toUpperCase()}
                        </div>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#0f172a",
                          }}
                        >
                          {d.name || "—"}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "13px",
                        color: "#334155",
                      }}
                    >
                      {d.email || "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "13px",
                        color: "#334155",
                      }}
                    >
                      {d.phone || "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "13px",
                        color: "#334155",
                      }}
                    >
                      {d.licenseNo || "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 9px",
                          borderRadius: "20px",
                          background: d.isAvailable ? "#f0fdf4" : "#f1f5f9",
                          color: d.isAvailable ? "#15803d" : "#64748b",
                        }}
                      >
                        {d.isAvailable ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 9px",
                          borderRadius: "20px",
                          background: isVerified ? "#f0fdf4" : "#fffbeb",
                          color: isVerified ? "#15803d" : "#b45309",
                        }}
                      >
                        {isVerified ? "✓ Verified" : "⚠ Pending"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ padding: "10px 16px" }}>
                        <button
                          disabled={isLoading}
                          onClick={() => toggleVerify(dId, isVerified)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 14px",
                            border: `1px solid ${isVerified ? "#fca5a5" : "#86efac"}`,
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: isVerified ? "#dc2626" : "#15803d",
                            background: isVerified ? "#fff1f2" : "#f0fdf4",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            opacity: isLoading ? 0.6 : 1,
                            transition: "all 0.15s",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            if (!isLoading) {
                              e.currentTarget.style.background = isVerified
                                ? "#dc2626"
                                : "#15803d";
                              e.currentTarget.style.color = "#fff";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isLoading) {
                              e.currentTarget.style.background = isVerified
                                ? "#fff1f2"
                                : "#f0fdf4";
                              e.currentTarget.style.color = isVerified
                                ? "#dc2626"
                                : "#15803d";
                            }
                          }}
                        >
                          {isLoading ? (
                            "…"
                          ) : isVerified ? (
                            <>
                              <FaUserSlash /> Revoke
                            </>
                          ) : (
                            <>
                              <FaUserCheck /> Verify
                            </>
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── CUSTOMERS PANEL ──────────────────────────────────────────────────────────
function CustomersPanel() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(ENDPOINTS.CUSTOMERS, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setCustomers(Array.isArray(r.data) ? r.data : []))
      .catch((e) => {
        console.error("Failed to fetch customers:", e);
        setError(e.response?.data?.message || "Failed to load customers.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  if (loading)
    return (
      <div style={card}>
        <Spinner />
      </div>
    );
  if (error)
    return (
      <div style={card}>
        <EmptyState
          icon={<FaUsers />}
          label="Could not load customers"
          hint={error}
        />
      </div>
    );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "17px",
              fontWeight: "700",
              color: "#0f172a",
              margin: 0,
            }}
          >
            Customer Management
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
            {customers.length} registered customers
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "9px",
            padding: "7px 12px",
          }}
        >
          <FaSearch style={{ fontSize: "11px", color: "#94a3b8" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers…"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "13px",
              color: "#0f172a",
              width: "180px",
            }}
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div style={card}>
          <EmptyState
            icon={<FaUsers />}
            label="No customers found"
            hint={
              search
                ? "Try a different search term."
                : "Customers who register will appear here."
            }
          />
        </div>
      ) : (
        <div style={{ overflowX: "auto", ...card }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Name", "Email", "Phone", "Address", "Joined"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.6px",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c._id || i}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f8fafc")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg,#10b981,#34d399)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "13px",
                          fontWeight: "700",
                          flexShrink: 0,
                        }}
                      >
                        {(c.name || "C")[0].toUpperCase()}
                      </div>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#0f172a",
                        }}
                      >
                        {c.name || "—"}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "13px",
                      color: "#334155",
                    }}
                  >
                    {c.email || "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "13px",
                      color: "#334155",
                    }}
                  >
                    {c.phone || "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "13px",
                      color: "#64748b",
                      maxWidth: "200px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.permanentAddress || c.temporaryAddress || "—"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AnalyticsPanel() {
  return (
    <div>
      <h2
        style={{
          fontSize: "17px",
          fontWeight: "700",
          color: "#0f172a",
          margin: "0 0 20px",
        }}
      >
        Analytics & Reports
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: "16px",
        }}
      >
        {[
          {
            title: "Revenue This Month",
            value: "Rs 0",
            icon: "💰",
            color: "#6366f1",
          },
          {
            title: "Bookings This Week",
            value: "0",
            icon: "📅",
            color: "#f59e0b",
          },
          { title: "New Customers", value: "0", icon: "👥", color: "#10b981" },
          {
            title: "Fleet Utilization",
            value: "0%",
            icon: "🚗",
            color: "#3b82f6",
          },
        ].map((s) => (
          <div key={s.title} style={{ ...card, padding: "22px" }}>
            <span style={{ fontSize: "28px" }}>{s.icon}</span>
            <p
              style={{
                fontSize: "26px",
                fontWeight: "800",
                color: s.color,
                margin: "12px 0 4px",
              }}
            >
              {s.value}
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "#64748b",
                margin: 0,
                fontWeight: "500",
              }}
            >
              {s.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GenericPanel({ title, subtitle, icon, hint }) {
  return (
    <div style={card}>
      <PanelHeader title={title} subtitle={subtitle} />
      <EmptyState
        icon={icon}
        label={`No ${title.toLowerCase()} data yet`}
        hint={hint}
      />
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Management() {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  const role = user?.role || "STAFF";
  const roleCfg = ROLE_CONFIG[role] || ROLE_CONFIG.STAFF;
  const visibleTabs = ALL_TABS.filter((t) => t.roles.includes(role));

  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id || "overview");
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (role !== "STAFF") {
      axios
        .get(ENDPOINTS.BOOKINGS, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((r) => setBookings(Array.isArray(r.data) ? r.data : []))
        .catch(() => {});
      axios
        .get(ENDPOINTS.VEHICLES, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((r) => setVehicles(Array.isArray(r.data) ? r.data : []))
        .catch(() => {});
    }
  }, []);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const { data } = await axios.patch(
        `${ENDPOINTS.BOOKINGS}/${bookingId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? data : b)));
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update booking status.");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewPanel
            role={role}
            bookings={bookings}
            vehicles={vehicles}
            onStatusChange={handleStatusChange}
          />
        );
      case "analytics":
        return <AnalyticsPanel />;
      case "bookings":
        return (
          <div style={card}>
            <PanelHeader
              title="All Bookings"
              subtitle="Full booking management"
              action={
                <button
                  onClick={() =>
                    axios
                      .get(ENDPOINTS.BOOKINGS, {
                        headers: { Authorization: `Bearer ${token}` },
                      })
                      .then((r) =>
                        setBookings(Array.isArray(r.data) ? r.data : []),
                      )
                      .catch(() => {})
                  }
                  style={{
                    background: "#6366f1",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Refresh
                </button>
              }
            />
            {bookings.length === 0 ? (
              <EmptyState
                icon={<FaClipboardList />}
                label="No bookings yet"
                hint="Bookings appear here once customers reserve."
              />
            ) : (
              <BookingsTable
                bookings={bookings}
                onStatusChange={handleStatusChange}
                showActions={true}
              />
            )}
          </div>
        );
      case "vehicles":
        return <VehiclesPanel isAdmin={role === "ADMIN" || role === "OWNER"} />;
      case "drivers":
        return <DriversPanel isAdmin={role === "ADMIN" || role === "OWNER"} />;
      case "customers":
        return <CustomersPanel />;
      case "documents":
        return (
          <GenericPanel
            title="Document Verification"
            subtitle="Customer and driver document reviews"
            icon={<FaFileAlt />}
            hint="Submitted documents will appear here for review."
          />
        );
      case "disputes":
        return (
          <GenericPanel
            title="Dispute Management"
            subtitle="Damage reports and complaints"
            icon={<FaExclamationTriangle />}
            hint="Disputes raised by customers or drivers appear here."
          />
        );
      case "staff":
        return (
          <GenericPanel
            title="Staff Management"
            subtitle="Manage admin and staff accounts"
            icon={<FaShieldAlt />}
            hint="Staff accounts will appear here."
          />
        );
      default:
        return null;
    }
  };

  return (
    // Takes remaining height below the shared Navbar (which is in Layout)
    <div
      style={{
        display: "flex",
        flex: 1,
        overflow: "hidden",
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
      }}
    >
      {/* ── Sidebar — NO Home or Sign Out buttons anymore (Navbar handles them) ── */}
      <aside
        style={{
          width: "240px",
          minWidth: "240px",
          background: "#0f172a",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Logo area */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255,255,255,0.06)",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
          >
            <span style={{ fontSize: "16px" }}>{roleCfg.badge}</span>
            <div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#fff",
                  margin: 0,
                }}
              >
                {user?.name || user?.email || "User"}
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: roleCfg.color,
                  margin: 0,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {roleCfg.label}
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 24px 8px", flexShrink: 0 }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: "700",
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Main Menu
          </span>
        </div>

        {/* Nav tabs */}
        <nav style={{ padding: "0 12px", flex: 1, overflowY: "auto" }}>
          {visibleTabs.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  marginBottom: "2px",
                  fontSize: "13px",
                  fontWeight: active ? "600" : "500",
                  color: active ? "#fff" : "#94a3b8",
                  background: active
                    ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                    : "transparent",
                  transition: "all 0.15s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "#e2e8f0";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#94a3b8";
                  }
                }}
              >
                <span style={{ fontSize: "14px" }}>{item.icon}</span>
                {item.label}
                {active && (
                  <span
                    style={{
                      marginLeft: "auto",
                      width: "6px",
                      height: "6px",
                      background: "rgba(255,255,255,0.6)",
                      borderRadius: "50%",
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>
        {/* No Home / Sign Out here — the shared Navbar handles them */}
      </aside>

      {/* ── Main content ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            background: "#fff",
            borderBottom: "1px solid #f1f5f9",
            padding: "0 28px",
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#0f172a",
                margin: 0,
              }}
            >
              {visibleTabs.find((t) => t.id === activeTab)?.label ||
                "Dashboard"}
            </h1>
            <span
              style={{
                background: roleCfg.bg,
                color: roleCfg.color,
                fontSize: "11px",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "20px",
              }}
            >
              {roleCfg.label}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "9px",
                padding: "7px 12px",
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              <FaSearch style={{ fontSize: "11px" }} />
              <span>Search…</span>
            </div>
          </div>
        </header>
        <main style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
