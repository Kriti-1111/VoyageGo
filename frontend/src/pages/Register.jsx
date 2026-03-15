import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";  // auth is at /auth/register (not /api/auth/register)

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name:"", email:"", phone:"", password:"", confirmPassword:"", role:"CUSTOMER", licenseNo:"" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const payload = { name:form.name, email:form.email, phone:form.phone, password:form.password, role:form.role };
      if (form.role === "DRIVER") payload.licenseNo = form.licenseNo;
      const { data } = await axios.post(`${API}/auth/register`, payload);  // ← /auth/register
      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));
      navigate(form.role === "DRIVER" ? "/driver" : "/customer");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif" }}>

      {/* ── Left brand panel ── */}
      <div style={{ flex:"0 0 380px", background:"linear-gradient(155deg,#0f172a 0%,#1e1b4b 50%,#312e81 100%)", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"48px 40px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-60px", right:"-60px", width:"240px", height:"240px", borderRadius:"50%", background:"rgba(99,102,241,0.2)" }} />
        <div style={{ position:"absolute", bottom:"-40px", left:"-40px", width:"200px", height:"200px", borderRadius:"50%", background:"rgba(139,92,246,0.15)" }} />

        <div style={{ position:"relative" }}>
          <Link to="/" style={{ display:"flex", alignItems:"center", gap:"10px", textDecoration:"none" }}>
            <div style={{ width:"40px", height:"40px", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>🚗</div>
            <span style={{ fontSize:"20px", fontWeight:"800", color:"#fff" }}>VoyageGo</span>
          </Link>
        </div>

        <div style={{ position:"relative" }}>
          <h2 style={{ fontSize:"28px", fontWeight:"800", color:"#fff", margin:"0 0 12px", lineHeight:1.2, letterSpacing:"-0.5px" }}>
            Join VoyageGo today.
          </h2>
          <p style={{ fontSize:"14px", color:"#94a3b8", margin:"0 0 28px", lineHeight:1.6 }}>
            Create your account and start exploring Nepal with ease.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {["✓ Free to register", "✓ Instant booking", "✓ Track your trips", "✓ Secure payments"].map(f => (
              <div key={f} style={{ fontSize:"13px", color:"#a5b4fc", display:"flex", alignItems:"center", gap:"8px" }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#f8fafc", padding:"48px 32px", overflowY:"auto" }}>
        <div style={{ width:"100%", maxWidth:"440px" }}>

          <h1 style={{ fontSize:"26px", fontWeight:"800", color:"#0f172a", margin:"0 0 4px", letterSpacing:"-0.5px" }}>Create your account</h1>
          <p style={{ fontSize:"14px", color:"#64748b", margin:"0 0 28px" }}>Fill in your details to get started</p>

          {error && (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:"10px", padding:"12px 16px", marginBottom:"18px", fontSize:"13px", color:"#dc2626" }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

            {/* Role selector */}
            <div>
              <label style={labelStyle}>I am a</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                {[
                  { value:"CUSTOMER", label:"Customer", icon:"👤", desc:"Book vehicles" },
                  { value:"DRIVER",   label:"Driver",   icon:"🧑‍✈️", desc:"Accept rides" },
                ].map(r => (
                  <button key={r.value} type="button" onClick={() => setForm(p => ({ ...p, role:r.value }))}
                    style={{ padding:"12px", borderRadius:"10px", border:`2px solid ${form.role === r.value ? "#6366f1" : "#e2e8f0"}`, background:form.role === r.value ? "#eef2ff" : "#fff", cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}>
                    <div style={{ fontSize:"18px", marginBottom:"4px" }}>{r.icon}</div>
                    <div style={{ fontSize:"13px", fontWeight:"700", color:form.role === r.value ? "#6366f1" : "#0f172a" }}>{r.label}</div>
                    <div style={{ fontSize:"11px", color:"#94a3b8" }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="98XXXXXXXX" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>

            {/* License — only for drivers */}
            {form.role === "DRIVER" && (
              <div>
                <label style={labelStyle}>License Number</label>
                <input name="licenseNo" value={form.licenseNo} onChange={handleChange} placeholder="e.g. 12-345-67890" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            )}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position:"relative" }}>
                  <input name="password" type={showPw ? "text" : "password"} value={form.password} onChange={handleChange} placeholder="Min. 6 characters" required style={{ ...inputStyle, paddingRight:"40px" }} onFocus={focusStyle} onBlur={blurStyle} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:"13px" }}>
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width:"100%", padding:"13px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontSize:"15px", fontWeight:"700", cursor:loading ? "not-allowed" : "pointer", opacity:loading ? 0.8 : 1, marginTop:"4px", transition:"opacity 0.2s" }}>
              {loading ? "Creating account…" : "Create Account →"}
            </button>
          </form>

          <p style={{ textAlign:"center", fontSize:"14px", color:"#64748b", marginTop:"20px" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color:"#6366f1", fontWeight:"700", textDecoration:"none" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display:"block", fontSize:"12px", fontWeight:"600", color:"#374151", marginBottom:"5px", textTransform:"uppercase", letterSpacing:"0.4px" };
const inputStyle = { width:"100%", padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:"9px", fontSize:"13px", color:"#0f172a", background:"#fff", outline:"none", boxSizing:"border-box", transition:"border-color 0.15s, box-shadow 0.15s", fontFamily:"inherit" };
const focusStyle = e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; };
const blurStyle  = e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; };
