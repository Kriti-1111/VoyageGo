import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";
function getToken() {
  return localStorage.getItem("token");
}
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
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

// Mirrors backend fine logic — includes vehicle + driver fine
// Grace: ≤30 min → no fine
// 1–6 late hours: lateHours × hourly rates
// >6 late hours: one full daily rate each (vehicleDailyRate stored on booking, driverDailyRate = driverRate × 8)
function calcFine(
  pricePerHour,
  driverRatePerHour = 0,
  scheduledEnd,
  now = new Date(),
  vehicleDailyRate = null,
  driverDailyRate = null,
) {
  const delayMs = new Date(now) - new Date(scheduledEnd);
  const delayMins = delayMs / (1000 * 60);

  if (delayMins <= 30)
    return {
      vehicleFine: 0,
      driverFine: 0,
      fine: 0,
      lateHours: 0,
      delayMins,
      isGrace: delayMins > 0,
    };

  const lateHours = Math.ceil(delayMins / 60);
  const vDailyRate = vehicleDailyRate || Math.round(pricePerHour * 24 * 0.8);
  const dDailyRate = driverDailyRate || Math.round(driverRatePerHour * 8);

  const vehicleFine =
    lateHours > 6 ? vDailyRate : Math.round(lateHours * pricePerHour);
  const driverFine =
    driverRatePerHour > 0
      ? lateHours > 6
        ? dDailyRate
        : Math.round(lateHours * driverRatePerHour)
      : 0;

  return {
    vehicleFine,
    driverFine,
    fine: vehicleFine + driverFine,
    lateHours,
    delayMins,
    isGrace: false,
    fullDay: lateHours > 6,
  };
}

function TimeStatus({ endDate, pricePerHour, driverRatePerHour = 0 }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const end = new Date(endDate);
  const diffMs = end - now;
  const isLate = diffMs < 0;
  const abs = Math.abs(diffMs);
  const hrs = Math.floor(abs / (1000 * 60 * 60));
  const mins = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));
  const label = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  const { isGrace } = calcFine(pricePerHour, driverRatePerHour, endDate, now);

  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: 12,
        background: isLate ? (isGrace ? "#fffbeb" : "#fef2f2") : "#f0fdf4",
        border: `1px solid ${isLate ? (isGrace ? "#fde68a" : "#fca5a5") : "#86efac"}`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: isLate ? (isGrace ? "#b45309" : "#dc2626") : "#16a34a",
          marginBottom: 4,
        }}
      >
        {isLate ? (isGrace ? "Grace period" : "Overdue") : "Time remaining"}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: isLate ? (isGrace ? "#b45309" : "#dc2626") : "#16a34a",
          letterSpacing: "-0.5px",
        }}
      >
        {isLate
          ? isGrace
            ? `${label} over — no fine yet`
            : `+${label} late`
          : label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: isLate ? (isGrace ? "#a16207" : "#ef4444") : "#15803d",
          marginTop: 4,
        }}
      >
        Scheduled return: {fmtDate(endDate)}
      </div>
      {isGrace && (
        <div
          style={{
            fontSize: 12,
            color: "#a16207",
            marginTop: 4,
            fontWeight: 600,
          }}
        >
          30-minute grace period — no fine if returned now
        </div>
      )}
    </div>
  );
}

