import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaBell, FaChevronDown, FaSignOutAlt, FaUser } from "react-icons/fa";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const logout = () => {
    localStorage.clear();
    setDropdownOpen(false);
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  // Dashboard link per role
  const dashLink = user ? {
    OWNER:    { to: "/management", label: "Dashboard" },
    ADMIN:    { to: "/management", label: "Dashboard" },
    STAFF:    { to: "/management", label: "Dashboard" },
    DRIVER:   { to: "/driver",     label: "My Dashboard" },
    CUSTOMER: { to: "/customer",   label: "My Bookings" },
  }[user.role] : null;

  return (
    <header style={{
      background: "#fff",
      borderBottom: "1px solid #f1f5f9",
      position: "sticky", top: 0, zIndex: 100,
      fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
      boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
    }}>
      <div style={{
        maxWidth: "1280px", margin: "0 auto",
        padding: "0 32px", height: "64px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: "24px",
      }}>

        {/* Logo — always goes to home */}
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:"10px", textDecoration:"none", flexShrink:0 }}>
          <div style={{ width:"36px", height:"36px", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>🚗</div>
          <span style={{ fontSize:"18px", fontWeight:"700", color:"#0f172a", letterSpacing:"-0.3px" }}>VoyageGo</span>
        </Link>

        {/* Center nav links — public links available to ALL roles */}
        <nav style={{ display:"flex", alignItems:"center", gap:"4px", flex:1 }}>
          <NavLink to="/"        active={isActive("/")}        label="Home"    />
          <NavLink to="/explore" active={isActive("/explore")} label="Explore" />

          {/* Dashboard shortcut — only when logged in */}
          {dashLink && (
            <NavLink to={dashLink.to} active={isActive(dashLink.to)} label={dashLink.label} />
          )}
        </nav>

        {/* Right side */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          {user ? (
            <>
              {/* Bell */}
              <button style={{ width:"38px", height:"38px", borderRadius:"10px", border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748b", fontSize:"15px" }}>
                <FaBell />
              </button>

              {/* User dropdown */}
              <div style={{ position:"relative" }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ display:"flex", alignItems:"center", gap:"8px", padding:"6px 12px 6px 6px", borderRadius:"10px", border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", transition:"background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background="#fff"}
                >
                  <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"12px", fontWeight:"700" }}>
                    {(user.name || user.email || "U")[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize:"13px", fontWeight:"500", color:"#0f172a", maxWidth:"100px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {user.name || user.email}
                  </span>
                  <FaChevronDown style={{ fontSize:"10px", color:"#94a3b8", transform:dropdownOpen?"rotate(180deg)":"rotate(0)", transition:"transform 0.2s" }} />
                </button>

                {dropdownOpen && (
                  <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, background:"#fff", border:"1px solid #f1f5f9", borderRadius:"12px", boxShadow:"0 8px 24px rgba(0,0,0,0.12)", minWidth:"200px", overflow:"hidden", zIndex:200 }}>
                    {/* User info */}
                    <div style={{ padding:"12px 16px", borderBottom:"1px solid #f1f5f9" }}>
                      <p style={{ fontSize:"13px", fontWeight:"600", color:"#0f172a", margin:0 }}>{user.name || "User"}</p>
                      <p style={{ fontSize:"11px", color:"#94a3b8", margin:"2px 0 0" }}>{user.role}</p>
                    </div>

                    {/* Dashboard link */}
                    {dashLink && (
                      <Link to={dashLink.to} onClick={() => setDropdownOpen(false)}
                        style={{ display:"flex", alignItems:"center", gap:"10px", padding:"11px 16px", fontSize:"13px", fontWeight:"500", color:"#334155", textDecoration:"none" }}
                        onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                        <FaUser style={{ fontSize:"12px", color:"#6366f1" }} />
                        {dashLink.label}
                      </Link>
                    )}

                    {/* Home link — useful when inside /management full-screen */}
                    <Link to="/" onClick={() => setDropdownOpen(false)}
                      style={{ display:"flex", alignItems:"center", gap:"10px", padding:"11px 16px", fontSize:"13px", fontWeight:"500", color:"#334155", textDecoration:"none", borderTop:"1px solid #f8fafc" }}
                      onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      🏠 Home
                    </Link>

                    {/* Sign out */}
                    <button onClick={logout}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"11px 16px", border:"none", background:"transparent", cursor:"pointer", fontSize:"13px", fontWeight:"500", color:"#ef4444", textAlign:"left", borderTop:"1px solid #f8fafc" }}
                      onMouseEnter={e => e.currentTarget.style.background="#fef2f2"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <FaSignOutAlt /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Login icon — guests only */
            <Link to="/login"
              style={{ width:"40px", height:"40px", borderRadius:"10px", border:"1px solid #e2e8f0", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", color:"#6366f1", fontSize:"17px", textDecoration:"none", transition:"all 0.15s" }}
              title="Sign In"
              onMouseEnter={e => { e.currentTarget.style.background="#eef2ff"; e.currentTarget.style.borderColor="#c7d2fe"; }}
              onMouseLeave={e => { e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor="#e2e8f0"; }}>
              <FaUser />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, active, label }) {
  return (
    <Link to={to}
      style={{ padding:"7px 14px", borderRadius:"8px", fontSize:"14px", fontWeight:"500", textDecoration:"none", color:active?"#6366f1":"#64748b", background:active?"#eef2ff":"transparent", transition:"all 0.15s" }}
      onMouseEnter={e => { if(!active){ e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.color="#0f172a"; } }}
      onMouseLeave={e => { if(!active){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#64748b"; } }}>
      {label}
    </Link>
  );
}
