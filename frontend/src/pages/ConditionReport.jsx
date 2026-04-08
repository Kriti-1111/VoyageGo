import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";
const SLOTS = [
  {
    key: "Front",
    label: "Front View",
    desc: "Upload front view of the vehicle",
  },
  { key: "Back", label: "Back View", desc: "Upload back view of the vehicle" },
  {
    key: "Left",
    label: "Left Side",
    desc: "Upload left side view of the vehicle",
  },
  {
    key: "Right",
    label: "Right Side",
    desc: "Upload right side view of the vehicle",
  },
];

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

function resizeImage(file, maxPx = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function CameraIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#94a3b8"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function PhotoCard({ slot, preview, onSelect, onClear }) {
  const ref = useRef();
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: `1.5px solid ${preview ? "#86efac" : "#e2e8f0"}`,
        overflow: "hidden",
        boxShadow: preview ? "0 0 0 3px rgba(134,239,172,0.18)" : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Photo / placeholder area */}
      {preview ? (
        <div style={{ position: "relative", aspectRatio: "4/3" }}>
          <img
            src={preview}
            alt={slot.label}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          <button
            onClick={onClear}
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 24,
              height: 24,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            &times;
          </button>
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "#22c55e",
              color: "#fff",
              borderRadius: "50%",
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      ) : (
        <div
          style={{
            aspectRatio: "4/3",
            background: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CameraIcon />
          </div>
        </div>
      )}

      {/* Card content */}
      <div style={{ padding: "14px 16px" }}>
        <p
          style={{
            margin: "0 0 2px",
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          {slot.label}
        </p>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#94a3b8" }}>
          {slot.desc}
        </p>
        <button
          onClick={() => ref.current.click()}
          style={{
            width: "100%",
            padding: "9px 0",
            borderRadius: 8,
            border: "none",
            background: preview ? "#f0fdf4" : "#EA580C",
            color: preview ? "#15803d" : "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {preview ? (
            <>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Photo uploaded
            </>
          ) : (
            <>
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
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Choose Photo
            </>
          )}
        </button>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files[0]) onSelect(e.target.files[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function ConditionReport() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [booking, setBooking] = useState(null);
  const [loadingB, setLoadingB] = useState(true);
  const [bookingErr, setBookingErr] = useState(null);
  const [photos, setPhotos] = useState({
    Front: null,
    Back: null,
    Left: null,
    Right: null,
  });
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

  async function handleSelect(key, file) {
    try {
      const b64 = await resizeImage(file);
      setPhotos((p) => ({ ...p, [key]: b64 }));
    } catch {
      showToast("Could not process image. Try another.", "error");
    }
  }

  const doneCount = SLOTS.filter((s) => photos[s.key] !== null).length;
  const allDone = doneCount === 4;

  async function handleSubmit() {
    if (!allDone) return;
    try {
      setSubmitting(true);
      await axios.post(
        `${API}/api/bookings/${bookingId}/pre-trip`,
        { photos: SLOTS.map((s) => photos[s.key]) },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      showToast("Trip started successfully.", "success");
      setTimeout(() => navigate("/customer"), 1800);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Could not start trip.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function showToast(msg, type) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  if (loadingB)
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "DM Sans, system-ui",
        }}
      >
        <p style={{ color: "#64748b" }}>Loading booking…</p>
      </div>
    );

  if (
    bookingErr ||
    (booking && !["Active", "Confirmed", "Completed"].includes(booking.status))
  )
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          fontFamily: "DM Sans, system-ui",
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
            {bookingErr || "This booking cannot be reported at this stage."}
          </p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0" }}>
            Only active or completed trips can have a condition report
            submitted.
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

  const startDate = booking?.startDate
    ? new Date(booking.startDate).toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <>
      <style>{`* { box-sizing: border-box; }`}</style>
      <div
        style={{
          minHeight: "100vh",
          background: "#f1f5f9",
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
          paddingBottom: 88,
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px" }}>
          {/* Trip header card */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              padding: "18px 20px",
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 10px",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Pre-Trip Vehicle Inspection
              </h2>
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                {[
                  { icon: "loc", text: "Kathmandu → Pokhara" },
                  {
                    icon: "car",
                    text: `${booking?.vehicle?.name || "Vehicle"} - ${booking?.vehicle?.plateNumber || "—"}`,
                  },
                  { icon: "cal", text: startDate },
                ].map((item) => (
                  <div
                    key={item.icon}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 13,
                      color: "#475569",
                    }}
                  >
                    {item.icon === "loc" && (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#F97316"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    )}
                    {item.icon === "car" && (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#F97316"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="1" y="3" width="15" height="13" rx="2" />
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                        <circle cx="5.5" cy="18.5" r="2.5" />
                        <circle cx="18.5" cy="18.5" r="2.5" />
                      </svg>
                    )}
                    {item.icon === "cal" && (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#F97316"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    )}
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
            <span
              style={{
                background: "#fff7ed",
                color: "#c2410c",
                border: "1px solid #fed7aa",
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Inspection Required
            </span>
          </div>

          {/* Vehicle Documentation card */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              padding: "20px",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Vehicle Documentation
              </h3>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: allDone ? "#16a34a" : "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {doneCount}/4 Photos Uploaded
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#e2e8f0",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: "#64748b",
                    fontWeight: 700,
                  }}
                >
                  i
                </span>
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 4,
                background: "#f1f5f9",
                borderRadius: 2,
                overflow: "hidden",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 2,
                  background: allDone ? "#22c55e" : "#EA580C",
                  width: `${(doneCount / 4) * 100}%`,
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            {/* 2×2 grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              {SLOTS.map((slot) => (
                <PhotoCard
                  key={slot.key}
                  slot={slot}
                  preview={photos[slot.key]}
                  onSelect={(file) => handleSelect(slot.key, file)}
                  onClear={() => setPhotos((p) => ({ ...p, [slot.key]: null }))}
                />
              ))}
            </div>
          </div>

          {/* Photo guidelines */}
          <div
            style={{
              background: "#FFF7ED",
              borderRadius: 12,
              border: "1px solid #FDBA74",
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#FED7AA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#1e40af",
                  }}
                >
                  Photo Guidelines
                </p>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {[
                    "Ensure clear, well-lit photos of each vehicle angle",
                    "Capture any existing damage or scratches",
                    "Photos must be taken before starting your trip",
                    "This documentation protects both you and our fleet",
                  ].map((tip, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 12,
                        color: "#EA580C",
                        marginBottom: 3,
                        lineHeight: 1.6,
                      }}
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom bar */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#fff",
            borderTop: "1px solid #e2e8f0",
            padding: "14px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 100,
          }}
        >
          <button
            onClick={() => navigate("/customer")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "#475569",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Dashboard
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => showToast("Draft saved.", "success")}
              style={{
                padding: "10px 20px",
                borderRadius: 9,
                border: "1px solid #e2e8f0",
                background: "#fff",
                color: "#334155",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save as Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allDone || submitting}
              style={{
                padding: "10px 22px",
                borderRadius: 9,
                border: "none",
                background: allDone ? "#1e293b" : "#94a3b8",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: allDone && !submitting ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: 7,
                transition: "background 0.15s",
              }}
            >
              {!allDone && (
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              )}
              {submitting ? "Starting…" : "Start Trip"}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 80,
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
