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

function submitEsewaForm(data) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = data.gateway_url;
  const fields = {
    amount: data.amount,
    tax_amount: data.tax_amount,
    total_amount: data.total_amount,
    transaction_uuid: data.transaction_uuid,
    product_code: data.product_code,
    product_service_charge: 0,
    product_delivery_charge: 0,
    success_url: data.success_url,
    failure_url: data.failure_url,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature: data.signature,
  };
  Object.entries(fields).forEach(([k, v]) => {
    const i = document.createElement("input");
    i.type = "hidden";
    i.name = k;
    i.value = v;
    form.appendChild(i);
  });
  document.body.appendChild(form);
  form.submit();
}

export default function FinePay() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [booking, setBooking] = useState(null);
  const [loadingB, setLoadingB] = useState(true);
  const [bookingErr, setBookingErr] = useState(null);
  const [paying, setPaying] = useState(null);
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

  async function handleEsewa() {
    setPaying("esewa");
    try {
      const { data } = await axios.post(
        `${API}/api/pay/esewa/fine/initiate`,
        { bookingId },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      sessionStorage.setItem("token", getToken());
      submitEsewaForm(data);
    } catch (e) {
      showToast(e.response?.data?.message || "eSewa failed.", "error");
      setPaying(null);
    }
  }

  async function handleDemo() {
    setPaying("demo");
    try {
      await axios.post(
        `${API}/api/pay/demo/fine`,
        { bookingId },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      navigate("/customer");
    } catch (e) {
      showToast(e.response?.data?.message || "Demo pay failed.", "error");
      setPaying(null);
    }
  }

  function showToast(msg, type) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
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
        <p style={{ color: "#64748b", fontFamily: "'DM Sans',system-ui" }}>
          Loading…
        </p>
      </div>
    );
  if (bookingErr || !booking)
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
          <p style={{ fontWeight: 700, marginBottom: 12 }}>
            {bookingErr || "Booking not found."}
          </p>
          <button
            onClick={() => navigate("/customer")}
            style={{
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

  if (booking.finePaid)
    return (
      <div
        style={{
          maxWidth: 440,
          margin: "60px auto",
          padding: "0 20px",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
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
            width="32"
            height="32"
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
          Fine already paid
        </h2>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
          Your late return fine has been settled. Thank you.
        </p>
        <button
          onClick={() => navigate("/customer")}
          style={{
            padding: "12px 28px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg,#F97316,#EA580C)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Go to Dashboard
        </button>
      </div>
    );

  const busy = !!paying;

  return (
    <>
      <style>{`* { box-sizing:border-box; } @keyframes spin { to { transform:rotate(360deg); } }`}</style>
      <div
        style={{
          maxWidth: 500,
          margin: "0 auto",
          padding: "40px 20px 80px",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        }}
      >
        <button
          onClick={() => navigate("/customer")}
          style={{
            display: "inline-flex",
            alignItems: "center",
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
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: 14,
            padding: "20px 24px",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#dc2626",
                }}
              >
                Late Return Fine
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#ef4444" }}>
                {booking.vehicle?.name} · returned late
              </p>
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#fff",
              borderRadius: 10,
              padding: "14px 18px",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
              Fine amount
            </span>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#dc2626" }}>
              Rs {(booking.fine || 0).toLocaleString()}
            </span>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 12, color: "#94a3b8" }}>
            This fine must be paid to close your booking record. Your trip is
            already completed.
          </p>
        </div>

        {/* Fine breakdown */}
        {(booking.vehicleFine > 0 || booking.driverFine > 0) && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 20,
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Breakdown
            </p>
            {booking.vehicleFine > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: "#64748b" }}>Vehicle late charge</span>
                <span style={{ fontWeight: 600, color: "#dc2626" }}>
                  Rs {booking.vehicleFine.toLocaleString()}
                </span>
              </div>
            )}
            {booking.driverFine > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: "#64748b" }}>Driver late charge</span>
                <span style={{ fontWeight: 600, color: "#dc2626" }}>
                  Rs {booking.driverFine.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Payment buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Demo Pay — primary for FYP */}
          <button
            onClick={handleDemo}
            disabled={busy}
            style={{
              width: "100%",
              padding: "16px 18px",
              borderRadius: 12,
              border: "none",
              cursor: busy ? "not-allowed" : "pointer",
              background:
                paying === "demo"
                  ? "#b91c1c"
                  : "linear-gradient(135deg,#dc2626,#b91c1c)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              opacity: busy && paying !== "demo" ? 0.5 : 1,
              boxShadow: busy ? "none" : "0 4px 16px rgba(220,38,38,0.35)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!busy) e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              if (!busy) e.currentTarget.style.opacity = "1";
            }}
          >
            {paying === "demo" ? (
              <>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    border: "2.5px solid rgba(255,255,255,0.35)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Processing…
              </>
            ) : (
              <>✓ Pay Fine — Rs {(booking?.fine || 0).toLocaleString()}</>
            )}
          </button>
          <p
            style={{
              margin: "-4px 0 4px",
              fontSize: 11,
              color: "#94a3b8",
              textAlign: "center",
            }}
          >
            Simulated payment for demonstration — no real transaction
          </p>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
              ALSO AVAILABLE IN PRODUCTION
            </span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          {/* eSewa */}
          <button
            onClick={handleEsewa}
            disabled={busy}
            style={{
              width: "100%",
              padding: "13px 18px",
              borderRadius: 12,
              border: "1.5px solid #bbf7d0",
              cursor: busy ? "not-allowed" : "pointer",
              background: "#f0fdf4",
              color: "#15803d",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              opacity: busy && paying !== "esewa" ? 0.4 : 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!busy) {
                e.currentTarget.style.background = "#60BB46";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.borderColor = "#60BB46";
              }
            }}
            onMouseLeave={(e) => {
              if (!busy) {
                e.currentTarget.style.background = "#f0fdf4";
                e.currentTarget.style.color = "#15803d";
                e.currentTarget.style.borderColor = "#bbf7d0";
              }
            }}
          >
            {paying === "esewa" ? (
              <>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid #bbf7d0",
                    borderTopColor: "#15803d",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Redirecting…
              </>
            ) : (
              <>
                <span
                  style={{
                    background: "#60BB46",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 11,
                    padding: "2px 6px",
                    borderRadius: 4,
                    lineHeight: 1.4,
                  }}
                >
                  e
                </span>
                Pay fine with eSewa
              </>
            )}
          </button>

          {!busy && (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              eSewa requires merchant API keys — available after
              production setup
            </p>
          )}
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: 12,
            background: toast.type === "error" ? "#dc2626" : "#059669",
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
