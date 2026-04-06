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
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [booking, setBooking] = useState(null);
  const [loadingB, setLoadingB] = useState(true);
  const [bookingErr, setBookingErr] = useState(null);
  const [paying, setPaying] = useState(false);
  const [demoPaying, setDemoPaying] = useState(false);
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

  // ── eSewa ─────────────────────────────────────────────────────────────────
  async function handleEsewa() {
    setPaying(true);
    try {
      const { data } = await axios.post(
        `${API}/api/pay/esewa/initiate`,
        { bookingId },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );

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

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      showToast(e.response?.data?.message || "eSewa payment failed.", "error");
      setPaying(false);
    }
  }

  // ── Demo pay ───────────────────────────────────────────────────────────────
  async function handleDemoPay() {
    setDemoPaying(true);
    try {
      await axios.post(
        `${API}/api/bookings/${bookingId}/demo-pay`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      navigate("/customer");
    } catch (e) {
      showToast(e.response?.data?.message || "Demo pay failed.", "error");
    } finally {
      setDemoPaying(false);
    }
  }

  function showToast(msg, type) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  }

  // ── Loading ────────────────────────────────────────────────────────────────
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
        <p style={{ color: "#64748b", fontFamily: "DM Sans,system-ui" }}>
          Loading booking…
        </p>
      </div>
    );

  if (bookingErr)
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
          <p style={{ fontWeight: 700, marginBottom: 12 }}>{bookingErr}</p>
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

  const busy = paying || demoPaying;

  return (
    <>
      <style>{`* { box-sizing: border-box; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          padding: "40px 20px 80px",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        }}
      >
        {/* Back */}
        <button onClick={() => navigate("/customer")} style={backBtn}>
          ← Back to Dashboard
        </button>

        {/* Header */}
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          Complete payment
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748b" }}>
          {booking?.vehicle?.name} · {fmtDate(booking?.startDate)} →{" "}
          {fmtDate(booking?.endDate)}
        </p>

        {/* Order summary */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "20px",
            marginBottom: 20,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
            }}
          >
            Order summary
          </p>
          {[
            { label: "Vehicle", value: booking?.vehicle?.name },
            {
              label: "Mode",
              value:
                booking?.requiresDriver === false
                  ? "Self-drive"
                  : "With driver",
            },
            {
              label: "Driver",
              value:
                booking?.driver?.name ||
                (booking?.requiresDriver === false ? "—" : "Awaiting"),
            },
            { label: "Start", value: fmtDate(booking?.startDate) },
            { label: "End", value: fmtDate(booking?.endDate) },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 8,
              }}
            >
              <span style={{ color: "#64748b" }}>{label}</span>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>
                {value || "—"}
              </span>
            </div>
          ))}
          <div
            style={{
              borderTop: "1px solid #e2e8f0",
              paddingTop: 12,
              marginTop: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              Total
            </span>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#60BB46" }}>
              Rs {(booking?.totalPrice || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* ── eSewa ── */}
          <button
            onClick={handleEsewa}
            disabled={busy}
            style={{
              width: "100%",
              padding: "16px 18px",
              borderRadius: 12,
              border: "none",
              cursor: busy ? "not-allowed" : "pointer",
              background: busy && paying ? "#4ea336" : "#60BB46",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              opacity: busy && !paying ? 0.5 : 1,
              transition: "background 0.15s",
              boxShadow: busy ? "none" : "0 4px 14px rgba(96,187,70,0.35)",
            }}
            onMouseEnter={(e) => {
              if (!busy) e.currentTarget.style.background = "#4ea336";
            }}
            onMouseLeave={(e) => {
              if (!busy) e.currentTarget.style.background = "#60BB46";
            }}
          >
            {paying ? (
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
                Redirecting to eSewa…
              </>
            ) : (
              <>
                <span
                  style={{
                    background: "#fff",
                    color: "#60BB46",
                    fontWeight: 900,
                    fontSize: 13,
                    padding: "2px 7px",
                    borderRadius: 4,
                    lineHeight: 1.4,
                  }}
                >
                  e
                </span>
                Pay Rs {(booking?.totalPrice || 0).toLocaleString()} with eSewa
              </>
            )}
          </button>

          {/* eSewa test credentials */}
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 9,
              padding: "10px 14px",
            }}
          >
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 11,
                fontWeight: 700,
                color: "#166534",
                textTransform: "uppercase",
                letterSpacing: "0.4px",
              }}
            >
              eSewa test credentials
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#15803d" }}>
              Number: <strong>9806800001</strong> &nbsp;·&nbsp; Password:{" "}
              <strong>Nepal@123</strong> &nbsp;·&nbsp; OTP:{" "}
              <strong>123456</strong>
            </p>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
              OR
            </span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          {/* ── Demo Pay ── */}
          <button
            onClick={handleDemoPay}
            disabled={busy}
            style={{
              width: "100%",
              padding: "13px 18px",
              borderRadius: 12,
              border: "1.5px dashed #94a3b8",
              background: "#f8fafc",
              cursor: busy ? "not-allowed" : "pointer",
              color: "#475569",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: busy && !demoPaying ? 0.5 : 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!busy) {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.borderColor = "#64748b";
              }
            }}
            onMouseLeave={(e) => {
              if (!busy) {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#94a3b8";
              }
            }}
          >
            {demoPaying ? (
              <>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid #94a3b8",
                    borderTopColor: "#475569",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Processing…
              </>
            ) : (
              <>🔧 Demo Pay — simulate eSewa (FYP use only)</>
            )}
          </button>

          <p
            style={{
              margin: "0",
              fontSize: 11,
              color: "#94a3b8",
              textAlign: "center",
            }}
          >
            Demo Pay bypasses the gateway and directly activates your booking —
            use if eSewa sandbox is unavailable.
          </p>
        </div>
      </div>

      {/* Toast */}
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

const backBtn = {
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
};
