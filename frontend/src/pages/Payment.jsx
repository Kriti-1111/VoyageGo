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

const METHODS = [
  {
    key: "Card",
    title: "Credit / Debit card",
    desc: "Visa, Mastercard, or any local card",
  },
  { key: "Wallet", title: "Digital wallet", desc: "eSewa, Khalti, or similar" },
  {
    key: "Bank",
    title: "Bank transfer",
    desc: "Direct transfer to our bank account",
  },
];

function CardForm({ values, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label style={lbl}>Card number</label>
        <input
          maxLength={19}
          placeholder="0000 0000 0000 0000"
          value={values.number}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
            onChange("number", raw.replace(/(.{4})/g, "$1 ").trim());
          }}
          style={inp}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={lbl}>Expiry (MM/YY)</label>
          <input
            maxLength={5}
            placeholder="MM/YY"
            value={values.expiry}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
              onChange(
                "expiry",
                raw.length > 2 ? raw.slice(0, 2) + "/" + raw.slice(2) : raw,
              );
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
            value={values.cvv}
            onChange={(e) =>
              onChange("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            style={inp}
          />
        </div>
      </div>
      <div>
        <label style={lbl}>Name on card</label>
        <input
          placeholder="Full name as on card"
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
          style={inp}
        />
      </div>
    </div>
  );
}

function WalletForm({ values, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label style={lbl}>Wallet provider</label>
        <select
          value={values.provider}
          onChange={(e) => onChange("provider", e.target.value)}
          style={inp}
        >
          <option value="">Select provider…</option>
          <option>eSewa</option>
          <option>Khalti</option>
          <option>IME Pay</option>
          <option>FonePay</option>
        </select>
      </div>
      <div>
        <label style={lbl}>Registered mobile number</label>
        <input
          placeholder="98XXXXXXXX"
          value={values.phone}
          onChange={(e) =>
            onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
          }
          style={inp}
        />
      </div>
    </div>
  );
}

