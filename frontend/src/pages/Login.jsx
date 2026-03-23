import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ENDPOINTS } from "../services/api.js";

const ROLE_HOME = {
  OWNER: "/management",
  ADMIN: "/management",
  STAFF: "/management",
  DRIVER: "/driver",
  CUSTOMER: "/customer",
};

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(ENDPOINTS.LOGIN, form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate(ROLE_HOME[data.user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
      }}
    >
      {/* ── Left brand panel ── */}
      <div
        style={{
          flex: "0 0 420px",
          background:
            "linear-gradient(155deg,#0f172a 0%,#1e1b4b 50%,#312e81 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: "rgba(99,102,241,0.2)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-40px",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background: "rgba(139,92,246,0.15)",
          }}
        />

        {/* Logo */}
        <div style={{ position: "relative" }}>
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              🚗
            </div>
            <span
              style={{ fontSize: "20px", fontWeight: "800", color: "#fff" }}
            >
              VoyageGo
            </span>
          </Link>
        </div>

        {/* Tagline */}
        <div style={{ position: "relative" }}>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: "#fff",
              margin: "0 0 16px",
              lineHeight: 1.2,
              letterSpacing: "-0.5px",
            }}
          >
            Your journey
            <br />
            starts here.
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "#94a3b8",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Book vehicles, hire professional drivers, and explore Nepal with
            complete confidence.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "32px",
            }}
          >
            {[
              "🚗 Wide selection of vehicles",
              "🧑‍✈️ Professional drivers",
              "📍 Kathmandu & beyond",
            ].map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#e2e8f0",
                }}
              >
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: "48px 32px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "#0f172a",
              margin: "0 0 6px",
              letterSpacing: "-0.5px",
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 32px" }}>
            Sign in to your VoyageGo account
          </p>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "20px",
                fontSize: "13px",
                color: "#dc2626",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "18px" }}
          >
            <div>
              <label style={labelStyle}>Email address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
                style={inputStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    fontSize: "14px",
                    padding: 0,
                  }}
                >
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "#fff",
                fontSize: "15px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.8 : 1,
                marginTop: "4px",
                transition: "opacity 0.2s,transform 0.1s",
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
            >
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              fontSize: "14px",
              color: "#64748b",
              marginTop: "24px",
            }}
          >
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{
                color: "#6366f1",
                fontWeight: "700",
                textDecoration: "none",
              }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "600",
  color: "#374151",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.4px",
};
const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  border: "1.5px solid #e2e8f0",
  borderRadius: "10px",
  fontSize: "14px",
  color: "#0f172a",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s,box-shadow 0.15s",
  fontFamily: "inherit",
};
const focusStyle = (e) => {
  e.target.style.borderColor = "#6366f1";
  e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
};
const blurStyle = (e) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
};
