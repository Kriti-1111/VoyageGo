import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

// Handles both booking and fine payments from eSewa.

export default function EsewaReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState(null);
  const [isFine, setIsFine] = useState(false);

  useEffect(() => {
    const payStatus = params.get("status");
    const bookingId = params.get("bookingId");
    const type = params.get("type"); // "fine" | null
    const reason = params.get("reason");
    const isFinePay = type === "fine";

    setIsFine(isFinePay);

    if (payStatus === "failed") {
      setStatus("error");
      setMessage(
        reason === "invalid_signature"
          ? "Payment signature could not be verified. Please contact support."
          : "Payment was cancelled or failed. Please try again.",
      );
      return;
    }

    if (payStatus === "success" && bookingId) {
      const token =
        sessionStorage.getItem("token") || localStorage.getItem("token");
      axios
        .get(`${API}/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(({ data }) => {
          setBooking(data);
          setStatus("success");
        })
        .catch(() => setStatus("success")); // payment is done even if fetch fails
      return;
    }

    setStatus("error");
    setMessage("Unexpected response from eSewa. Please check your dashboard.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrap = {
    maxWidth: 440,
    margin: "60px auto",
    padding: "0 20px",
    fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
    textAlign: "center",
  };

  if (status === "verifying")
    return (
      <div style={wrap}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div
          style={{
            width: 56,
            height: 56,
            border: "4px solid #e2e8f0",
            borderTopColor: "#60bb46",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 20px",
          }}
        />
        <h2
          style={{
            margin: "0 0 8px",
            fontSize: 20,
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          Verifying payment…
        </h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Please wait while we confirm your eSewa payment.
        </p>
      </div>
    );

  if (status === "error")
    return (
      <div style={wrap}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#fef2f2",
            border: "2px solid #fca5a5",
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
            stroke="#dc2626"
            strokeWidth="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h2
          style={{
            margin: "0 0 8px",
            fontSize: 20,
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          Payment failed
        </h2>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#334155",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <button
            onClick={() => navigate("/customer")}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "none",
              background: "#dc2626",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Dashboard
          </button>
        </div>
      </div>
    );

  // Success
  return (
    <div style={wrap}>
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

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 20,
          padding: "4px 14px",
          fontSize: 12,
          fontWeight: 600,
          color: "#15803d",
          marginBottom: 16,
        }}
      >
        {isFine ? "Fine Paid via eSewa ✓" : "eSewa Payment Successful ✓"}
      </div>

      <h2
        style={{
          margin: "0 0 6px",
          fontSize: 24,
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        {isFine ? "Fine Settled!" : "Booking Active!"}
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748b" }}>
        {isFine
          ? "Your late return fine has been paid via eSewa. Your booking is now fully closed."
          : "Your payment has been verified and your booking is now active."}
      </p>

      {booking && (
        <div
          style={{
            background: "#f8fafc",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            padding: "16px",
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          {(isFine
            ? [
                { label: "Vehicle", value: booking.vehicle?.name },
                {
                  label: "Fine paid",
                  value: `Rs ${(booking.fine || 0).toLocaleString()}`,
                },
                { label: "Paid via", value: "eSewa" },
                { label: "Status", value: "Completed" },
              ]
            : [
                { label: "Vehicle", value: booking.vehicle?.name },
                { label: "Driver", value: booking.driver?.name || "No driver" },
                {
                  label: "Start",
                  value: booking.startDate
                    ? new Date(booking.startDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—",
                },
                {
                  label: "Total",
                  value: `Rs ${(booking.totalPrice || 0).toLocaleString()}`,
                },
                { label: "Paid via", value: "eSewa" },
              ]
          ).map(({ label, value }) => (
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
      )}

      <button
        onClick={() => navigate("/customer")}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: 12,
          border: "none",
          background: "linear-gradient(135deg,#F97316,#EA580C)",
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
}