function BankForm({ values, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label style={lbl}>Transfer reference</label>
        <input
          placeholder="e.g. TRN-20250101-001"
          value={values.reference}
          onChange={(e) => onChange("reference", e.target.value)}
          style={inp}
        />
      </div>
      <div>
        <label style={lbl}>Bank name</label>
        <input
          placeholder="e.g. NMB Bank"
          value={values.bank}
          onChange={(e) => onChange("bank", e.target.value)}
          style={inp}
        />
      </div>
      <div>
        <label style={lbl}>Transfer date</label>
        <input
          type="date"
          value={values.date}
          onChange={(e) => onChange("date", e.target.value)}
          style={inp}
        />
      </div>
    </div>
  );
}

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [booking, setBooking] = useState(null);
  const [loadingB, setLoadingB] = useState(true);
  const [bookingErr, setBookingErr] = useState(null);
  const [method, setMethod] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState(null);

  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [wallet, setWallet] = useState({ provider: "", phone: "" });
  const [bank, setBank] = useState({ reference: "", bank: "", date: "" });

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

  const canPay = (() => {
    if (!booking || !method) return false;
    if (method === "Card")
      return (
        card.number.replace(/\s/g, "").length === 16 &&
        card.expiry.length === 5 &&
        card.cvv.length >= 3 &&
        card.name.length > 1
      );
    if (method === "Wallet")
      return wallet.provider && wallet.phone.length === 10;
    if (method === "Bank") return bank.reference && bank.bank && bank.date;
    return false;
  })();

  async function handlePay() {
    if (!canPay || submitting) return;
    try {
      setSubmitting(true);
      await axios.post(
        `${API}/api/bookings/${bookingId}/payment`,
        {
          method,
          ...(method === "Card" && {
            last4: card.number.replace(/\s/g, "").slice(-4),
          }),
          ...(method === "Wallet" && { provider: wallet.provider }),
          ...(method === "Bank" && {
            reference: bank.reference,
            bank: bank.bank,
            transferDate: bank.date,
          }),
        },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      setDone(true);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Payment failed. Try again.",
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

  if (done)
    return (
      <div
        style={{
          maxWidth: 480,
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
            fontSize: 24,
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          Booking Active!
        </h2>
        <p
          style={{
            margin: "0 0 6px",
            fontSize: 14,
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          Payment received. Your booking is now{" "}
          <strong style={{ color: "#16a34a" }}>Active</strong>.
        </p>
        <p style={{ margin: "0 0 28px", fontSize: 13, color: "#94a3b8" }}>
          Your trip starts at {fmtDate(booking?.startDate)}.
        </p>

        <div
          style={{
            background: "#f8fafc",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            padding: "18px",
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          {[
            { label: "Vehicle", value: booking?.vehicle?.name },
            { label: "Driver", value: booking?.driver?.name || "Assigned" },
            { label: "Start", value: fmtDate(booking?.startDate) },
            { label: "End", value: fmtDate(booking?.endDate) },
            {
              label: "Total",
              value: `Rs ${(booking?.totalPrice || 0).toLocaleString()}`,
            },
            { label: "Method", value: method },
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
          Go to My Bookings
        </button>
      </div>
    );

  return (
    <>
      <style>{`* { box-sizing: border-box; }`}</style>
      <div
        style={{
          maxWidth: 680,
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
            Complete payment
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
            {booking?.vehicle?.name} · {fmtDate(booking?.startDate)} to{" "}
            {fmtDate(booking?.endDate)}
          </p>
        </div>

        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 24,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              color: "#15803d",
            }}
          >
            Instant activation — your booking goes Active immediately after
            payment.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ ...lbl, marginBottom: 10 }}>
                Payment method <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {METHODS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMethod(m.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 16px",
                      borderRadius: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      border: `2px solid ${method === m.key ? "#6366f1" : "#e2e8f0"}`,
                      background: method === m.key ? "#eef2ff" : "#fff",
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: `2px solid ${method === m.key ? "#6366f1" : "#cbd5e1"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {method === m.key && (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#6366f1",
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {m.title}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                        {m.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              {!method && (
                <p
                  style={{ margin: "8px 0 0", fontSize: 12, color: "#94a3b8" }}
                >
                  Select a payment method to continue.
                </p>
              )}
            </div>

            {method && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "20px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {METHODS.find((m2) => m2.key === method)?.title} details
                </p>
                {method === "Card" && (
                  <CardForm
                    values={card}
                    onChange={(k, v) => setCard((p) => ({ ...p, [k]: v }))}
                  />
                )}
                {method === "Wallet" && (
                  <WalletForm
                    values={wallet}
                    onChange={(k, v) => setWallet((p) => ({ ...p, [k]: v }))}
                  />
                )}
                {method === "Bank" && (
                  <BankForm
                    values={bank}
                    onChange={(k, v) => setBank((p) => ({ ...p, [k]: v }))}
                  />
                )}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={!canPay || submitting}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                border: "none",
                fontSize: 15,
                fontWeight: 700,
                cursor: canPay && !submitting ? "pointer" : "not-allowed",
                background: canPay
                  ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                  : "#e2e8f0",
                color: canPay ? "#fff" : "#94a3b8",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => {
                if (canPay) e.currentTarget.style.opacity = "0.88";
              }}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {submitting
                ? "Processing…"
                : !method
                  ? "Select a payment method first"
                  : !canPay
                    ? "Fill in all details"
                    : `Pay Rs ${(booking?.totalPrice || 0).toLocaleString()} — Activate now`}
            </button>
          </div>

          <div style={{ position: "sticky", top: 24 }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "20px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              }}
            >
              <p
                style={{
                  margin: "0 0 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Order summary
              </p>
              {[
                { label: "Vehicle", value: booking?.vehicle?.name },
                { label: "Type", value: booking?.vehicle?.type },
                {
                  label: "Driver",
                  value: booking?.driver?.name || "Auto-assigned",
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
                  marginTop: 4,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}
                >
                  Total
                </span>
                <span
                  style={{ fontSize: 18, fontWeight: 800, color: "#6366f1" }}
                >
                  Rs {(booking?.totalPrice || 0).toLocaleString()}
                </span>
              </div>
            </div>
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

const lbl = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#64748b",
  marginBottom: 5,
};
const inp = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
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
