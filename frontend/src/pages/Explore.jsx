import { useNavigate } from "react-router-dom";

export default function Explore() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  return (
    <div style={{
      minHeight: "60vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "80px 32px",
      fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
      background: "#f8fafc", textAlign: "center",
    }}>
      {/* Icon */}
      <div style={{
        width: "80px", height: "80px",
        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
        borderRadius: "20px", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "36px", marginBottom: "24px",
        boxShadow: "0 12px 32px rgba(99,102,241,0.3)",
      }}>
        🗺️
      </div>

      <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", margin: "0 0 12px", letterSpacing: "-0.5px" }}>
        Explore
      </h1>
      <p style={{ fontSize: "16px", color: "#64748b", margin: "0 0 8px", maxWidth: "420px", lineHeight: 1.6 }}>
        This page is coming soon. Discover vehicles, routes, and travel options across Nepal.
      </p>
      <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 36px" }}>
        🚧 Under construction
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={() => navigate("/")}
          style={{ padding: "10px 24px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", color: "#334155", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
          onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
          ← Back to Home
        </button>

        {/* If not logged in, prompt to sign in */}
        {!user && (
          <button onClick={() => navigate("/login")}
            style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
            Sign In to Book
          </button>
        )}

        {/* If logged in, go to their dashboard */}
        {user && (
          <button onClick={() => {
            const home = { OWNER:"/management", ADMIN:"/management", STAFF:"/management", DRIVER:"/driver", CUSTOMER:"/customer" };
            navigate(home[user.role] || "/");
          }}
            style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
            My Dashboard →
          </button>
        )}
      </div>
    </div>
  );
}
