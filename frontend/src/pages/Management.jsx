import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaChartBar, FaCar, FaUsers, FaClipboardList, FaUserTie,
  FaSignOutAlt, FaBell, FaSearch, FaShieldAlt, FaExclamationTriangle,
  FaFileAlt, FaCheckCircle, FaTachometerAlt, FaMoneyBillWave, FaHome,
} from "react-icons/fa";

const API = "http://localhost:5000";

const ROLE_CONFIG = {
  OWNER: { label:"Owner", color:"#7c3aed", bg:"#f5f3ff", badge:"👑" },
  ADMIN: { label:"Admin", color:"#6366f1", bg:"#eef2ff", badge:"⚙️" },
  STAFF: { label:"Staff", color:"#0891b2", bg:"#ecfeff", badge:"🛡️" },
};

const ALL_TABS = [
  { id:"overview",   label:"Overview",   icon:<FaTachometerAlt />, roles:["OWNER","ADMIN","STAFF"] },
  { id:"analytics",  label:"Analytics",  icon:<FaChartBar />,      roles:["OWNER"] },
  { id:"bookings",   label:"Bookings",   icon:<FaClipboardList />, roles:["OWNER","ADMIN"] },
  { id:"vehicles",   label:"Vehicles",   icon:<FaCar />,           roles:["OWNER","ADMIN"] },
  { id:"drivers",    label:"Drivers",    icon:<FaUserTie />,       roles:["OWNER","ADMIN"] },
  { id:"customers",  label:"Customers",  icon:<FaUsers />,         roles:["OWNER","ADMIN"] },
  { id:"documents",  label:"Documents",  icon:<FaFileAlt />,       roles:["OWNER","STAFF"] },
  { id:"disputes",   label:"Disputes",   icon:<FaExclamationTriangle />, roles:["OWNER","STAFF"] },
  { id:"staff",      label:"Staff Mgmt", icon:<FaShieldAlt />,     roles:["OWNER"] },
];

const card = { background:"#fff", borderRadius:"16px", border:"1px solid #f0f0f5", boxShadow:"0 1px 3px rgba(0,0,0,0.05)", overflow:"hidden" };

function PanelHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px", borderBottom:"1px solid #f1f5f9" }}>
      <div>
        <h2 style={{ fontSize:"16px", fontWeight:"600", color:"#0f172a", margin:0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize:"13px", color:"#94a3b8", margin:"2px 0 0" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon, label, hint }) {
  return (
    <div style={{ padding:"56px 24px", textAlign:"center" }}>
      <div style={{ width:"56px", height:"56px", background:"#f1f5f9", borderRadius:"14px", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", fontSize:"22px", color:"#94a3b8" }}>{icon}</div>
      <p style={{ color:"#64748b", fontWeight:"600", fontSize:"14px", margin:0 }}>{label}</p>
      <p style={{ color:"#94a3b8", fontSize:"13px", marginTop:"6px" }}>{hint}</p>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, accent }) {
  return (
    <div style={{ ...card, padding:"24px", position:"relative", transition:"transform 0.2s,box-shadow 0.2s", cursor:"default" }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>
      <div style={{ position:"absolute", top:0, left:0, width:"4px", height:"100%", background:accent, borderRadius:"16px 0 0 16px" }} />
      <div style={{ width:"42px", height:"42px", borderRadius:"10px", background:accent+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px", color:accent, marginBottom:"14px", marginLeft:"8px" }}>{icon}</div>
      <h3 style={{ fontSize:"26px", fontWeight:"800", color:"#0f172a", marginLeft:"8px", letterSpacing:"-0.5px" }}>{value}</h3>
      <p style={{ fontSize:"13px", color:"#64748b", marginTop:"3px", fontWeight:"500", marginLeft:"8px" }}>{title}</p>
      <p style={{ fontSize:"12px", color:"#94a3b8", marginTop:"4px", marginLeft:"8px" }}>{subtitle}</p>
    </div>
  );
}

function BookingsTable({ bookings }) {
  const STATUS_COLOR = { Pending:"#f59e0b", Accepted:"#3b82f6", Active:"#22c55e", Completed:"#94a3b8", Cancelled:"#ef4444" };
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead><tr style={{ background:"#f8fafc" }}>
          {["Customer","Vehicle","Status","Total","Date"].map(h => (
            <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:"11px", fontWeight:"700", color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.6px", borderBottom:"1px solid #f1f5f9" }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {bookings.map((b,i) => (
            <tr key={b._id||i}
              onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background=""}>
              <td style={{ padding:"12px 16px", fontSize:"13px", fontWeight:"500", color:"#0f172a" }}>{b.customer?.name||"N/A"}</td>
              <td style={{ padding:"12px 16px", fontSize:"13px", color:"#334155" }}>{b.vehicle?.name||"Vehicle"}</td>
              <td style={{ padding:"12px 16px" }}>
                <span style={{ fontSize:"12px", fontWeight:"600", color:STATUS_COLOR[b.status]||"#94a3b8" }}>{b.status}</span>
              </td>
              <td style={{ padding:"12px 16px", fontSize:"13px", fontWeight:"600", color:"#0f172a" }}>Rs {(b.totalPrice||0).toLocaleString()}</td>
              <td style={{ padding:"12px 16px", fontSize:"12px", color:"#64748b" }}>{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OverviewPanel({ role, bookings, vehicles }) {
  const stats = role === "STAFF" ? [
    { title:"Documents to Review", value:"0", subtitle:"0 pending verification",  icon:<FaFileAlt />,           accent:"#f59e0b" },
    { title:"Open Disputes",       value:"0", subtitle:"0 awaiting resolution",   icon:<FaExclamationTriangle />, accent:"#ef4444" },
    { title:"Resolved Today",      value:"0", subtitle:"+0 this week",            icon:<FaCheckCircle />,        accent:"#10b981" },
  ] : [
    { title:"Total Revenue",   value:"Rs 0",        subtitle:"+Rs 0 this month",   icon:<FaMoneyBillWave />, accent:"#6366f1" },
    { title:"Active Bookings", value:bookings.filter(b=>["Active","Accepted"].includes(b.status)).length, subtitle:"pending approval", icon:<FaClipboardList />, accent:"#f59e0b" },
    { title:"Total Bookings",  value:bookings.length, subtitle:`${bookings.filter(b=>b.status==="Completed").length} completed`, icon:<FaChartBar />, accent:"#10b981" },
    { title:"Fleet Size",      value:vehicles.length, subtitle:"vehicles registered", icon:<FaCar />, accent:"#3b82f6" },
  ];

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"18px", marginBottom:"28px" }}>
        {stats.map(s => <StatCard key={s.title} {...s} />)}
      </div>
      {role !== "STAFF" && (
        <div style={card}>
          <PanelHeader title="Recent Bookings" subtitle="Latest activity" action={
            <button style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:"10px", padding:"8px 16px", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>Refresh</button>
          } />
          {bookings.length === 0
            ? <EmptyState icon={<FaClipboardList />} label="No bookings yet" hint="Bookings will appear here once customers make reservations." />
            : <BookingsTable bookings={bookings.slice(0,5)} />
          }
        </div>
      )}
      {role === "STAFF" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"18px" }}>
          <div style={card}><PanelHeader title="Pending Documents" subtitle="Customer & driver verifications" /><EmptyState icon={<FaFileAlt />} label="No documents pending" hint="Documents submitted for review appear here." /></div>
          <div style={card}><PanelHeader title="Open Disputes" subtitle="Damage reports & complaints" /><EmptyState icon={<FaExclamationTriangle />} label="No open disputes" hint="Disputes raised by customers or drivers appear here." /></div>
        </div>
      )}
    </div>
  );
}

function VehiclesPanel({ isAdmin }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name:"", type:"", model:"", pricePerHour:"", passengerSeat:"", fuelType:"", plateNumber:"", description:"" });
  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchV(); }, []);
  const fetchV = async () => {
    try { setLoading(true); const { data } = await axios.get(`${API}/api/vehicles`, { headers:{ Authorization:`Bearer ${token}` } }); setVehicles(Array.isArray(data)?data:[]); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  };
  const submit = async () => {
    setSubmitting(true);
    try { await axios.post(`${API}/api/vehicles`, form, { headers:{ Authorization:`Bearer ${token}` } }); setShowForm(false); setForm({ name:"",type:"",model:"",pricePerHour:"",passengerSeat:"",fuelType:"",plateNumber:"",description:"" }); fetchV(); }
    catch(e) { alert(e.response?.data?.message||"Failed to add vehicle"); } finally { setSubmitting(false); }
  };
  const deleteV = async (id) => {
    if (!confirm("Delete this vehicle?")) return;
    try { await axios.delete(`${API}/api/vehicles/${id}`, { headers:{ Authorization:`Bearer ${token}` } }); fetchV(); }
    catch { alert("Failed to delete"); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
        <div>
          <h2 style={{ fontSize:"17px", fontWeight:"700", color:"#0f172a", margin:0 }}>Vehicle Management</h2>
          <p style={{ fontSize:"13px", color:"#64748b", margin:"2px 0 0" }}>{vehicles.length} vehicles in fleet</p>
        </div>
        {isAdmin && <button onClick={() => setShowForm(!showForm)} style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", border:"none", borderRadius:"10px", padding:"9px 18px", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>+ Add Vehicle</button>}
      </div>
      {showForm && isAdmin && (
        <div style={{ ...card, padding:"24px", marginBottom:"24px" }}>
          <h3 style={{ fontSize:"15px", fontWeight:"600", color:"#0f172a", margin:"0 0 18px" }}>Add New Vehicle</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"12px" }}>
            {[{key:"name",label:"Vehicle Name",ph:"e.g. Toyota Hiace"},{key:"type",label:"Type",ph:"e.g. Van, SUV"},{key:"model",label:"Model / Year",ph:"e.g. 2020"},{key:"plateNumber",label:"Plate Number",ph:"BA 1 KHA 1234"},{key:"pricePerHour",label:"Price/Hour (Rs)",ph:"e.g. 500"},{key:"passengerSeat",label:"Seats",ph:"e.g. 8"},{key:"fuelType",label:"Fuel Type",ph:"Petrol / Diesel"}].map(({key,label,ph}) => (
              <div key={key}>
                <label style={{ fontSize:"11px", fontWeight:"700", color:"#64748b", display:"block", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</label>
                <input value={form[key]} onChange={e => setForm(p=>({...p,[key]:e.target.value}))} placeholder={ph}
                  style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:"8px", fontSize:"13px", color:"#0f172a", outline:"none", background:"#f8fafc", boxSizing:"border-box" }}
                  onFocus={e => e.target.style.borderColor="#6366f1"} onBlur={e => e.target.style.borderColor="#e2e8f0"} />
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:"10px", marginTop:"16px" }}>
            <button onClick={() => setShowForm(false)} style={{ padding:"9px 20px", border:"1px solid #e2e8f0", borderRadius:"8px", fontSize:"13px", fontWeight:"600", color:"#64748b", background:"#fff", cursor:"pointer" }}>Cancel</button>
            <button onClick={submit} disabled={submitting} style={{ padding:"9px 20px", border:"none", borderRadius:"8px", fontSize:"13px", fontWeight:"600", color:"#fff", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", cursor:"pointer", opacity:submitting?0.7:1 }}>{submitting?"Adding…":"Add Vehicle"}</button>
          </div>
        </div>
      )}
      {loading ? (
        <div style={{ textAlign:"center", padding:"48px" }}><div style={{ width:"28px", height:"28px", border:"3px solid #e2e8f0", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 10px" }} /><p style={{ color:"#94a3b8", fontSize:"13px" }}>Loading…</p></div>
      ) : vehicles.length === 0 ? (
        <div style={card}><EmptyState icon={<FaCar />} label="No vehicles yet" hint="Add vehicles to start accepting bookings." /></div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"16px" }}>
          {vehicles.map(v => (
            <div key={v._id||v.id} style={{ ...card, padding:"16px" }}>
              <div style={{ height:"130px", background:"linear-gradient(135deg,#e0e7ff,#f5f3ff)", borderRadius:"10px", overflow:"hidden", marginBottom:"12px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"36px" }}>
                {v.imageUrl ? <img src={`${API}/${v.imageUrl}`} alt={v.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "🚗"}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div><h3 style={{ fontSize:"14px", fontWeight:"700", color:"#0f172a", margin:"0 0 2px" }}>{v.name}</h3><p style={{ fontSize:"12px", color:"#64748b", margin:0 }}>{v.type} · Rs {v.pricePerHour}/hr</p></div>
                <span style={{ background:v.isActive?"#f0fdf4":"#fff1f2", color:v.isActive?"#15803d":"#be123c", fontSize:"11px", fontWeight:"700", padding:"3px 8px", borderRadius:"20px" }}>{v.isActive?"Active":"Inactive"}</span>
              </div>
              {isAdmin && (
                <div style={{ display:"flex", gap:"8px", marginTop:"10px" }}>
                  <button style={{ flex:1, padding:"7px", border:"1px solid #e2e8f0", borderRadius:"7px", fontSize:"12px", fontWeight:"600", color:"#6366f1", background:"#fff", cursor:"pointer" }}>Edit</button>
                  <button onClick={() => deleteV(v._id||v.id)} style={{ flex:1, padding:"7px", border:"1px solid #fca5a5", borderRadius:"7px", fontSize:"12px", fontWeight:"600", color:"#dc2626", background:"#fff", cursor:"pointer" }}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function GenericPanel({ title, subtitle, icon, hint }) {
  return <div style={card}><PanelHeader title={title} subtitle={subtitle} /><EmptyState icon={icon} label={`No ${title.toLowerCase()} data yet`} hint={hint} /></div>;
}

function AnalyticsPanel() {
  return (
    <div>
      <h2 style={{ fontSize:"17px", fontWeight:"700", color:"#0f172a", margin:"0 0 20px" }}>Analytics & Reports</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"16px" }}>
        {[{title:"Revenue This Month",value:"Rs 0",icon:"💰",color:"#6366f1"},{title:"Bookings This Week",value:"0",icon:"📅",color:"#f59e0b"},{title:"New Customers",value:"0",icon:"👥",color:"#10b981"},{title:"Fleet Utilization",value:"0%",icon:"🚗",color:"#3b82f6"}].map(s => (
          <div key={s.title} style={{ ...card, padding:"22px" }}>
            <span style={{ fontSize:"28px" }}>{s.icon}</span>
            <p style={{ fontSize:"26px", fontWeight:"800", color:s.color, margin:"12px 0 4px" }}>{s.value}</p>
            <p style={{ fontSize:"13px", color:"#64748b", margin:0, fontWeight:"500" }}>{s.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Management() {
  const navigate = useNavigate();
  const user     = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const role     = user?.role || "STAFF";
  const roleCfg  = ROLE_CONFIG[role] || ROLE_CONFIG.STAFF;
  const visibleTabs = ALL_TABS.filter(t => t.roles.includes(role));

  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id || "overview");
  const [bookings,  setBookings]  = useState([]);
  const [vehicles,  setVehicles]  = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (role !== "STAFF") {
      axios.get(`${API}/api/bookings`,  { headers:{ Authorization:`Bearer ${token}` } }).then(r => setBookings(Array.isArray(r.data)?r.data:[])).catch(()=>{});
      axios.get(`${API}/api/vehicles`,  { headers:{ Authorization:`Bearer ${token}` } }).then(r => setVehicles(Array.isArray(r.data)?r.data:[])).catch(()=>{});
    }
  }, []);

  const logout = () => { localStorage.clear(); navigate("/"); };

  const renderContent = () => {
    switch(activeTab) {
      case "overview":   return <OverviewPanel role={role} bookings={bookings} vehicles={vehicles} />;
      case "analytics":  return <AnalyticsPanel />;
      case "bookings":   return <div style={card}><PanelHeader title="All Bookings" subtitle="Full booking management" />{bookings.length===0?<EmptyState icon={<FaClipboardList />} label="No bookings yet" hint="Bookings appear here once customers reserve." />:<BookingsTable bookings={bookings} />}</div>;
      case "vehicles":   return <VehiclesPanel isAdmin={role==="ADMIN"||role==="OWNER"} />;
      case "drivers":    return <GenericPanel title="Driver Management"   subtitle="View and manage all drivers"           icon={<FaUserTie />}           hint="Registered drivers will appear here." />;
      case "customers":  return <GenericPanel title="Customer Management" subtitle="View all registered customers"         icon={<FaUsers />}             hint="Registered customers will appear here." />;
      case "documents":  return <GenericPanel title="Document Verification" subtitle="Customer and driver document reviews" icon={<FaFileAlt />}           hint="Submitted documents will appear here for review." />;
      case "disputes":   return <GenericPanel title="Dispute Management"  subtitle="Damage reports and complaints"         icon={<FaExclamationTriangle />} hint="Disputes raised by customers or drivers appear here." />;
      case "staff":      return <GenericPanel title="Staff Management"    subtitle="Manage admin and staff accounts"       icon={<FaShieldAlt />}         hint="Staff accounts will appear here." />;
      default:           return null;
    }
  };

  return (
    // fill the Layout container — no position:fixed needed
    <div style={{ display:"flex", flex:1, overflow:"hidden", fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width:"240px", minWidth:"240px", background:"#0f172a", display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0 }}>
        {/* Logo */}
        <div style={{ padding:"24px 24px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"14px" }}>
            <div style={{ width:"34px", height:"34px", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px" }}>🚗</div>
            <span style={{ fontSize:"17px", fontWeight:"700", color:"#fff" }}>VoyageGo</span>
          </div>
          {/* Role badge */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", background:"rgba(255,255,255,0.06)", borderRadius:"8px", padding:"8px 12px" }}>
            <span style={{ fontSize:"16px" }}>{roleCfg.badge}</span>
            <div>
              <p style={{ fontSize:"12px", fontWeight:"700", color:"#fff", margin:0 }}>{user?.name||user?.email||"User"}</p>
              <p style={{ fontSize:"10px", color:roleCfg.color, margin:0, fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.5px" }}>{roleCfg.label}</p>
            </div>
          </div>
        </div>

        <div style={{ padding:"16px 24px 8px", flexShrink:0 }}>
          <span style={{ fontSize:"10px", fontWeight:"700", color:"#475569", textTransform:"uppercase", letterSpacing:"1px" }}>Main Menu</span>
        </div>

        <nav style={{ padding:"0 12px", flex:1, overflowY:"auto" }}>
          {visibleTabs.map(item => {
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"10px 14px", borderRadius:"10px", border:"none", cursor:"pointer", marginBottom:"2px", fontSize:"13px", fontWeight:active?"600":"500", color:active?"#fff":"#94a3b8", background:active?"linear-gradient(135deg,#6366f1,#8b5cf6)":"transparent", transition:"all 0.15s", textAlign:"left" }}
                onMouseEnter={e => { if(!active){e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="#e2e8f0";} }}
                onMouseLeave={e => { if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="#94a3b8";} }}>
                <span style={{ fontSize:"14px" }}>{item.icon}</span>
                {item.label}
                {active && <span style={{ marginLeft:"auto", width:"6px", height:"6px", background:"rgba(255,255,255,0.6)", borderRadius:"50%" }} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom — Home + Sign Out */}
        <div style={{ padding:"12px", borderTop:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
          {/* Home button — key fix for admin/owner/staff to get back */}
          <button onClick={() => navigate("/")}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"10px 14px", borderRadius:"10px", border:"none", cursor:"pointer", marginBottom:"4px", fontSize:"13px", fontWeight:"500", color:"#94a3b8", background:"transparent", transition:"all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.color="#e2e8f0"; }}
            onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#94a3b8"; }}>
            <FaHome /> Home
          </button>
          <button onClick={logout}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"10px 14px", borderRadius:"10px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:"500", color:"#94a3b8", background:"transparent", transition:"all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(239,68,68,0.1)"; e.currentTarget.style.color="#f87171"; }}
            onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#94a3b8"; }}>
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <header style={{ background:"#fff", borderBottom:"1px solid #f1f5f9", padding:"0 28px", height:"60px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <h1 style={{ fontSize:"16px", fontWeight:"700", color:"#0f172a", margin:0 }}>
              {visibleTabs.find(t => t.id === activeTab)?.label || "Dashboard"}
            </h1>
            <span style={{ background:roleCfg.bg, color:roleCfg.color, fontSize:"11px", fontWeight:"700", padding:"2px 8px", borderRadius:"20px" }}>{roleCfg.label}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"7px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:"9px", padding:"7px 12px", fontSize:"13px", color:"#94a3b8" }}>
              <FaSearch style={{ fontSize:"11px" }} /><span>Search…</span>
            </div>
            <button style={{ width:"36px", height:"36px", borderRadius:"9px", border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748b", fontSize:"14px" }}>
              <FaBell />
            </button>
            <div style={{ width:"36px", height:"36px", borderRadius:"9px", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"13px", fontWeight:"700" }}>
              {(user?.name||"U")[0].toUpperCase()}
            </div>
          </div>
        </header>
        <main style={{ flex:1, padding:"24px 28px", overflowY:"auto" }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
