import { useState, useEffect } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";

const API = "http://localhost:5000";
const fmt = (d) => { try { return format(parseISO(d), "MMM d, yyyy · h:mm a"); } catch { return d || "—"; } };

const STATUS_CFG = {
  Pending:   { bg:"#fffbeb", color:"#b45309", dot:"#f59e0b", border:"#fde68a" },
  Accepted:  { bg:"#eff6ff", color:"#1d4ed8", dot:"#3b82f6", border:"#bfdbfe" },
  Active:    { bg:"#f0fdf4", color:"#15803d", dot:"#22c55e", border:"#bbf7d0" },
  Completed: { bg:"#f8fafc", color:"#475569", dot:"#94a3b8", border:"#e2e8f0" },
  Cancelled: { bg:"#fff1f2", color:"#be123c", dot:"#f43f5e", border:"#fecdd3" },
};

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", background:s.bg, color:s.color, border:`1px solid ${s.border}`, padding:"4px 10px", borderRadius:"20px", fontSize:"12px", fontWeight:"600" }}>
      <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:s.dot }} />{status}
    </span>
  );
}

function toast(msg, type = "success") {
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600;color:#fff;background:${type==="error"?"#ef4444":"#22c55e"};box-shadow:0 8px 24px rgba(0,0,0,0.15);font-family:'DM Sans',system-ui;transition:opacity 0.3s`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 3000);
}

