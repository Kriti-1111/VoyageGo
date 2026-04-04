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

// eSewa v2: must POST a form (not a redirect) to the eSewa URL
function submitEsewaForm({ url, params }) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
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
  const [paying, setPaying] = useState(null); // "esewa" | null
  const [toast, setToast] = useState(null);

  // Manual payment fallback
  const [manualMethod, setManualMethod] = useState(null);
  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [bank, setBank] = useState({ reference: "", bank: "", date: "" });
  const [submitting, setSubmitting] = useState(false);

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

  // ── eSewa ──────────────────────────────────────────────────────────────────
  async function handleEsewa() {
    setPaying("esewa");
    try {
      const { data } = await axios.post(
        `${API}/api/pay/esewa/initiate`,
        { bookingId },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      // Save token so EsewaReturn can verify after the page redirect
      sessionStorage.setItem("token", getToken());
      submitEsewaForm(data);
    } catch (e) {
      showToast(
        e.response?.data?.message || "eSewa initiation failed.",
        "error",
      );
      setPaying(null);
    }
  }

  // ── Demo pay — FYP fallback ────────────────────────────────────────────────
  const [demoPaying, setDemoPaying] = useState(false);
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

  // ── Manual fallback ─────────────────────────────────────────────────────────
  const canSubmitManual = (() => {
    if (!manualMethod) return false;
    if (manualMethod === "Card")
      return (
        card.number.replace(/\s/g, "").length === 16 &&
        card.expiry.length === 5 &&
        card.cvv.length >= 3 &&
        card.name.length > 1
      );
    if (manualMethod === "Bank")
      return bank.reference && bank.bank && bank.date;
    return false;
  })();

  async function handleManual() {
    if (!canSubmitManual || submitting) return;
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/api/bookings/${bookingId}/payment`,
        {
          method: manualMethod,
          ...(manualMethod === "Card" && {
            last4: card.number.replace(/\s/g, "").slice(-4),
          }),
          ...(manualMethod === "Bank" && {
            reference: bank.reference,
            bank: bank.bank,
            transferDate: bank.date,
          }),
        },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      navigate(
        `/payment/success?bookingId=${bookingId}&method=${manualMethod}`,
      );
    } catch (e) {
      showToast(e.response?.data?.message || "Payment failed.", "error");
    } finally {
      setSubmitting(false);
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
          <p style={{ fontWeight: 700, marginBottom: 4 }}>{bookingErr}</p>
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

  return (
    <>
      <style>{`* { box-sizing: border-box; } @keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
        <p style={{ margin: "0 0 4px", fontSize: 14, color: "#64748b" }}>
          {booking?.vehicle?.name} · {fmtDate(booking?.startDate)} →{" "}
          {fmtDate(booking?.endDate)}
        </p>

        {/* Test mode badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 11,
            fontWeight: 600,
            color: "#b45309",
            marginTop: 8,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#f59e0b",
            }}
          />
          Test Payment Mode — No real money deducted
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.6fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* Order summary */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "18px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <p
              style={{
                margin: "0 0 14px",
                fontSize: 12,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Order summary
            </p>
            {[
              { label: "Vehicle", value: booking?.vehicle?.name },
              {
                label: "Driver",
                value:
                  booking?.driver?.name ||
                  (booking?.requiresDriver === false
                    ? "Self-drive"
                    : "No driver"),
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
                paddingTop: 10,
                marginTop: 4,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                Total
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#6366f1" }}>
                Rs {(booking?.totalPrice || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment methods */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* ── eSewa ── */}
            <button
              onClick={handleEsewa}
              disabled={!!paying}
              style={{
                width: "100%",
                padding: "14px 18px",
                borderRadius: 12,
                border: "none",
                cursor: paying ? "not-allowed" : "pointer",
                background: paying === "esewa" ? "#5fbe00" : "#60bb46",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                opacity: paying && paying !== "esewa" ? 0.5 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!paying) e.currentTarget.style.background = "#4fa33a";
              }}
              onMouseLeave={(e) => {
                if (!paying) e.currentTarget.style.background = "#60bb46";
              }}
            >
              {paying === "esewa" ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Redirecting to eSewa…
                </>
              ) : (
                <>
                  <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                    <rect
                      width="40"
                      height="40"
                      rx="8"
                      fill="white"
                      fillOpacity=".18"
                    />
                    <text
                      x="50%"
                      y="56%"
                      dominantBaseline="middle"
                      textAnchor="middle"
                      fontSize="17"
                      fontWeight="800"
                      fill="white"
                    >
                      e
                    </text>
                  </svg>
                  Pay with eSewa
                </>
              )}
            </button>

            {/* Demo Pay — FYP fallback when eSewa sandbox is unavailable */}
            <button
              onClick={handleDemoPay}
              disabled={!!paying || demoPaying}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: 10,
                border: "1.5px dashed #94a3b8",
                background: "#f8fafc",
                color: "#475569",
                fontSize: 13,
                fontWeight: 600,
                cursor: paying || demoPaying ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: paying ? 0.5 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!paying && !demoPaying)
                  e.currentTarget.style.background = "#f1f5f9";
              }}
              onMouseLeave={(e) => {
                if (!paying && !demoPaying)
                  e.currentTarget.style.background = "#f8fafc";
              }}
            >
              {demoPaying ? (
                <>
                  <span
                    style={{
                      width: 13,
                      height: 13,
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

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                or pay manually
              </span>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            </div>

            {/* Manual method selector */}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { key: "Card", label: "Card" },
                { key: "Bank", label: "Bank Transfer" },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() =>
                    setManualMethod(m.key === manualMethod ? null : m.key)
                  }
                  style={{
                    flex: 1,
                    padding: "9px",
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: `1.5px solid ${manualMethod === m.key ? "#6366f1" : "#e2e8f0"}`,
                    background: manualMethod === m.key ? "#eef2ff" : "#fff",
                    color: manualMethod === m.key ? "#6366f1" : "#64748b",
                    transition: "all 0.15s",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Card form */}
            {manualMethod === "Card" && (
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 10,
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div>
                  <label style={lbl}>Card number</label>
                  <input
                    maxLength={19}
                    placeholder="0000 0000 0000 0000"
                    value={card.number}
                    onChange={(e) => {
                      const raw = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 16);
                      setCard((p) => ({
                        ...p,
                        number: raw.replace(/(.{4})/g, "$1 ").trim(),
                      }));
                    }}
                    style={inp}
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <div>
                    <label style={lbl}>Expiry</label>
                    <input
                      maxLength={5}
                      placeholder="MM/YY"
                      value={card.expiry}
                      onChange={(e) => {
                        const raw = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4);
                        setCard((p) => ({
                          ...p,
                          expiry:
                            raw.length > 2
                              ? raw.slice(0, 2) + "/" + raw.slice(2)
                              : raw,
                        }));
                      }}
                      style={inp}
                    />
                  </div>
                  <div>
                    <label style={lbl}>CVV</label>
                    <input
                      maxLength={4}
                      placeholder="123"
                      type="password"
                      value={card.cvv}
                      onChange={(e) =>
                        setCard((p) => ({
                          ...p,
                          cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                        }))
                      }
                      style={inp}
                    />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Name on card</label>
                  <input
                    placeholder="Full name"
                    value={card.name}
                    onChange={(e) =>
                      setCard((p) => ({ ...p, name: e.target.value }))
                    }
                    style={inp}
                  />
                </div>
              </div>
            )}

            {/* Bank form */}
            {manualMethod === "Bank" && (
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 10,
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div>
                  <label style={lbl}>Transfer reference</label>
                  <input
                    placeholder="e.g. TRN-20260405-001"
                    value={bank.reference}
                    onChange={(e) =>
                      setBank((p) => ({ ...p, reference: e.target.value }))
                    }
                    style={inp}
                  />
                </div>
                <div>
                  <label style={lbl}>Bank name</label>
                  <input
                    placeholder="e.g. NMB Bank"
                    value={bank.bank}
                    onChange={(e) =>
                      setBank((p) => ({ ...p, bank: e.target.value }))
                    }
                    style={inp}
                  />
                </div>
                <div>
                  <label style={lbl}>Transfer date</label>
                  <input
                    type="date"
                    value={bank.date}
                    onChange={(e) =>
                      setBank((p) => ({ ...p, date: e.target.value }))
                    }
                    style={inp}
                  />
                </div>
              </div>
            )}

            {manualMethod && (
              <button
                onClick={handleManual}
                disabled={!canSubmitManual || submitting}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 12,
                  border: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor:
                    canSubmitManual && !submitting ? "pointer" : "not-allowed",
                  background: canSubmitManual
                    ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                    : "#e2e8f0",
                  color: canSubmitManual ? "#fff" : "#94a3b8",
                }}
              >
                {submitting
                  ? "Processing…"
                  : `Pay Rs ${(booking?.totalPrice || 0).toLocaleString()} manually`}
              </button>
            )}
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

const lbl = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#64748b",
  marginBottom: 4,
  textTransform: "uppercase",
};
const inp = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #dde3ec",
  fontSize: 13,
  color: "#0f172a",
  outline: "none",
  background: "#fff",
};
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