export default function ReturnVehicle() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [booking, setBooking] = useState(null);
  const [loadingB, setLoadingB] = useState(true);
  const [bookingErr, setBookingErr] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    axios
      .get(`${API}/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      .then(({ data }) => setBooking(data))
      .catch((err) =>
        setBookingErr(err.response?.data?.message || "Failed to load booking."),
      )
      .finally(() => setLoadingB(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  async function handleReturn() {
    try {
      setSubmitting(true);
      const { data } = await axios.post(
        `${API}/api/bookings/${bookingId}/return`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      setResult(data);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Could not process return.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function showToast(msg, type) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  }

  if (loadingB)
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#64748b" }}>Loading booking…</p>
      </div>
    );

  if (bookingErr || (booking && booking.status !== "Active"))
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: 12,
            padding: "24px 28px",
            color: "#dc2626",
            textAlign: "center",
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: 4 }}>
            {bookingErr || "This trip is not currently active."}
          </p>
          <button
            onClick={() => navigate("/customer")}
            style={{
              marginTop: 12,
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              background: "#dc2626",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );

  // Success screen
  if (result) {
    const { fine, delayMins } = result;
    return (
      <div
        style={{
          maxWidth: 520,
          margin: "60px auto",
          padding: "0 20px",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#f0fdf4",
            border: "2px solid #86efac",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2
          style={{
            margin: "0 0 8px",
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          Vehicle returned
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748b" }}>
          Your trip has been completed.
        </p>

        {fine > 0 ? (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 12,
              padding: "16px",
              marginBottom: 20,
              textAlign: "left",
            }}
          >
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "#dc2626",
              }}
            >
              Late return fine
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: "#dc2626",
              }}
            >
              Rs {fine.toLocaleString()}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#ef4444" }}>
              {result.booking?.vehicle?.pricePerHour &&
              Math.ceil(delayMins / 60) > 6
                ? `Over 6 hours late — charged one daily rate`
                : `${Math.ceil(delayMins / 60)} extra hour${Math.ceil(delayMins / 60) !== 1 ? "s" : ""} × Rs ${booking.vehicle?.pricePerHour}/hr`}
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 20,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                color: "#16a34a",
              }}
            >
              {delayMins > 0
                ? "Returned within grace period — no fine applied."
                : "Returned on time — no fine applied."}
            </p>
          </div>
        )}

        <div
          style={{
            background: "#f8fafc",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "#94a3b8",
            }}
          >
            Final total
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.5px",
            }}
          >
            Rs{" "}
            {(
              result.booking?.totalPrice || booking.totalPrice
            ).toLocaleString()}
          </p>
        </div>

        <button
          onClick={() => navigate("/customer")}
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
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Live fine preview — includes vehicle + driver portions
  const vRate = booking.vehicle?.pricePerHour || 0;
  const dRate = booking.driver?.driverRatePerHour || 0;
  const finePreview = calcFine(
    vRate,
    dRate,
    booking.endDate,
    new Date(),
    booking.vehicleDailyRate,
    booking.driverDailyRate,
  );

  return (
    <>
      <style>{`* { box-sizing: border-box; }`}</style>
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          padding: "32px 20px 80px",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        }}
      >
        <button onClick={() => navigate("/customer")} style={backBtn}>
          Back to Dashboard
        </button>

        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Return vehicle
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
            {booking.vehicle?.name} · {booking.vehicle?.plateNumber}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <TimeStatus
            endDate={booking.endDate}
            pricePerHour={vRate}
            driverRatePerHour={dRate}
          />

          {/* Booking summary */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e8edf3",
              borderRadius: 12,
              padding: "16px",
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "#94a3b8",
              }}
            >
              Booking summary
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {[
                { label: "Vehicle", value: booking.vehicle?.name },
                { label: "Plate", value: booking.vehicle?.plateNumber },
                { label: "Trip started", value: fmtDate(booking.startDate) },
                { label: "Scheduled return", value: fmtDate(booking.endDate) },
                {
                  label: "Vehicle rental",
                  value: `Rs ${(booking.vehicleCost || 0).toLocaleString()}`,
                },
                {
                  label: "Driver fee",
                  value:
                    booking.driverCost > 0
                      ? `Rs ${booking.driverCost.toLocaleString()}`
                      : "No driver",
                },
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
          </div>

          {/* Fine breakdown — shows vehicle + driver split */}
          {finePreview.fine > 0 && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: 12,
                padding: "16px",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "#dc2626",
                }}
              >
                Late return fine
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "#ef4444",
                  marginBottom: 6,
                }}
              >
                <span>
                  {finePreview.fullDay
                    ? "Over 6 hours late → one daily rate"
                    : `${finePreview.lateHours}h × Rs ${vRate}/hr`}
                  {" (vehicle)"}
                </span>
                <span style={{ fontWeight: 700 }}>
                  Rs {finePreview.vehicleFine.toLocaleString()}
                </span>
              </div>
              {dRate > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: "#ef4444",
                    marginBottom: 6,
                  }}
                >
                  <span>
                    {finePreview.fullDay
                      ? "Over 6 hours late → one daily rate"
                      : `${finePreview.lateHours}h × Rs ${dRate}/hr`}
                    {" (driver)"}
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    Rs {finePreview.driverFine.toLocaleString()}
                  </span>
                </div>
              )}
              <div
                style={{
                  borderTop: "1px solid #fca5a5",
                  paddingTop: 8,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}
                >
                  New total
                </span>
                <span
                  style={{ fontSize: 16, fontWeight: 800, color: "#dc2626" }}
                >
                  Rs{" "}
                  {(
                    (booking.totalPrice || 0) + finePreview.fine
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {finePreview.fine === 0 && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: 12,
                padding: "12px 16px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#16a34a",
                }}
              >
                {finePreview.isGrace
                  ? "Within grace period — return now for no fine."
                  : "Returning on time — no fine."}
              </p>
            </div>
          )}

          {/* Fine policy */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 12,
                fontWeight: 700,
                color: "#64748b",
              }}
            >
              Fine policy
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#94a3b8",
                lineHeight: 1.6,
              }}
            >
              30 min grace · Rs {vRate}/hr per late hour (vehicle)
              {dRate > 0 ? ` + Rs ${dRate}/hr (driver)` : ""} · Over 6 hours =
              one full daily rate
            </p>
          </div>

          <button
            onClick={handleReturn}
            disabled={submitting}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              border: "none",
              fontSize: 15,
              fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              color: "#fff",
              transition: "opacity 0.15s",
              opacity: submitting ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.opacity = "0.88";
            }}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {submitting
              ? "Processing return…"
              : finePreview.fine > 0
                ? `Confirm return — Rs ${finePreview.fine.toLocaleString()} fine applies`
                : "Confirm vehicle return"}
          </button>
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

const backBtn = {
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
};