export default function Driver() {
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [isOnline, setIsOnline]     = useState(false);
  const [toggling, setToggling]     = useState(false);
  const [tab, setTab]               = useState("pending");
  const [expanded, setExpanded]     = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchBookings(); fetchAvailability(); }, []);

  const fetchBookings = async () => {
    try { setLoading(true); const { data } = await axios.get(`${API}/api/bookings/driver/mine`, { headers:{ Authorization:`Bearer ${token}` } }); setBookings(Array.isArray(data) ? data : []); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchAvailability = async () => {
    try { const { data } = await axios.get(`${API}/api/drivers/me`, { headers:{ Authorization:`Bearer ${token}` } }); setIsOnline(data.isAvailable); }
    catch(e) { console.error(e); }
  };

  const toggleAvailability = async () => {
    setToggling(true);
    try {
      const { data } = await axios.patch(`${API}/api/drivers/availability`, { isAvailable:!isOnline }, { headers:{ Authorization:`Bearer ${token}` } });
      setIsOnline(data.isAvailable);
      toast(data.isAvailable ? "You are now Online ✓" : "You are now Offline");
    } catch { toast("Could not update availability.", "error"); }
    finally { setToggling(false); }
  };

  const respond = async (id, action) => {
    try {
      await axios.patch(`${API}/api/bookings/${id}/driver-response`, { action }, { headers:{ Authorization:`Bearer ${token}` } });
      toast(action === "accept" ? "Booking accepted!" : "Booking rejected.");
      fetchBookings(); setExpanded(null);
    } catch(e) { toast(e.response?.data?.message || "Action failed.", "error"); }
  };

  const TABS = [
    { key:"pending",  label:"New Requests", statuses:["Pending"] },
    { key:"active",   label:"Active Trips",  statuses:["Accepted","Active"] },
    { key:"history",  label:"History",       statuses:["Completed","Cancelled"] },
  ];
  const visible      = bookings.filter(b => TABS.find(t => t.key === tab)?.statuses.includes(b.status));
  const pendingCount = bookings.filter(b => b.status === "Pending").length;

  const STATS = [
    { label:"New Requests", value:bookings.filter(b=>b.status==="Pending").length,   color:"#f59e0b", bg:"#fffbeb", icon:"🔔" },
    { label:"Active Trips",  value:bookings.filter(b=>b.status==="Active").length,    color:"#22c55e", bg:"#f0fdf4", icon:"🚗" },
    { label:"Completed",     value:bookings.filter(b=>b.status==="Completed").length, color:"#6366f1", bg:"#eef2ff", icon:"✅" },
    { label:"Total Trips",   value:bookings.length,                                   color:"#3b82f6", bg:"#eff6ff", icon:"📋" },
  ];

  return (
    <div style={{ background:"#f8fafc", minHeight:"100%", fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", padding:"32px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-50px", right:"-50px", width:"220px", height:"220px", borderRadius:"50%", background:"rgba(99,102,241,0.1)" }} />
        <div style={{ maxWidth:"960px", margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", gap:"16px", flexWrap:"wrap", position:"relative" }}>
          <div>
            <p style={{ color:"#94a3b8", fontSize:"12px", fontWeight:"700", textTransform:"uppercase", letterSpacing:"1.5px", margin:"0 0 4px" }}>Driver Panel</p>
            <h1 style={{ color:"#fff", fontSize:"26px", fontWeight:"800", margin:0, letterSpacing:"-0.3px" }}>My Dashboard</h1>
          </div>
          <button onClick={toggleAvailability} disabled={toggling}
            style={{ display:"flex", alignItems:"center", gap:"10px", padding:"11px 20px", borderRadius:"12px", border:`1px solid ${isOnline?"rgba(34,197,94,0.4)":"rgba(255,255,255,0.12)"}`, background:isOnline?"rgba(34,197,94,0.12)":"rgba(255,255,255,0.06)", cursor:toggling?"not-allowed":"pointer", opacity:toggling?0.7:1, transition:"all 0.2s" }}>
            <span style={{ width:"10px", height:"10px", borderRadius:"50%", background:isOnline?"#22c55e":"#475569", animation:isOnline?"pulse 1.5s infinite":"none", flexShrink:0 }} />
            <span style={{ color:isOnline?"#86efac":"#94a3b8", fontSize:"14px", fontWeight:"600" }}>
              {toggling ? "Updating…" : isOnline ? "Online" : "Offline"}
            </span>
            <span style={{ fontSize:"18px" }}>{isOnline ? "🟢" : "⚫"}</span>
          </button>
        </div>
      </div>

      <div style={{ maxWidth:"960px", margin:"0 auto", padding:"28px 32px" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"14px", marginBottom:"28px" }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background:"#fff", borderRadius:"14px", padding:"18px 20px", border:"1px solid #f1f5f9", display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>{s.icon}</div>
              <div>
                <p style={{ fontSize:"22px", fontWeight:"800", color:s.color, margin:0, letterSpacing:"-0.5px" }}>{s.value}</p>
                <p style={{ fontSize:"12px", color:"#64748b", margin:0, fontWeight:"500" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:"4px", background:"#fff", border:"1px solid #f1f5f9", borderRadius:"12px", padding:"4px", marginBottom:"20px" }}>
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ flex:1, padding:"9px 16px", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:active?"700":"500", color:active?"#0f172a":"#64748b", background:active?"#f8fafc":"transparent", transition:"all 0.15s", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                {t.label}
                {t.key === "pending" && pendingCount > 0 && (
                  <span style={{ background:"#f59e0b", color:"#fff", borderRadius:"20px", padding:"1px 7px", fontSize:"11px", fontWeight:"700" }}>{pendingCount}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Refresh */}
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"16px" }}>
          <button onClick={fetchBookings}
            style={{ display:"flex", alignItems:"center", gap:"6px", background:"#fff", border:"1px solid #e2e8f0", borderRadius:"8px", padding:"7px 14px", fontSize:"13px", color:"#64748b", cursor:"pointer" }}
            onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background="#fff"}>
            🔄 Refresh
          </button>
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"64px" }}>
            <div style={{ width:"32px", height:"32px", border:"3px solid #e2e8f0", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
            <p style={{ color:"#94a3b8", fontSize:"13px" }}>Loading bookings…</p>
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign:"center", padding:"64px", background:"#fff", borderRadius:"14px", border:"1px solid #f1f5f9" }}>
            <div style={{ fontSize:"36px", marginBottom:"12px" }}>📋</div>
            <p style={{ color:"#475569", fontWeight:"600", margin:0 }}>No bookings here yet</p>
            <p style={{ color:"#94a3b8", fontSize:"13px", marginTop:"6px" }}>
              {tab === "pending" && "New requests will appear here when customers book."}
              {tab === "active"  && "Your accepted and active trips will show here."}
              {tab === "history" && "Completed and cancelled trips appear here."}
            </p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            {visible.map(b => (
              <BookingCard key={b._id||b.id} booking={b}
                isExpanded={expanded === (b._id||b.id)}
                onToggle={() => setExpanded(expanded === (b._id||b.id) ? null : (b._id||b.id))}
                onRespond={respond} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}

function BookingCard({ booking: b, isExpanded, onToggle, onRespond }) {
  const isPending = b.status === "Pending";
  return (
    <div style={{ background:"#fff", borderRadius:"14px", border:`1px solid ${isPending?"#fde68a":"#f1f5f9"}`, overflow:"hidden", transition:"box-shadow 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.07)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow=""}>

      <button onClick={onToggle}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", border:"none", background:"transparent", cursor:"pointer", textAlign:"left", gap:"12px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", minWidth:0 }}>
          <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:"linear-gradient(135deg,#e0e7ff,#f5f3ff)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"700", color:"#6366f1", fontSize:"15px", flexShrink:0 }}>
            {(b.customer?.name||"?")[0].toUpperCase()}
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontWeight:"600", color:"#0f172a", margin:"0 0 2px", fontSize:"14px" }}>{b.customer?.name || "Customer"}</p>
            <p style={{ color:"#64748b", fontSize:"12px", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.vehicle?.name || "Vehicle"} · Rs {(b.totalPrice||0).toLocaleString()}</p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>
          <StatusBadge status={b.status} />
          <span style={{ color:"#94a3b8", fontSize:"12px" }}>{isExpanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Date strip */}
      <div style={{ padding:"0 20px 14px", display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:"12px", color:"#64748b", background:"#f8fafc", padding:"4px 10px", borderRadius:"6px" }}>📅 {fmt(b.startDate)}</span>
        <span style={{ color:"#94a3b8", fontSize:"12px" }}>→</span>
        <span style={{ fontSize:"12px", color:"#64748b", background:"#f8fafc", padding:"4px 10px", borderRadius:"6px" }}>{fmt(b.endDate)}</span>
      </div>

      {/* Expanded */}
      {isExpanded && (
        <div style={{ padding:"16px 20px 20px", borderTop:"1px solid #f1f5f9" }}>
          {/* Contact — unlocks after accept */}
          {(b.status === "Accepted" || b.status === "Active") ? (
            <div style={{ background:"#f8fafc", borderRadius:"10px", padding:"14px", marginBottom:"14px" }}>
              <p style={{ fontSize:"11px", fontWeight:"700", color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.6px", margin:"0 0 10px" }}>Customer Contact</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
                <div style={{ fontSize:"13px", color:"#334155", display:"flex", alignItems:"center", gap:"8px" }}>👤 {b.customer?.name}</div>
                {b.customer?.phone && <a href={`tel:${b.customer.phone}`} style={{ fontSize:"13px", color:"#6366f1", display:"flex", alignItems:"center", gap:"8px", textDecoration:"none", fontWeight:"500" }}>📞 {b.customer.phone}</a>}
                {b.pickupLocation && <div style={{ fontSize:"13px", color:"#334155", display:"flex", alignItems:"center", gap:"8px" }}>📍 {b.pickupLocation}</div>}
              </div>
            </div>
          ) : isPending ? (
            <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:"10px", padding:"10px 14px", marginBottom:"14px", fontSize:"13px", color:"#92400e" }}>
              🔒 Customer contact info unlocks after you accept this booking
            </div>
          ) : null}

          {/* Details grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"14px" }}>
            {[
              { label:"Vehicle",   value:b.vehicle?.name||"—" },
              { label:"Plate",     value:b.vehicle?.plateNumber||"—" },
              { label:"Type",      value:b.vehicle?.type||"—" },
              { label:"Total",     value:`Rs ${(b.totalPrice||0).toLocaleString()}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background:"#f8fafc", borderRadius:"8px", padding:"10px 12px" }}>
                <p style={{ fontSize:"11px", color:"#94a3b8", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 2px" }}>{label}</p>
                <p style={{ fontSize:"13px", color:"#0f172a", fontWeight:"600", margin:0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          {isPending && (
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={() => onRespond(b._id||b.id, "reject")}
                style={{ flex:1, padding:"10px", borderRadius:"10px", border:"1px solid #fca5a5", background:"#fff1f2", color:"#be123c", fontSize:"13px", fontWeight:"700", cursor:"pointer" }}
                onMouseEnter={e => e.currentTarget.style.background="#ffe4e6"}
                onMouseLeave={e => e.currentTarget.style.background="#fff1f2"}>
                ✕ Reject
              </button>
              <button onClick={() => onRespond(b._id||b.id, "accept")}
                style={{ flex:1, padding:"10px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"#fff", fontSize:"13px", fontWeight:"700", cursor:"pointer", boxShadow:"0 4px 12px rgba(34,197,94,0.3)" }}>
                ✓ Accept
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
