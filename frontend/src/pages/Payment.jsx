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

// eSewa v2 requires a form POST
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

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [booking, setBooking] = useState(null);
  const [loadingB, setLoadingB] = useState(true);
  const [bookingErr, setBookingErr] = useState(null);
  const [paying, setPaying] = useState(null); // "esewa"|"demo"|null
  const [toast, setToast] = useState(null);

  // T&C dialog
  const [showTnC, setShowTnC] = useState(false);
  const [tnCAccepted, setTnCAccepted] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

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

  // Show T&C first, then proceed
  function requestPay(action) {
    setPendingAction(action);
    setTnCAccepted(false);
    setShowTnC(true);
  }

  async function confirmAndPay() {
    if (!tnCAccepted) return;
    setShowTnC(false);
    if (pendingAction === "esewa") await proceedEsewa();
    if (pendingAction === "demo") await proceedDemo();
  }

  async function proceedEsewa() {
    setPaying("esewa");
    try {
      const { data } = await axios.post(
        `${API}/api/pay/esewa/initiate`,
        { bookingId },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      sessionStorage.setItem("token", getToken());
      submitEsewaForm(data);
    } catch (e) {
      showToast(
        e.response?.data?.message || "eSewa failed. Try Demo Pay.",
        "error",
      );
      setPaying(null);
    }
  }

  async function proceedDemo() {
    setPaying("demo");
    try {
      await axios.post(
        `${API}/api/pay/demo`,
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

  const busy = !!paying;

  return (
    <>
      <style>{`* { box-sizing:border-box; } @keyframes spin { to { transform:rotate(360deg); } }`}</style>
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          padding: "40px 20px 80px",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        }}
      >
        <button onClick={() => navigate("/customer")} style={backBtn}>
          ← Back to Dashboard
        </button>

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
            <span style={{ fontSize: 22, fontWeight: 800, color: "#F97316" }}>
              Rs {(booking?.totalPrice || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* ── Demo Pay — Primary for FYP ── */}
          <button
            onClick={() => requestPay("demo")}
            disabled={busy}
            style={{
              width: "100%",
              padding: "16px 18px",
              borderRadius: 12,
              border: "none",
              cursor: busy ? "not-allowed" : "pointer",
              background:
                paying === "demo"
                  ? "#EA580C"
                  : "linear-gradient(135deg,#F97316,#EA580C)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              opacity: busy && paying !== "demo" ? 0.5 : 1,
              transition: "all 0.15s",
              boxShadow: busy ? "none" : "0 4px 16px rgba(249,115,22,0.35)",
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
                Processing payment…
              </>
            ) : (
              <>
                ✓ Confirm Payment — Rs{" "}
                {(booking?.totalPrice || 0).toLocaleString()}
              </>
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

          {/* eSewa gateway */}
          <button
            onClick={() => requestPay("esewa")}
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
                Pay with eSewa
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
              eSewa requires merchant API keys — available after production
              setup
            </p>
          )}
        </div>
      </div>

      {/* T&C Dialog */}
      {showTnC && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 520,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 22 }}>📋</span>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  Rental Agreement & Fine Policy
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                  Please read before proceeding to payment
                </p>
              </div>
            </div>
            <div
              style={{
                overflowY: "auto",
                padding: "20px 24px",
                flex: 1,
                fontSize: 13.5,
                color: "#374151",
                lineHeight: 1.75,
              }}
            >
              <div
                style={{
                  background: "#FFF7ED",
                  border: "1px solid #FED7AA",
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 18,
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, color: "#EA580C" }}>
                  Late return charges apply
                </p>
                <p
                  style={{ margin: "4px 0 0", color: "#9a3412", fontSize: 13 }}
                >
                  You are responsible for returning the vehicle on time.
                </p>
              </div>
              <p>
                <strong>1. Grace Period</strong>
                <br />
                You are given a <strong>30-minute grace period</strong> after
                your scheduled return time at no extra cost.
              </p>
              <p>
                <strong>2. Late Return Fine</strong>
              </p>
              <ul style={{ paddingLeft: 20, margin: "8px 0 12px" }}>
                <li style={{ marginBottom: 6 }}>
                  <strong>1–6 hours late:</strong> Charged at the vehicle's{" "}
                  <strong>hourly rate per late hour</strong> (rounded up).
                  Driver's hourly rate also added if applicable.
                </li>
                <li style={{ marginBottom: 6 }}>
                  <strong>More than 6 hours late:</strong> One{" "}
                  <strong>full daily rate</strong> charged (vehicle + driver if
                  applicable).
                </li>
              </ul>
              <p>
                <strong>3. Daily Rate Basis</strong>
                <br />
                1–6 day bookings: hourly × 24 × 0.80 &nbsp;·&nbsp; 7–30 day
                bookings: hourly × 24 × 0.70
              </p>
              <p>
                <strong>4. Fine Payment</strong>
                <br />
                If a fine is incurred, you will be redirected to pay it via
                eSewa before the booking is fully closed.
              </p>
              <p>
                <strong>5. Vehicle Condition</strong>
                <br />
                Use the optional condition report to document pre-existing
                damage. Unreported damage at return may incur additional
                charges.
              </p>
              <p
                style={{
                  margin: "16px 0 0",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "#15803d",
                  fontSize: 13,
                }}
              >
                ✅ By proceeding, you agree to these terms and the fine
                structure above.
              </p>
            </div>
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #f1f5f9",
                background: "#f9fafb",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  cursor: "pointer",
                  marginBottom: 16,
                }}
              >
                <input
                  type="checkbox"
                  checked={tnCAccepted}
                  onChange={(e) => setTnCAccepted(e.target.checked)}
                  style={{
                    width: 16,
                    height: 16,
                    marginTop: 2,
                    accentColor: "#F97316",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}
                >
                  I have read and agree to the{" "}
                  <strong>Rental Agreement & Fine Policy</strong>.
                </span>
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowTnC(false)}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    color: "#64748b",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAndPay}
                  disabled={!tnCAccepted}
                  style={{
                    flex: 2,
                    padding: "11px",
                    borderRadius: 10,
                    border: "none",
                    background: tnCAccepted
                      ? "linear-gradient(135deg,#F97316,#EA580C)"
                      : "#e2e8f0",
                    color: tnCAccepted ? "#fff" : "#94a3b8",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: tnCAccepted ? "pointer" : "not-allowed",
                  }}
                >
                  {tnCAccepted
                    ? "I agree — Proceed →"
                    : "Check the box above to proceed"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
