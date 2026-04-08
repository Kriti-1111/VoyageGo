import { useNavigate } from "react-router-dom";

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        {/* Large 404 */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: "#e2e8f0",
            letterSpacing: "-4px",
            lineHeight: 1,
            marginBottom: 8,
            userSelect: "none",
          }}
        >
          404
        </div>

        {/* Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#f1f5f9",
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
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1
          style={{
            margin: "0 0 8px",
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          Page not found
        </h1>
        <p
          style={{
            margin: "0 0 32px",
            fontSize: 14,
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          The page you are looking for does not exist or has been moved.
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#334155",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Go back
          </button>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg,#F97316,#EA580C)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
