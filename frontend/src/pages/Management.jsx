import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaChartBar, FaCar, FaUsers, FaClipboardList, FaUserTie,
  FaShieldAlt, FaExclamationTriangle, FaFileAlt, FaCheckCircle,
  FaTachometerAlt, FaMoneyBillWave, FaSearch,
  FaTimes, FaUserCheck, FaUserSlash, FaMoneyBill, FaUserPlus, FaCamera, FaGavel,
} from "react-icons/fa";
import { ENDPOINTS, BASE_URL } from "../services/api.js";
import WalkInBookingModal from "../components/WalkInBookingModal.jsx";

const ROLE_CONFIG = {
  OWNER: { label:"Owner", color:"#EA580C", bg:"#f5f3ff" },
  ADMIN: { label:"Admin", color:"#F97316", bg:"#FFF7ED" },
  STAFF: { label:"Staff", color:"#0891b2", bg:"#ecfeff" },
};

const ALL_TABS = [
  { id:"overview",  label:"Overview",   icon:<FaTachometerAlt />,       roles:["OWNER","ADMIN","STAFF"] },
  { id:"analytics", label:"Analytics",  icon:<FaChartBar />,            roles:["OWNER"] },
  { id:"bookings",  label:"Bookings",   icon:<FaClipboardList />,       roles:["OWNER","ADMIN"] },
  { id:"vehicles",  label:"Vehicles",   icon:<FaCar />,                 roles:["OWNER","ADMIN"] },
  { id:"drivers",   label:"Drivers",    icon:<FaUserTie />,             roles:["OWNER","ADMIN"] },
  { id:"customers", label:"Customers",  icon:<FaUsers />,               roles:["OWNER","ADMIN"] },
  { id:"fines",     label:"Fines",      icon:<FaGavel />,               roles:["OWNER","ADMIN","STAFF"] },
  { id:"documents", label:"Documents",  icon:<FaFileAlt />,             roles:["OWNER","STAFF"] },
  { id:"condition-reports",  label:"Condition Reports",   icon:<FaExclamationTriangle />, roles:["OWNER","ADMIN","STAFF"] },
  { id:"staff",     label:"Staff Mgmt", icon:<FaShieldAlt />,           roles:["OWNER"] },
];

const card = { background:"#fff", borderRadius:"16px", border:"1px solid #f0f0f5", boxShadow:"0 1px 3px rgba(0,0,0,0.05)", overflow:"hidden" };

const STATUS_COLOR = { PendingDriver:"#f59e0b", Confirmed:"#3b82f6", Active:"#22c55e", Completed:"#94a3b8", Cancelled:"#ef4444" };
const STATUS_LABEL = { PendingDriver:"Awaiting Driver", Confirmed:"Confirmed", Active:"Active", Completed:"Completed", Cancelled:"Cancelled" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
function Spinner() {
  return (
    <div style={{ textAlign:"center", padding:"48px" }}>
      <div style={{ width:"28px", height:"28px", border:"3px solid #e2e8f0", borderTopColor:"#F97316", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 10px" }} />
      <p style={{ color:"#94a3b8", fontSize:"13px" }}>Loading…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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

// ─── BookingsTable ─────────────────────────────────────────────────────────────
function BookingsTable({ bookings, onCashPayment, onCancel, onDelete, showActions=false }) {
  const [loadingId, setLoadingId] = useState(null);
  const headers = showActions
    ? ["Customer","Vehicle","Status","Payment","Total","Date","Actions",""]
    : ["Customer","Vehicle","Status","Payment","Total","Date"];

  async function handleCollectEsewa(bookingId) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/pay/esewa/admin-initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingId }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Could not initiate eSewa.");
      return;
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = data.gateway_url;

    const fields = {
      amount: data.amount,
      tax_amount: data.tax_amount,
      total_amount: data.total_amount,
      transaction_uuid: data.transaction_uuid,
      product_code: data.product_code,
      product_service_charge: 0,
      product_delivery_charge: 0,
      success_url: data.success_url,
      failure_url: data.failure_url,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: data.signature,
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:"#f8fafc" }}>
            {headers.map((h,i) => <th key={i} style={{ padding:"10px 16px", textAlign:"left", fontSize:"11px", fontWeight:"700", color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.6px", borderBottom:"1px solid #f1f5f9" }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b, i) => {
            const ps        = b.paymentStatus || "Unpaid";
            const cancelKey = b._id + "cancel";
            const cashKey   = b._id + "cash";
            const canCancel = showActions && !["Completed","Cancelled"].includes(b.status);
            const canPay    = showActions && ["Confirmed", "PendingPayment"].includes(b.status) && ps==="Unpaid";
            return (
              <tr key={b._id||i} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                <td style={{ padding:"12px 16px", fontSize:13, fontWeight:500, color:"#0f172a" }}>{b.customer?.name||"N/A"}</td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{b.vehicle?.name||"—"}</div>
                  {b.vehicle?.plateNumber && <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{b.vehicle.plateNumber}{b.vehicle.type?` · ${b.vehicle.type}`:""}</div>}
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:STATUS_COLOR[b.status]||"#94a3b8", background:(STATUS_COLOR[b.status]||"#94a3b8")+"18", padding:"3px 9px", borderRadius:20 }}>
                    {STATUS_LABEL[b.status]||b.status}
                  </span>
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:20, background:ps==="Paid"?"#f0fdf4":"#f1f5f9", color:ps==="Paid"?"#15803d":"#64748b" }}>{ps}</span>
                </td>
                <td style={{ padding:"12px 16px", fontSize:13, fontWeight:600, color:"#0f172a" }}>Rs {(b.totalPrice||0).toLocaleString()}</td>
                <td style={{ padding:"12px 16px", fontSize:12, color:"#64748b" }}>{b.createdAt?new Date(b.createdAt).toLocaleDateString():"—"}</td>
                {showActions && (
                  <td style={{ padding:"10px 16px" }}>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                      {canPay && (
                        <>
                        <button disabled={loadingId===cashKey} onClick={async()=>{setLoadingId(cashKey);await onCashPayment(b._id);setLoadingId(null);}}
                          style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:7, fontSize:11, fontWeight:700, color:"#15803d", background:"#f0fdf4", border:"1px solid #86efac", cursor:loadingId===cashKey?"not-allowed":"pointer", opacity:loadingId===cashKey?0.6:1, whiteSpace:"nowrap" }}
                          onMouseEnter={e=>{if(loadingId!==cashKey){e.currentTarget.style.background="#15803d";e.currentTarget.style.color="#fff";}}}
                          onMouseLeave={e=>{if(loadingId!==cashKey){e.currentTarget.style.background="#f0fdf4";e.currentTarget.style.color="#15803d";}}}>
                          {loadingId===cashKey?"…":<><FaMoneyBill /> Cash Paid</>}
                        </button>
                        <button disabled={loadingId===cashKey} onClick={()=>handleCollectEsewa(b._id)}
                          style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:7, fontSize:11, fontWeight:700, color:"#1d4ed8", background:"#eff6ff", border:"1px solid #93c5fd", cursor:"pointer", whiteSpace:"nowrap" }}
                          onMouseEnter={e=>{e.currentTarget.style.background="#1d4ed8";e.currentTarget.style.color="#fff";}}
                          onMouseLeave={e=>{e.currentTarget.style.background="#eff6ff";e.currentTarget.style.color="#1d4ed8";}}>
                          <FaMoneyBill /> Collect via eSewa
                        </button>
                        </>
                      )}
                      {canCancel && (
                        <button disabled={loadingId===cancelKey} onClick={async()=>{if(!confirm("Cancel this booking?"))return;setLoadingId(cancelKey);await onCancel(b._id);setLoadingId(null);}}
                          style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:7, fontSize:11, fontWeight:700, color:"#ef4444", background:"#fff1f2", border:"1px solid #fca5a540", cursor:loadingId===cancelKey?"not-allowed":"pointer", opacity:loadingId===cancelKey?0.6:1, whiteSpace:"nowrap" }}
                          onMouseEnter={e=>{if(loadingId!==cancelKey){e.currentTarget.style.background="#ef4444";e.currentTarget.style.color="#fff";}}}
                          onMouseLeave={e=>{if(loadingId!==cancelKey){e.currentTarget.style.background="#fff1f2";e.currentTarget.style.color="#ef4444";}}}>
                          {loadingId===cancelKey?"…":<><FaTimes /> Cancel</>}
                        </button>
                      )}
                      {!canPay && !canCancel && <span style={{ fontSize:12, color:"#cbd5e1" }}>—</span>}
                    </div>
                  </td>
                )}
                {showActions && (
                  <td style={{ padding:"10px 16px" }}>
                    {onDelete && (
                      <button onClick={()=>{ if(!confirm("Permanently delete this booking?"))return; onDelete(b._id||b.id); }}
                        style={{ padding:"5px 10px", border:"1px solid #fca5a5", borderRadius:7, fontSize:11, fontWeight:700, color:"#dc2626", background:"#fef2f2", cursor:"pointer", whiteSpace:"nowrap" }}
                        onMouseEnter={e=>{ e.currentTarget.style.background="#dc2626"; e.currentTarget.style.color="#fff"; }}
                        onMouseLeave={e=>{ e.currentTarget.style.background="#fef2f2"; e.currentTarget.style.color="#dc2626"; }}>
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Overview Panel ───────────────────────────────────────────────────────────
function OverviewPanel({ role, bookings, vehicles, conditionReports, onCashPayment, onCancel, pendingDocsCount }) {
  const unreviewedCount = conditionReports.filter(r => !r.conditionReportReviewed).length;
  const stats = role==="STAFF"
    ? [
        { title:"Documents to Review", value:pendingDocsCount, subtitle:`${pendingDocsCount} pending`,   icon:<FaFileAlt />,           accent:"#f59e0b" },
        { title:"Condition Reports",   value:unreviewedCount, subtitle:`${unreviewedCount} awaiting`,  icon:<FaExclamationTriangle />,accent:"#ef4444" },
      ]
    : [
        { title:"Active Bookings", value:bookings.filter(b=>["Active","Confirmed"].includes(b.status)).length, subtitle:`${bookings.filter(b=>b.status==="PendingDriver").length} awaiting driver`, icon:<FaClipboardList />, accent:"#f59e0b" },
        { title:"Total Bookings",  value:bookings.length, subtitle:`${bookings.filter(b=>b.status==="Completed").length} completed`, icon:<FaChartBar />, accent:"#10b981" },
        { title:"Fleet Size",      value:vehicles.length, subtitle:"vehicles registered", icon:<FaCar />, accent:"#3b82f6" },
        { title:"Total Revenue",   value:`Rs ${bookings.filter(b=>b.paymentStatus==="Paid").reduce((s,b)=>s+(b.totalPrice||0),0).toLocaleString()}`, subtitle:`${bookings.filter(b=>b.paymentStatus==="Paid").length} paid bookings`, icon:<FaMoneyBillWave />, accent:"#F97316" },
      ];
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"18px", marginBottom:"28px" }}>
        {stats.map(s => <StatCard key={s.title} {...s} />)}
      </div>
      {role!=="STAFF" && (
        <div style={card}>
          <PanelHeader title="Recent Bookings" subtitle="Latest activity" />
          {bookings.length===0 ? <EmptyState icon={<FaClipboardList />} label="No bookings yet" hint="Bookings appear here once customers reserve." />
            : <BookingsTable bookings={bookings.slice(0,5)} onCashPayment={onCashPayment} onCancel={onCancel} showActions={true} />}
        </div>
      )}
      {role==="STAFF" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"18px" }}>
          <div style={card}>
            <PanelHeader title="Pending Documents" subtitle="Customer & driver verifications" />
            <EmptyState 
              icon={<FaFileAlt />} 
              label={pendingDocsCount === 0 ? "No documents pending" : `${pendingDocsCount} document${pendingDocsCount > 1 ? "s" : ""} to review`} 
              hint="Go to Documents tab to review." 
            />
          </div>
          <div style={card}>
            <PanelHeader title="Condition Reports" subtitle="Pre and post trip condition reports" />
            <EmptyState 
              icon={<FaExclamationTriangle />} 
              label={unreviewedCount === 0 ? "No open condition reports" : `${unreviewedCount} report${unreviewedCount > 1 ? "s" : ""} awaiting review`} 
              hint="Condition reports appear here." 
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Assign Drivers Modal ─────────────────────────────────────────────────────
function AssignDriversModal({ vehicle, onClose, onSaved, token }) {
  const [allDrivers,  setAllDrivers]  = useState([]);
  const [selectedIds, setSelectedIds] = useState((vehicle.drivers||[]).map(d=>d._id||d.id||d));
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    axios.get(ENDPOINTS.DRIVERS, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => setAllDrivers(Array.isArray(r.data) ? r.data.filter(d=>d.isDriverVerified) : []))
      .catch(() => setAllDrivers([]))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  }

  async function save() {
    setSaving(true);
    try {
      await axios.patch(`${ENDPOINTS.VEHICLES}/${vehicle._id||vehicle.id}/drivers`, { driverIds: selectedIds }, { headers:{ Authorization:`Bearer ${token}` } });
      onSaved(); onClose();
    } catch(e) { alert(e.response?.data?.message||"Failed to assign drivers."); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:480, maxHeight:"80vh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding:"20px 24px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div><h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#0f172a" }}>Assign Drivers</h3><p style={{ margin:"2px 0 0", fontSize:13, color:"#64748b" }}>{vehicle.name}</p></div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, color:"#94a3b8", cursor:"pointer" }}>&times;</button>
        </div>
        <div style={{ padding:"10px 24px", background:"#f8fafc", borderBottom:"1px solid #f1f5f9" }}>
          <p style={{ margin:0, fontSize:12, color:"#64748b" }}>Only verified drivers are shown. Selected drivers will be auto-assigned to bookings for this vehicle.</p>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"12px 24px" }}>
          {loading ? <p style={{ textAlign:"center", color:"#94a3b8", fontSize:13, padding:24 }}>Loading drivers…</p>
          : allDrivers.length===0 ? <p style={{ textAlign:"center", color:"#64748b", fontSize:13, padding:24 }}>No verified drivers found. Verify drivers in the Drivers tab first.</p>
          : allDrivers.map(d => {
            const id = d._id||d.id;
            const selected = selectedIds.includes(id);
            return (
              <div key={id} onClick={() => toggle(id)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:10, cursor:"pointer", marginBottom:6, border:`1.5px solid ${selected?"#F97316":"#e2e8f0"}`, background:selected?"#FFF7ED":"#fff", transition:"all 0.15s" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:selected?"#F97316":"#e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", color:selected?"#fff":"#94a3b8", fontSize:14, fontWeight:700, flexShrink:0 }}>
                  {(d.name||"D")[0].toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:700, color:selected?"#F97316":"#0f172a" }}>{d.name}</p>
                  <p style={{ margin:0, fontSize:11, color:"#64748b" }}>
                    {d.isAvailable?"Online":"Offline"}
                    {d.driverRatePerHour > 0 && ` · Rs ${d.driverRatePerHour}/hr`}
                  </p>
                </div>
                <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${selected?"#F97316":"#cbd5e1"}`, background:selected?"#F97316":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {selected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding:"16px 24px", borderTop:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:13, color:"#64748b" }}>{selectedIds.length} driver{selectedIds.length!==1?"s":""} selected</span>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} style={{ padding:"9px 20px", border:"1px solid #e2e8f0", borderRadius:9, fontSize:13, fontWeight:600, color:"#64748b", background:"#fff", cursor:"pointer" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ padding:"9px 20px", border:"none", borderRadius:9, fontSize:13, fontWeight:600, color:"#fff", background:"linear-gradient(135deg,#F97316,#EA580C)", cursor:saving?"not-allowed":"pointer", opacity:saving?0.7:1 }}>
              {saving?"Saving…":"Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Image Picker ─────────────────────────────────────────────────────────────
// Converts a selected file to base64. Displays preview. Returns base64 string via onChange.
function ImagePicker({ value, onChange }) {
  const inputRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Image must be under 3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target.result); // base64 string
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
      {value ? (
        <div style={{ position:"relative", height:120, borderRadius:10, overflow:"hidden", border:"1px solid #e2e8f0" }}>
          <img src={value} alt="Vehicle" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          <button onClick={() => { onChange(""); if(inputRef.current) inputRef.current.value=""; }}
            style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,0.55)", border:"none", borderRadius:"50%", width:24, height:24, color:"#fff", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            &times;
          </button>
          <button onClick={() => inputRef.current?.click()}
            style={{ position:"absolute", bottom:6, right:6, background:"rgba(0,0,0,0.55)", border:"none", borderRadius:7, color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer", padding:"4px 8px" }}>
            Change
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()}
          style={{ width:"100%", height:90, border:"1.5px dashed #FDBA74", borderRadius:10, background:"#f8faff", color:"#F97316", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.15s" }}
          onMouseEnter={e=>{e.currentTarget.style.background="#FFF7ED";e.currentTarget.style.borderColor="#F97316";}}
          onMouseLeave={e=>{e.currentTarget.style.background="#f8faff";e.currentTarget.style.borderColor="#FDBA74";}}>
          <FaCamera style={{ fontSize:16 }} /> Upload vehicle photo
        </button>
      )}
      <p style={{ margin:"4px 0 0", fontSize:11, color:"#94a3b8" }}>JPG or PNG · max 3MB</p>
    </div>
  );
}

// ─── Update Image Modal ───────────────────────────────────────────────────────
function UpdateImageModal({ vehicle, token, onClose, onSaved }) {
  const existingImg = vehicle.imageUrl
    ? (vehicle.imageUrl.startsWith("data:") ? vehicle.imageUrl : `${BASE_URL}/${vehicle.imageUrl}`)
    : "";
  const [preview, setPreview] = useState(existingImg);
  const [saving,  setSaving]  = useState(false);
  const inputRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert("Image must be under 3MB."); return; }
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true);
    try {
      await axios.patch(
        `${ENDPOINTS.VEHICLES}/${vehicle._id || vehicle.id}`,
        { imageUrl: preview },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSaved();
      onClose();
    } catch(e) {
      alert(e.response?.data?.message || "Failed to save image.");
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:420, boxShadow:"0 20px 60px rgba(0,0,0,0.2)", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"18px 22px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#0f172a" }}>
              {vehicle.imageUrl ? "Update Vehicle Photo" : "Add Vehicle Photo"}
            </h3>
            <p style={{ margin:"2px 0 0", fontSize:12, color:"#64748b" }}>{vehicle.name}</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, color:"#94a3b8", cursor:"pointer", lineHeight:1 }}>&times;</button>
        </div>

        {/* Image area */}
        <div style={{ padding:"20px 22px" }}>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />

          {preview ? (
            <div style={{ position:"relative", height:180, borderRadius:12, overflow:"hidden", border:"1px solid #e2e8f0", marginBottom:12 }}>
              <img src={preview} alt="Preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              <button
                onClick={() => { setPreview(""); if(inputRef.current) inputRef.current.value=""; }}
                style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.6)", border:"none", borderRadius:"50%", width:26, height:26, color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                &times;
              </button>
            </div>
          ) : (
            <div onClick={() => inputRef.current?.click()}
              style={{ height:160, border:"2px dashed #FDBA74", borderRadius:12, background:"#f8faff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer", marginBottom:12, transition:"all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background="#FFF7ED"; e.currentTarget.style.borderColor="#F97316"; }}
              onMouseLeave={e => { e.currentTarget.style.background="#f8faff"; e.currentTarget.style.borderColor="#FDBA74"; }}>
              <FaCamera style={{ fontSize:24, color:"#F97316" }} />
              <span style={{ fontSize:13, fontWeight:600, color:"#F97316" }}>Click to upload photo</span>
              <span style={{ fontSize:11, color:"#94a3b8" }}>JPG or PNG · max 3MB</span>
            </div>
          )}

          <button onClick={() => inputRef.current?.click()}
            style={{ width:"100%", padding:"8px", border:"1px solid #e2e8f0", borderRadius:9, fontSize:13, fontWeight:600, color:"#334155", background:"#f8fafc", cursor:"pointer" }}>
            {preview ? "Choose different photo" : "Browse files"}
          </button>
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 22px", borderTop:"1px solid #f1f5f9", display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"9px 20px", border:"1px solid #e2e8f0", borderRadius:9, fontSize:13, fontWeight:600, color:"#64748b", background:"#fff", cursor:"pointer" }}>Cancel</button>
          <button onClick={save} disabled={saving || !preview}
            style={{ padding:"9px 20px", border:"none", borderRadius:9, fontSize:13, fontWeight:600, color:"#fff", background:(!preview||saving)?"#e2e8f0":"linear-gradient(135deg,#F97316,#EA580C)", cursor:(!preview||saving)?"not-allowed":"pointer", opacity:saving?0.7:1 }}>
            {saving ? "Saving…" : "Save Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Vehicle Modal ───────────────────────────────────────────────────────
function EditVehicleModal({ vehicle, token, onClose, onSaved }) {
  const [form,   setForm]   = useState({
    name:          vehicle.name          || "",
    type:          vehicle.type          || "",
    model:         vehicle.model         || "",
    company:       vehicle.company       || "",
    pricePerHour:  String(vehicle.pricePerHour  || ""),
    passengerSeat: String(vehicle.passengerSeat || ""),
    fuelType:      vehicle.fuelType      || "",
    plateNumber:   vehicle.plateNumber   || "",
    description:   vehicle.description   || "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await axios.patch(
        `${ENDPOINTS.VEHICLES}/${vehicle._id || vehicle.id}`,
        { ...form, pricePerHour: Number(form.pricePerHour), passengerSeat: Number(form.passengerSeat) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSaved();
      onClose();
    } catch(e) {
      alert(e.response?.data?.message || "Failed to save vehicle.");
    } finally { setSaving(false); }
  }

  const lbl = { fontSize:"11px", fontWeight:"700", color:"#64748b", display:"block", marginBottom:"4px", textTransform:"uppercase" };
  const inp  = { width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:"8px", fontSize:"13px", outline:"none", background:"#f8fafc", boxSizing:"border-box" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:540, maxHeight:"85vh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div style={{ padding:"20px 24px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div>
            <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#0f172a" }}>Edit Vehicle</h3>
            <p style={{ margin:"2px 0 0", fontSize:13, color:"#64748b" }}>{vehicle.name}</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, color:"#94a3b8", cursor:"pointer", lineHeight:1 }}>&times;</button>
        </div>

        {/* Form */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[
              { key:"name",          label:"Vehicle name",   ph:"Toyota HiAce" },
              { key:"model",         label:"Model / year",   ph:"2022" },
              { key:"company",       label:"Company",        ph:"Toyota" },
              { key:"plateNumber",   label:"Plate number",   ph:"BA 1 KHA 1234" },
              { key:"pricePerHour",  label:"Price / hr (Rs)",ph:"800" },
              { key:"passengerSeat", label:"Seats",          ph:"8" },
            ].map(({ key, label, ph }) => (
              <div key={key}>
                <label style={lbl}>{label}</label>
                <input value={form[key]}
                  onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
                  placeholder={ph}
                  style={inp}
                  onFocus={e => e.target.style.borderColor="#F97316"}
                  onBlur={e  => e.target.style.borderColor="#e2e8f0"} />
              </div>
            ))}

            <div>
              <label style={lbl}>Type</label>
              <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}
                style={{ ...inp, cursor:"pointer" }}>
                <option value="" disabled>Select…</option>
                {["Sedan","Hatchback","SUV","Electric","Luxury","Offroad","Convertible","Hybrid"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label style={lbl}>Fuel type</label>
              <select value={form.fuelType} onChange={e => setForm(p => ({...p, fuelType: e.target.value}))}
                style={{ ...inp, cursor:"pointer" }}>
                <option value="" disabled>Select…</option>
                {["Petrol","Diesel","Electric","Hybrid"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div style={{ gridColumn:"1 / -1" }}>
              <label style={lbl}>Description</label>
              <textarea value={form.description}
                onChange={e => setForm(p => ({...p, description: e.target.value}))}
                placeholder="Optional vehicle description…" rows={2}
                style={{ ...inp, resize:"none", fontFamily:"inherit" }}
                onFocus={e => e.target.style.borderColor="#F97316"}
                onBlur={e  => e.target.style.borderColor="#e2e8f0"} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"16px 24px", borderTop:"1px solid #f1f5f9", display:"flex", justifyContent:"flex-end", gap:10, flexShrink:0 }}>
          <button onClick={onClose}
            style={{ padding:"9px 20px", border:"1px solid #e2e8f0", borderRadius:9, fontSize:13, fontWeight:600, color:"#64748b", background:"#fff", cursor:"pointer" }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            style={{ padding:"9px 20px", border:"none", borderRadius:9, fontSize:13, fontWeight:600, color:"#fff", background:"linear-gradient(135deg,#F97316,#EA580C)", cursor:saving?"not-allowed":"pointer", opacity:saving?0.7:1 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Vehicles Panel ───────────────────────────────────────────────────────────
function VehiclesPanel({ isAdmin }) {
  const [vehicles,     setVehicles]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [imageTarget,  setImageTarget]  = useState(null);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form, setForm] = useState({ name:"",type:"",model:"",company:"",pricePerHour:"",passengerSeat:"",fuelType:"",plateNumber:"",description:"",imageUrl:"" });
  const token = localStorage.getItem("token");

  useEffect(() => { fetchV(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchV = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(ENDPOINTS.VEHICLES, { headers:{ Authorization:`Bearer ${token}` } });
      setVehicles(Array.isArray(data)?data:[]);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await axios.post(ENDPOINTS.VEHICLES, form, { headers:{ Authorization:`Bearer ${token}` } });
      setShowForm(false);
      setForm({ name:"",type:"",model:"",company:"",pricePerHour:"",passengerSeat:"",fuelType:"",plateNumber:"",description:"",imageUrl:"" });
      fetchV();
    } catch(e) { alert(e.response?.data?.message||"Failed to add vehicle"); }
    finally { setSubmitting(false); }
  };

  const deleteV = async id => {
    if (!confirm("Delete this vehicle?")) return;
    try { await axios.delete(`${ENDPOINTS.VEHICLES}/${id}`, { headers:{ Authorization:`Bearer ${token}` } }); fetchV(); }
    catch { alert("Failed to delete"); }
  };

  const removeDriver = async (vehicleId, driverId, currentDrivers) => {
    const newIds = currentDrivers.map(d=>d._id||d.id||d).filter(id=>String(id)!==String(driverId));
    try {
      await axios.patch(`${ENDPOINTS.VEHICLES}/${vehicleId}/drivers`, { driverIds:newIds }, { headers:{ Authorization:`Bearer ${token}` } });
      fetchV();
    } catch(e) { alert(e.response?.data?.message||"Failed to remove driver."); }
  };

  // Helper to get image src — handles base64 and URL paths
  function imgSrc(v) {
    if (!v.imageUrl) return null;
    if (v.imageUrl.startsWith("data:")) return v.imageUrl;
    return `${BASE_URL}/${v.imageUrl}`;
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
        <div>
          <h2 style={{ fontSize:"17px", fontWeight:"700", color:"#0f172a", margin:0 }}>Vehicle Management</h2>
          <p style={{ fontSize:"13px", color:"#64748b", margin:"2px 0 0" }}>{vehicles.length} vehicles in fleet</p>
        </div>
        {isAdmin && <button onClick={() => setShowForm(!showForm)} style={{ background:"linear-gradient(135deg,#F97316,#EA580C)", color:"#fff", border:"none", borderRadius:"10px", padding:"9px 18px", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>+ Add Vehicle</button>}
      </div>

      {/* Add vehicle form */}
      {showForm && isAdmin && (
        <div style={{ ...card, padding:"24px", marginBottom:"24px" }}>
          <h3 style={{ fontSize:"15px", fontWeight:"600", color:"#0f172a", margin:"0 0 18px" }}>Add New Vehicle</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"12px" }}>
            {[
              {key:"name",label:"Name",ph:"Toyota HiAce"},
              {key:"model",label:"Model",ph:"2022"},
              {key:"company",label:"Company",ph:"Toyota"},
              {key:"plateNumber",label:"Plate",ph:"BA 1 KHA 1234"},
              {key:"pricePerHour",label:"Price/Hr (Rs)",ph:"800"},
              {key:"passengerSeat",label:"Seats",ph:"8"},
            ].map(({ key, label, ph }) => (
              <div key={key}>
                <label style={{ fontSize:"11px", fontWeight:"700", color:"#64748b", display:"block", marginBottom:"4px", textTransform:"uppercase" }}>{label}</label>
                <input value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} placeholder={ph}
                  style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:"8px", fontSize:"13px", outline:"none", background:"#f8fafc", boxSizing:"border-box" }}
                  onFocus={e=>e.target.style.borderColor="#F97316"} onBlur={e=>e.target.style.borderColor="#e2e8f0"} />
              </div>
            ))}
            {[
              {key:"type",label:"Type",opts:["Sedan","Hatchback","SUV","Electric","Luxury","Offroad","Convertible","Hybrid"]},
              {key:"fuelType",label:"Fuel",opts:["Petrol","Diesel","Electric","Hybrid"]},
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <label style={{ fontSize:"11px", fontWeight:"700", color:"#64748b", display:"block", marginBottom:"4px", textTransform:"uppercase" }}>{label}</label>
                <select value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:"8px", fontSize:"13px", outline:"none", background:"#f8fafc", boxSizing:"border-box", cursor:"pointer" }}>
                  <option value="" disabled>Select…</option>
                  {opts.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}

            {/* Description — spans full width */}
            <div style={{ gridColumn:"1 / -1" }}>
              <label style={{ fontSize:"11px", fontWeight:"700", color:"#64748b", display:"block", marginBottom:"4px", textTransform:"uppercase" }}>Description</label>
              <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}
                placeholder="e.g. Comfortable Toyota HiAce suitable for group travel across Nepal…" rows={2}
                style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:"8px", fontSize:"13px", outline:"none", background:"#f8fafc", boxSizing:"border-box", resize:"none", fontFamily:"inherit" }}
                onFocus={e=>e.target.style.borderColor="#F97316"} onBlur={e=>e.target.style.borderColor="#e2e8f0"} />
            </div>

            {/* Image upload — spans full width */}
            <div style={{ gridColumn:"1 / -1" }}>
              <label style={{ fontSize:"11px", fontWeight:"700", color:"#64748b", display:"block", marginBottom:"6px", textTransform:"uppercase" }}>Vehicle Photo</label>
              <ImagePicker value={form.imageUrl} onChange={val => setForm(p => ({...p, imageUrl: val}))} />
            </div>
          </div>

          <div style={{ display:"flex", gap:"10px", marginTop:"16px" }}>
            <button onClick={() => setShowForm(false)} style={{ padding:"9px 20px", border:"1px solid #e2e8f0", borderRadius:"8px", fontSize:"13px", fontWeight:"600", color:"#64748b", background:"#fff", cursor:"pointer" }}>Cancel</button>
            <button onClick={submit} disabled={submitting} style={{ padding:"9px 20px", border:"none", borderRadius:"8px", fontSize:"13px", fontWeight:"600", color:"#fff", background:"linear-gradient(135deg,#F97316,#EA580C)", cursor:"pointer", opacity:submitting?0.7:1 }}>
              {submitting?"Adding…":"Add Vehicle"}
            </button>
          </div>
        </div>
      )}

      {/* Vehicle grid */}
      {loading ? <Spinner /> : vehicles.length===0 ? (
        <div style={card}><EmptyState icon={<FaCar />} label="No vehicles yet" hint="Add vehicles to start accepting bookings." /></div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"16px" }}>
          {vehicles.map(v => {
            const assignedDrivers = v.drivers || [];
            const driverCount     = assignedDrivers.length;
            const img             = imgSrc(v);
            return (
              <div key={v._id||v.id} style={{ ...card, padding:"16px" }}>
                {/* Image */}
                <div style={{ height:"130px", background:"linear-gradient(135deg,#FED7AA,#f5f3ff)", borderRadius:"10px", overflow:"hidden", marginBottom:"12px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {img
                    ? <img src={img} alt={v.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FDBA74" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  }
                </div>

                {/* Name + status */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <h3 style={{ fontSize:"14px", fontWeight:"700", color:"#0f172a", margin:"0 0 2px" }}>{v.name}</h3>
                    <p style={{ fontSize:"12px", color:"#64748b", margin:0 }}>{v.type} · Rs {v.pricePerHour}/hr</p>
                  </div>
                  <span style={{ background:v.isActive?"#f0fdf4":"#fff1f2", color:v.isActive?"#15803d":"#be123c", fontSize:"11px", fontWeight:"700", padding:"3px 8px", borderRadius:"20px", flexShrink:0 }}>
                    {v.isActive?"Active":"Inactive"}
                  </span>
                </div>

                {/* Assigned drivers */}
                <div style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px" }}>Assigned Drivers</span>
                    <span style={{ fontSize:11, fontWeight:600, color:driverCount>0?"#F97316":"#f59e0b" }}>{driverCount>0?`${driverCount} driver${driverCount>1?"s":""}` :"None"}</span>
                  </div>
                  {driverCount===0 ? (
                    <p style={{ margin:0, fontSize:12, color:"#f59e0b", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:7, padding:"6px 10px" }}>No drivers — bookings skip driver step</p>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                      {assignedDrivers.map(d => {
                        const dId   = d._id||d.id||d;
                        const dName = d.name||"Driver";
                        return (
                          <div key={String(dId)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#f8fafc", borderRadius:7, padding:"6px 10px", border:"1px solid #e2e8f0" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                              <div style={{ width:22, height:22, borderRadius:"50%", background:"linear-gradient(135deg,#F97316,#EA580C)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:10, fontWeight:700, flexShrink:0 }}>
                                {dName[0].toUpperCase()}
                              </div>
                              <span style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{dName}</span>
                              {d.isAvailable!==undefined && (
                                <span style={{ fontSize:10, color:d.isAvailable?"#15803d":"#94a3b8", fontWeight:600 }}>· {d.isAvailable?"Online":"Offline"}</span>
                              )}
                              {d.driverRatePerHour > 0 && (
                                <span style={{ fontSize:10, color:"#F97316", fontWeight:600 }}>· Rs {d.driverRatePerHour}/hr</span>
                              )}
                            </div>
                            {isAdmin && (
                              <button onClick={() => removeDriver(v._id||v.id, dId, assignedDrivers)} title="Remove from vehicle"
                                style={{ fontSize:11, fontWeight:700, color:"#dc2626", background:"none", border:"none", cursor:"pointer", padding:"2px 6px", borderRadius:5, lineHeight:1 }}
                                onMouseEnter={e=>e.currentTarget.style.background="#fff1f2"}
                                onMouseLeave={e=>e.currentTarget.style.background="none"}>✕</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                    <div style={{ display:"flex", gap:"8px" }}>
                      <button onClick={() => setAssignTarget(v)}
                        style={{ flex:1, padding:"7px", border:"1px solid #FDBA74", borderRadius:"7px", fontSize:"12px", fontWeight:"600", color:"#F97316", background:"#FFF7ED", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}
                        onMouseEnter={e=>{e.currentTarget.style.background="#F97316";e.currentTarget.style.color="#fff";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="#FFF7ED";e.currentTarget.style.color="#F97316";}}>
                        <FaUserPlus style={{ fontSize:10 }} /> Assign Drivers
                      </button>
                      <button onClick={() => deleteV(v._id||v.id)}
                        style={{ flex:1, padding:"7px", border:"1px solid #fca5a5", borderRadius:"7px", fontSize:"12px", fontWeight:"600", color:"#dc2626", background:"#fff", cursor:"pointer" }}>
                        Delete
                      </button>
                    </div>
                    <div style={{ display:"flex", gap:"8px" }}>
                      <button onClick={() => setEditTarget(v)}
                        style={{ flex:1, padding:"7px", border:"1px solid #e2e8f0", borderRadius:"7px", fontSize:"12px", fontWeight:"600", color:"#334155", background:"#f8fafc", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"}
                        onMouseLeave={e=>e.currentTarget.style.background="#f8fafc"}>
                        Edit Details
                      </button>
                      <button onClick={() => setImageTarget(v)}
                        style={{ flex:1, padding:"7px", border:"1px solid #e2e8f0", borderRadius:"7px", fontSize:"12px", fontWeight:"600", color:"#334155", background:"#f8fafc", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"}
                        onMouseLeave={e=>e.currentTarget.style.background="#f8fafc"}>
                        <FaCamera style={{ fontSize:10 }} /> {v.imageUrl ? "Photo" : "Add Photo"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {assignTarget && <AssignDriversModal vehicle={assignTarget} token={token} onClose={() => setAssignTarget(null)} onSaved={fetchV} />}
      {imageTarget  && <UpdateImageModal   vehicle={imageTarget}  token={token} onClose={() => setImageTarget(null)}  onSaved={fetchV} />}
      {editTarget   && <EditVehicleModal   vehicle={editTarget}   token={token} onClose={() => setEditTarget(null)}   onSaved={fetchV} />}
    </div>
  );
}

// ─── Drivers Panel ─────────────────────────────────────────────────────────────
function DriversPanel({ isAdmin }) {
  const [drivers,     setDrivers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [editingRate, setEditingRate] = useState(null); // { id, value }
  const [savingRate,  setSavingRate]  = useState(null);
  const [filter,      setFilter]      = useState("all");
  const [deletingId,  setDeletingId]  = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchDrivers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(ENDPOINTS.DRIVERS, { headers:{ Authorization:`Bearer ${token}` } });
      setDrivers(Array.isArray(data)?data:[]);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleVerify = async (driverId, currentStatus) => {
    setVerifyingId(driverId);
    try {
      const { data } = await axios.patch(`${ENDPOINTS.DRIVERS}/${driverId}/verify`, { isDriverVerified:!currentStatus }, { headers:{ Authorization:`Bearer ${token}` } });
      setDrivers(prev => prev.map(d => (d._id===driverId||d.id===driverId) ? { ...d, isDriverVerified:data.driver.isDriverVerified } : d));
    } catch(e) { alert(e.response?.data?.message||"Failed."); }
    finally { setVerifyingId(null); }
  };

  const saveRate = async (driverId) => {
    if (!editingRate || editingRate.id !== driverId) return;
    const rate = parseInt(editingRate.value);
    if (isNaN(rate) || rate < 0) { alert("Enter a valid rate (Rs per hour)."); return; }
    setSavingRate(driverId);
    try {
      await axios.patch(`${ENDPOINTS.DRIVERS}/${driverId}/rate`, { driverRatePerHour: rate }, { headers:{ Authorization:`Bearer ${token}` } });
      setDrivers(prev => prev.map(d => (d._id===driverId||d.id===driverId) ? { ...d, driverRatePerHour:rate } : d));
      setEditingRate(null);
    } catch(e) { alert(e.response?.data?.message||"Failed to save rate."); }
    finally { setSavingRate(null); }
  };

  const deleteDriver = async (dId, name) => {
    if (!window.confirm(`Delete driver "${name}"? This cannot be undone.`)) return;
    setDeletingId(dId);
    try {
      await axios.delete(`${ENDPOINTS.DRIVERS}/${dId}`, { headers:{ Authorization:`Bearer ${token}` } });
      setDrivers(prev => prev.filter(d => (d._id||d.id) !== dId));
    } catch(e) { alert(e.response?.data?.message || "Failed to delete driver."); }
    finally { setDeletingId(null); }
  };

  const verified   = drivers.filter(d=>d.isDriverVerified).length;
  const unverified = drivers.filter(d=>!d.isDriverVerified).length;
  const filtered   = filter==="verified"?drivers.filter(d=>d.isDriverVerified):filter==="unverified"?drivers.filter(d=>!d.isDriverVerified):drivers;

  if (loading) return <div style={card}><Spinner /></div>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h2 style={{ fontSize:"17px", fontWeight:"700", color:"#0f172a", margin:0 }}>Driver Management</h2>
          <p style={{ fontSize:"13px", color:"#64748b", margin:"2px 0 0" }}>{drivers.length} registered drivers</p>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          {[{key:"all",label:`All (${drivers.length})`},{key:"unverified",label:`Pending (${unverified})`,alert:unverified>0},{key:"verified",label:`Verified (${verified})`}].map(f => {
            const active=filter===f.key;
            return <button key={f.key} onClick={()=>setFilter(f.key)} style={{ padding:"6px 14px", border:`1px solid ${active?"#F97316":f.alert?"#f59e0b":"#e2e8f0"}`, borderRadius:"20px", fontSize:"12px", fontWeight:"600", cursor:"pointer", background:active?"#F97316":f.alert?"#fffbeb":"#fff", color:active?"#fff":f.alert?"#b45309":"#64748b" }}>{f.label}</button>;
          })}
        </div>
      </div>

      {filtered.length===0 ? (
        <div style={card}><EmptyState icon={<FaUserTie />} label="No drivers found" hint="No drivers match this filter." /></div>
      ) : (
        <div style={{ ...card, overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["Driver","Email","Phone","Availability","Rate (Rs/hr)","Status",...(isAdmin?["Actions",""]:[])].map(h => (
                  <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:"11px", fontWeight:"700", color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.6px", borderBottom:"1px solid #f1f5f9" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const isV    = d.isDriverVerified===true;
                const dId    = d._id||d.id;
                const isLoad = verifyingId===dId;
                const isEditingThisRate = editingRate?.id===dId;
                return (
                  <tr key={dId||i} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                        <div style={{ width:"34px", height:"34px", borderRadius:"50%", background:"linear-gradient(135deg,#F97316,#EA580C)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"13px", fontWeight:"700", flexShrink:0 }}>
                          {(d.name||"D")[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize:"13px", fontWeight:"600", color:"#0f172a" }}>{d.name||"—"}</span>
                      </div>
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:"13px", color:"#334155" }}>{d.email||"—"}</td>
                    <td style={{ padding:"12px 16px", fontSize:"13px", color:"#334155" }}>{d.phone||"—"}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ fontSize:"11px", fontWeight:"700", padding:"3px 9px", borderRadius:"20px", background:d.isAvailable?"#f0fdf4":"#f1f5f9", color:d.isAvailable?"#15803d":"#64748b" }}>
                        {d.isAvailable?"Online":"Offline"}
                      </span>
                    </td>

                    {/* Driver rate — inline editable */}
                    <td style={{ padding:"10px 16px" }}>
                      {isAdmin ? (
                        isEditingThisRate ? (
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <input type="number" value={editingRate.value} onChange={e => setEditingRate({ id:dId, value:e.target.value })}
                              style={{ width:72, padding:"5px 8px", border:"1.5px solid #F97316", borderRadius:7, fontSize:12, outline:"none" }}
                              onKeyDown={e => { if(e.key==="Enter") saveRate(dId); if(e.key==="Escape") setEditingRate(null); }}
                              autoFocus />
                            <button onClick={() => saveRate(dId)} disabled={savingRate===dId}
                              style={{ padding:"5px 10px", border:"none", borderRadius:6, background:"#F97316", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                              {savingRate===dId?"…":"Save"}
                            </button>
                            <button onClick={() => setEditingRate(null)} style={{ padding:"5px 8px", border:"1px solid #e2e8f0", borderRadius:6, background:"#fff", color:"#64748b", fontSize:11, cursor:"pointer" }}>✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingRate({ id:dId, value: String(d.driverRatePerHour||200) })}
                            style={{ fontSize:13, fontWeight:600, color:d.driverRatePerHour?"#0f172a":"#94a3b8", background:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:6, textAlign:"left" }}
                            onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                            onMouseLeave={e=>e.currentTarget.style.background="none"}>
                            {d.driverRatePerHour ? `Rs ${d.driverRatePerHour}` : "Set rate"}
                          </button>
                        )
                      ) : (
                        <span style={{ fontSize:13, color:"#334155" }}>{d.driverRatePerHour ? `Rs ${d.driverRatePerHour}` : "—"}</span>
                      )}
                    </td>

                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ fontSize:"11px", fontWeight:"700", padding:"3px 9px", borderRadius:"20px", background:isV?"#f0fdf4":"#fffbeb", color:isV?"#15803d":"#b45309" }}>
                        {isV?"Verified":"Pending"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ padding:"10px 16px" }}>
                        <button disabled={isLoad} onClick={() => toggleVerify(dId, isV)}
                          style={{ display:"flex", alignItems:"center", gap:"6px", padding:"6px 14px", border:`1px solid ${isV?"#fca5a5":"#86efac"}`, borderRadius:"8px", fontSize:"12px", fontWeight:"700", color:isV?"#dc2626":"#15803d", background:isV?"#fff1f2":"#f0fdf4", cursor:isLoad?"not-allowed":"pointer", opacity:isLoad?0.6:1, whiteSpace:"nowrap" }}
                          onMouseEnter={e=>{if(!isLoad){e.currentTarget.style.background=isV?"#dc2626":"#15803d";e.currentTarget.style.color="#fff";}}}
                          onMouseLeave={e=>{if(!isLoad){e.currentTarget.style.background=isV?"#fff1f2":"#f0fdf4";e.currentTarget.style.color=isV?"#dc2626":"#15803d";}}}>
                          {isLoad?"…":isV?<><FaUserSlash/>Revoke</>:<><FaUserCheck/>Verify</>}
                        </button>
                      </td>
                    )}
                    {isAdmin && (
                      <td style={{ padding:"10px 16px" }}>
                        <button onClick={() => deleteDriver(dId, d.name)} disabled={deletingId===dId}
                          style={{ padding:"6px 12px", border:"1px solid #fca5a5", borderRadius:8, fontSize:12, fontWeight:700, color:"#dc2626", background:"#fef2f2", cursor:deletingId===dId?"not-allowed":"pointer", opacity:deletingId===dId?0.6:1 }}
                          onMouseEnter={e=>{ if(deletingId!==dId){e.currentTarget.style.background="#dc2626";e.currentTarget.style.color="#fff";} }}
                          onMouseLeave={e=>{ if(deletingId!==dId){e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#dc2626";} }}>
                          {deletingId===dId?"Deleting…":"Delete"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// ─── Fines Panel ──────────────────────────────────────────────────────────────
function FinesPanel() {
  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all"); // "all" | "paid" | "unpaid"
  const [search,    setSearch]    = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios.get(ENDPOINTS.BOOKINGS, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setBookings(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Only bookings that have a fine
  const fined = bookings.filter(b => b.fine && b.fine > 0);

  const filtered = fined.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (b.customer?.name || "").toLowerCase().includes(q)
      || (b.vehicle?.name  || "").toLowerCase().includes(q)
      || (b.customer?.phone|| "").includes(q);
    const matchFilter =
      filter === "all"   ? true :
      filter === "paid"  ? b.finePaid :
      !b.finePaid;
    return matchSearch && matchFilter;
  });

  const totalFined  = fined.length;
  const totalPaid   = fined.filter(b => b.finePaid).length;
  const totalUnpaid = fined.filter(b => !b.finePaid).length;
  const totalAmt    = fined.reduce((s, b) => s + (b.fine || 0), 0);
  const paidAmt     = fined.filter(b => b.finePaid).reduce((s, b) => s + (b.fine || 0), 0);

  if (loading) return <div style={card}><Spinner /></div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontSize:17, fontWeight:700, color:"#0f172a", margin:0 }}>Late Return Fines</h2>
          <p style={{ fontSize:13, color:"#64748b", margin:"2px 0 0" }}>{totalFined} booking{totalFined!==1?"s":""} with fines</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:7, background:"#fff", border:"1px solid #e2e8f0", borderRadius:9, padding:"7px 12px" }}>
          <FaSearch style={{ fontSize:11, color:"#94a3b8" }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customer or vehicle…"
            style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:"#0f172a", width:200 }} />
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:20 }}>
        {[
          { label:"Total fines",    value:totalFined,                                        sub:"bookings",    accent:"#f59e0b" },
          { label:"Unpaid",         value:totalUnpaid,                                       sub:"outstanding", accent:"#dc2626" },
          { label:"Paid",           value:totalPaid,                                         sub:"settled",     accent:"#22C55E" },
          { label:"Total fined",    value:`Rs ${totalAmt.toLocaleString()}`,                 sub:"all fines",   accent:"#F97316" },
          { label:"Collected",      value:`Rs ${paidAmt.toLocaleString()}`,                  sub:"paid fines",  accent:"#22C55E" },
          { label:"Outstanding",    value:`Rs ${(totalAmt-paidAmt).toLocaleString()}`,       sub:"unpaid",      accent:"#dc2626" },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding:"16px 18px" }}>
            <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</p>
            <p style={{ margin:0, fontSize:20, fontWeight:800, color:s.accent }}>{s.value}</p>
            <p style={{ margin:"2px 0 0", fontSize:12, color:"#94a3b8" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {[
          { key:"all",    label:`All (${totalFined})` },
          { key:"unpaid", label:`Unpaid (${totalUnpaid})`, alert: totalUnpaid > 0 },
          { key:"paid",   label:`Paid (${totalPaid})` },
        ].map(f => {
          const active = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding:"6px 16px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${active?"#F97316":f.alert?"#fca5a5":"#e2e8f0"}`, background:active?"#F97316":f.alert?"#fef2f2":"#fff", color:active?"#fff":f.alert?"#dc2626":"#64748b" }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={card}><EmptyState icon={<FaGavel />} label="No fines found" hint={search ? "Try a different search." : filter==="unpaid" ? "No outstanding fines." : "No fines recorded yet."} /></div>
      ) : (
        <div style={{ ...card, overflowX:"auto", padding:0 }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["Customer","Phone","Vehicle","Booked From","Booked Till","Days Exceeded","Fine Amount","Payment Status"].map(h => (
                  <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:"1px solid #f1f5f9", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const daysExceeded = b.returnedAt && b.endDate
                  ? Math.max(0, Math.ceil((new Date(b.returnedAt) - new Date(b.endDate)) / (1000*60*60*24)))
                  : "—";
                const lateHours = b.returnedAt && b.endDate
                  ? Math.max(0, Math.ceil((new Date(b.returnedAt) - new Date(b.endDate)) / (1000*60*60)))
                  : 0;

                return (
                  <tr key={b._id||i}
                    onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background=""}>

                    {/* Customer */}
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{b.customer?.name || "—"}</div>
                      <div style={{ fontSize:11, color:"#94a3b8" }}>{b.customer?.email || ""}</div>
                    </td>

                    {/* Phone */}
                    <td style={{ padding:"12px 16px", fontSize:13, color:"#334155" }}>
                      {b.customer?.phone || "—"}
                    </td>

                    {/* Vehicle */}
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{b.vehicle?.name || "—"}</div>
                      <div style={{ fontSize:11, color:"#94a3b8" }}>{b.vehicle?.plateNumber || ""}</div>
                    </td>

                    {/* Booked From */}
                    <td style={{ padding:"12px 16px", fontSize:12, color:"#64748b", whiteSpace:"nowrap" }}>
                      {b.startDate ? new Date(b.startDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "—"}
                    </td>

                    {/* Booked Till (scheduled end) */}
                    <td style={{ padding:"12px 16px", fontSize:12, color:"#64748b", whiteSpace:"nowrap" }}>
                      {b.endDate ? new Date(b.endDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "—"}
                    </td>

                    {/* Days / Hours exceeded */}
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ fontSize:12, fontWeight:700, color:"#dc2626" }}>
                        {lateHours > 0
                          ? lateHours <= 23
                            ? `${lateHours}h late`
                            : `${daysExceeded}d ${lateHours % 24}h late`
                          : "—"}
                      </span>
                    </td>

                    {/* Fine amount */}
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ fontSize:14, fontWeight:800, color:"#dc2626" }}>Rs {(b.fine||0).toLocaleString()}</div>
                      {b.vehicleFine > 0 && b.driverFine > 0 && (
                        <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>
                          Vehicle: Rs {b.vehicleFine.toLocaleString()} · Driver: Rs {b.driverFine.toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Payment status */}
                    <td style={{ padding:"12px 16px" }}>
                      {b.finePaid ? (
                        <div>
                          <span style={{ fontSize:11, fontWeight:700, background:"#f0fdf4", color:"#15803d", padding:"3px 10px", borderRadius:20, border:"1px solid #bbf7d0" }}>
                            ✓ Paid
                          </span>
                          {b.finePaidVia && <div style={{ fontSize:10, color:"#94a3b8", marginTop:3 }}>via {b.finePaidVia}</div>}
                          {b.finePaidAt  && <div style={{ fontSize:10, color:"#94a3b8" }}>{new Date(b.finePaidAt).toLocaleDateString("en-GB")}</div>}
                        </div>
                      ) : (
                        <span style={{ fontSize:11, fontWeight:700, background:"#fef2f2", color:"#dc2626", padding:"3px 10px", borderRadius:20, border:"1px solid #fca5a5" }}>
                          ✗ Unpaid
                        </span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Customers Panel ──────────────────────────────────────────────────────────
function CustomersPanel() {
  const [customers,setCustomers]=useState([]); const [loading,setLoading]=useState(true); const [search,setSearch]=useState(""); const [error,setError]=useState(null); const [deletingId,setDeletingId]=useState(null);
  const token=localStorage.getItem("token");

  const fetchCustomers = () => {
    axios.get(ENDPOINTS.CUSTOMERS,{headers:{Authorization:`Bearer ${token}`}}).then(r=>setCustomers(Array.isArray(r.data)?r.data:[])).catch(e=>setError(e.response?.data?.message||"Failed.")).finally(()=>setLoading(false));
  };
  useEffect(()=>{ fetchCustomers(); },[]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteCustomer = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await axios.delete(`${ENDPOINTS.CUSTOMERS}/${id}`, {headers:{Authorization:`Bearer ${token}`}});
      setCustomers(prev => prev.filter(c => (c._id||c.id) !== id));
    } catch(e) { alert(e.response?.data?.message || "Failed to delete customer."); }
    finally { setDeletingId(null); }
  };

  const filtered=customers.filter(c=>{const q=search.toLowerCase();return(c.name||"").toLowerCase().includes(q)||(c.email||"").toLowerCase().includes(q);});
  if(loading) return <div style={card}><Spinner /></div>;
  if(error)   return <div style={card}><EmptyState icon={<FaUsers />} label="Could not load customers" hint={error} /></div>;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
        <div><h2 style={{ fontSize:"17px", fontWeight:"700", color:"#0f172a", margin:0 }}>Customer Management</h2><p style={{ fontSize:"13px", color:"#64748b", margin:"2px 0 0" }}>{customers.length} registered customers</p></div>
        <div style={{ display:"flex", alignItems:"center", gap:"7px", background:"#fff", border:"1px solid #e2e8f0", borderRadius:"9px", padding:"7px 12px" }}>
          <FaSearch style={{ fontSize:"11px", color:"#94a3b8" }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers…" style={{ border:"none", outline:"none", background:"transparent", fontSize:"13px", color:"#0f172a", width:"180px" }} />
        </div>
      </div>
      {filtered.length===0 ? <div style={card}><EmptyState icon={<FaUsers />} label="No customers found" hint={search?"Try a different term.":"No customers yet."} /></div>
      : <div style={{ overflowX:"auto",...card }}><table style={{ width:"100%", borderCollapse:"collapse" }}><thead><tr style={{ background:"#f8fafc" }}>{["Name","Email","Phone","Joined",""].map(h=><th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:"11px", fontWeight:"700", color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.6px", borderBottom:"1px solid #f1f5f9" }}>{h}</th>)}</tr></thead><tbody>{filtered.map((c,i)=>{
        const id=c._id||c.id;
        return <tr key={id||i} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
          <td style={{ padding:"12px 16px" }}><div style={{ display:"flex", alignItems:"center", gap:"10px" }}><div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#10b981,#34d399)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"13px", fontWeight:"700" }}>{(c.name||"C")[0].toUpperCase()}</div><span style={{ fontSize:"13px", fontWeight:"600", color:"#0f172a" }}>{c.name||"—"}</span></div></td>
          <td style={{ padding:"12px 16px", fontSize:"13px", color:"#334155" }}>{c.email||"—"}</td>
          <td style={{ padding:"12px 16px", fontSize:"13px", color:"#334155" }}>{c.phone||"—"}</td>
          <td style={{ padding:"12px 16px", fontSize:"12px", color:"#64748b" }}>{c.createdAt?new Date(c.createdAt).toLocaleDateString():"—"}</td>
          <td style={{ padding:"12px 16px" }}>
            <button onClick={()=>deleteCustomer(id,c.name)} disabled={deletingId===id}
              style={{ padding:"5px 12px", borderRadius:7, fontSize:11, fontWeight:700, border:"1px solid #fca5a5", background:"#fef2f2", color:"#dc2626", cursor:deletingId===id?"not-allowed":"pointer", opacity:deletingId===id?0.6:1 }}
              onMouseEnter={e=>{ if(deletingId!==id){e.currentTarget.style.background="#dc2626";e.currentTarget.style.color="#fff";} }}
              onMouseLeave={e=>{ if(deletingId!==id){e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#dc2626";} }}>
              {deletingId===id?"Deleting…":"Delete"}
            </button>
          </td>
        </tr>;
      })}</tbody></table></div>}
    </div>
  );
}

function GenericPanel({ title, subtitle, icon, hint }) {
  return <div style={card}><PanelHeader title={title} subtitle={subtitle} /><EmptyState icon={icon} label={`No ${title.toLowerCase()} data yet`} hint={hint} /></div>;
}

// ─── Condition Reports Panel ──────────────────────────────────────────────────
function ConditionReportsPanel({ reports, fetchReports }) {
  const [filter, setFilter] = useState("all");
  const [toggling, setToggling] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [flagging, setFlagging] = useState(null);
  const token = localStorage.getItem("token");

  const filtered = reports.filter(r => {
    if (filter === "damage") return r.damageFlagged;
    return true;
  });

  const toggleReview = async (id, currentReviewed) => {
    setToggling(id);
    try {
      await axios.patch(`${BASE_URL}/api/condition-reports/${id}/review`, { reviewed: !currentReviewed }, { headers: { Authorization: `Bearer ${token}` } });
      fetchReports();
    } catch {
      alert("Failed to update status.");
    } finally {
      setToggling(null);
    }
  };

  const toggleFlag = async (id, currentVal) => {
    setFlagging(id);
    try {
      await axios.patch(`${BASE_URL}/api/condition-reports/${id}/review`, { damageFlagged: !currentVal, damageFlaggedBy: !currentVal ? "staff" : null }, { headers: { Authorization: `Bearer ${token}` } });
      fetchReports();
    } catch(e) { console.error(e); } finally { setFlagging(null); }
  };

  const damageCount = reports.filter(r => r.damageFlagged).length;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h2 style={{ fontSize:"17px", fontWeight:"700", color:"#0f172a", margin:0 }}>Condition Reports</h2>
          <p style={{ fontSize:"13px", color:"#64748b", margin:"2px 0 0" }}>{reports.length} reports submitted</p>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={() => setFilter("all")} style={{ padding:"6px 14px", border:`1px solid ${filter==="all"?"#F97316":"#e2e8f0"}`, borderRadius:"20px", fontSize:"12px", fontWeight:"600", cursor:"pointer", background:filter==="all"?"#F97316":"#fff", color:filter==="all"?"#fff":"#64748b" }}>All Reports ({reports.length})</button>
          <button onClick={() => setFilter("damage")} style={{ padding:"6px 14px", border:`1px solid ${filter==="damage"?"#F97316":damageCount>0?"#f59e0b":"#e2e8f0"}`, borderRadius:"20px", fontSize:"12px", fontWeight:"600", cursor:"pointer", background:filter==="damage"?"#F97316":damageCount>0?"#fffbeb":"#fff", color:filter==="damage"?"#fff":damageCount>0?"#b45309":"#64748b" }}>Damage Flagged ({damageCount})</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div style={card}><EmptyState icon={<FaExclamationTriangle />} label="No reports found" hint="No condition reports match this filter." /></div>
      ) : (
        <div style={{ display:"grid", gap:"16px" }}>
          {filtered.map(r => {
            const isReviewed = r.conditionReportReviewed;
            return (
              <div key={r._id} style={{ ...card, padding:"16px", background: isReviewed ? "#f8fafc" : "#fff", opacity: isReviewed ? 0.7 : 1, transition: "background 0.2s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div onClick={() => setExpandedId(expandedId === r._id ? null : r._id)} style={{ cursor: "pointer", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <h3 style={{ margin:"0 0 4px", fontSize:"14px", fontWeight:"700", color: isReviewed ? "#64748b" : "#0f172a" }}>
                        Booking #{r._id.slice(-5)} · {r.customer?.name || "Customer"} · {r.vehicle?.name || "Vehicle"}
                      </h3>
                      {(r.damageFlaggedBy === 'customer' || r.damageFlaggedBy === 'both') && (
                        <span style={{ background: "#fef2f2", color: "#dc2626", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, border: "1px solid #fca5a5" }}>
                          ⚠ Damage reported by customer
                        </span>
                      )}
                    </div>
                    <p style={{ margin:0, fontSize:"12px", color:"#94a3b8" }}>
                      Click to expand · Submitted: {r.preTrip?.submittedAt ? new Date(r.preTrip.submittedAt).toLocaleDateString() : (r.postTrip?.submittedAt ? new Date(r.postTrip.submittedAt).toLocaleDateString() : "—")}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button disabled={flagging===r._id} onClick={() => toggleFlag(r._id, r.damageFlagged)}
                      style={{ padding:"6px 14px", border:`1px solid ${r.damageFlagged?"#fca5a5":"#e2e8f0"}`, borderRadius:"8px", fontSize:"12px", fontWeight:"700", color:r.damageFlagged?"#dc2626":"#64748b", background:r.damageFlagged?"#fef2f2":"#fff", cursor:flagging===r._id?"not-allowed":"pointer" }}>
                      {flagging===r._id ? "..." : r.damageFlagged ? "Unflag" : "Flag Damage"}
                    </button>
                    <button disabled={toggling===r._id} onClick={() => toggleReview(r._id, isReviewed)}
                      style={{ padding:"6px 14px", border:`1px solid ${isReviewed?"#e2e8f0":"#86efac"}`, borderRadius:"8px", fontSize:"12px", fontWeight:"700", color:isReviewed?"#64748b":"#15803d", background:isReviewed?"#f1f5f9":"#f0fdf4", cursor:toggling===r._id?"not-allowed":"pointer" }}>
                      {toggling===r._id ? "..." : isReviewed ? "Mark Unreviewed" : "Mark Reviewed"}
                    </button>
                  </div>
                </div>
                
                <div style={{ marginTop:"16px", display:"flex", gap:"24px" }}>
                  <div>
                    <span style={{ fontSize:"11px", fontWeight:"700", color:"#94a3b8", textTransform:"uppercase" }}>Pickup Report:</span>
                    <span style={{ fontSize:"12px", fontWeight:"600", color:r.preTrip?.submittedAt ? "#0f172a" : "#cbd5e1", marginLeft:"8px" }}>
                      {r.preTrip?.submittedAt ? "Clean ✓" : "None"}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize:"11px", fontWeight:"700", color:"#94a3b8", textTransform:"uppercase" }}>Return Report:</span>
                    <span style={{ fontSize:"12px", fontWeight:"600", color:r.postTrip?.submittedAt ? "#0f172a" : "#cbd5e1", marginLeft:"8px" }}>
                      {r.postTrip?.submittedAt ? "Submitted ✓" : "None"}
                    </span>
                  </div>
                </div>

                {expandedId === r._id && (
                  <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    {/* Pre-Trip Photos */}
                    <div>
                      <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>PICKUP REPORT</h4>
                      {r.preTrip?.photos?.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {r.preTrip.photos.map((src, i) => (
                            <img key={i} src={src} alt="Pre-trip" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>Not submitted</p>
                      )}
                    </div>
                    {/* Post-Trip Photos */}
                    <div>
                      <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>RETURN REPORT</h4>
                      {r.postTrip?.photos?.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {r.postTrip.photos.map((src, i) => (
                            <img key={i} src={src} alt="Post-trip" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>Not submitted</p>
                      )}
                      
                      {r.damageNote && (
                        <div style={{ marginTop: 12, padding: "10px 12px", background: "#fef2f2", borderLeft: "3px solid #dc2626", borderRadius: "0 8px 8px 0" }}>
                          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase" }}>Customer Damage Note:</p>
                          <p style={{ margin: 0, fontSize: 13, color: "#7f1d1d" }}>"{r.damageNote}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Documents Panel ──────────────────────────────────────────────────────────
function DocumentsPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const token = localStorage.getItem("token");

  const fetchPending = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BASE_URL}/api/users/documents/pending`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(Array.isArray(data) ? data : []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReview = async (id, action) => {
    let reason = "";
    if (action === "reject") {
      reason = window.prompt("Enter rejection reason for this user:");
      if (reason === null) return; // cancelled
    }
    setProcessing(id);
    try {
      await axios.patch(`${BASE_URL}/api/users/${id}/documents/review`, { action, reason }, { headers: { Authorization: `Bearer ${token}` } });
      fetchPending();
    } catch(e) {
      alert(e.response?.data?.message || "Failed to submit review.");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div style={card}><Spinner /></div>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h2 style={{ fontSize:"17px", fontWeight:"700", color:"#0f172a", margin:0 }}>Document Verification</h2>
          <p style={{ fontSize:"13px", color:"#64748b", margin:"2px 0 0" }}>{users.length} users waiting for review</p>
        </div>
      </div>
      
      {users.length === 0 ? (
        <div style={card}><EmptyState icon={<FaFileAlt />} label="No pending documents" hint="All good! There are no users waiting for document verification." /></div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {users.map(u => (
            <div key={u._id} style={{ ...card, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{u.name}</h3>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>{u.email}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 12 }}>{u.role}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button disabled={processing === u._id} onClick={() => handleReview(u._id, 'reject')}
                    style={{ padding:"8px 16px", border:"1px solid #fca5a5", borderRadius:"8px", fontSize:"13px", fontWeight:"600", color:"#dc2626", background:"#fff", cursor:processing===u._id?"not-allowed":"pointer" }}>
                    {processing === u._id ? "..." : "Reject"}
                  </button>
                  <button disabled={processing === u._id} onClick={() => handleReview(u._id, 'approve')}
                    style={{ padding:"8px 16px", border:"none", borderRadius:"8px", fontSize:"13px", fontWeight:"600", color:"#fff", background:"linear-gradient(135deg,#10b981,#059669)", cursor:processing===u._id?"not-allowed":"pointer" }}>
                    {processing === u._id ? "..." : "Approve"}
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Citizenship (Front)</span>
                  {u.documents?.citizenshipFront ? (
                    <img src={u.documents.citizenshipFront} alt="Citizenship Front" style={{ width: "100%", aspectRatio: "1.6/1", objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  ) : <span style={{ fontSize: 12, color: "#cbd5e1" }}>Missing</span>}
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Citizenship (Back)</span>
                  {u.documents?.citizenshipBack ? (
                    <img src={u.documents.citizenshipBack} alt="Citizenship Back" style={{ width: "100%", aspectRatio: "1.6/1", objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  ) : <span style={{ fontSize: 12, color: "#cbd5e1" }}>Missing</span>}
                </div>
                {u.documents?.license && (
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Driving License</span>
                    {u.documents?.license ? (
                      <img src={u.documents.license} alt="License" style={{ width: "100%", aspectRatio: "1.6/1", objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                    ) : <span style={{ fontSize: 12, color: "#cbd5e1" }}>Missing</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Management() {
  const user    = (()=>{ try{return JSON.parse(localStorage.getItem("user"));}catch{return null;} })();
  const role    = user?.role||"STAFF";
  const roleCfg = ROLE_CONFIG[role]||ROLE_CONFIG.STAFF;
  const visibleTabs = ALL_TABS.filter(t=>t.roles.includes(role));

  const [activeTab,setActiveTab]=useState(visibleTabs[0]?.id||"overview");
  const [bookings, setBookings] =useState([]);
  const [vehicles, setVehicles] =useState([]);
  const [conditionReports, setConditionReports] = useState([]);
  const [pendingDocsCount, setPendingDocsCount] = useState(0);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const token=localStorage.getItem("token");

  const fetchPendingDocs=()=>{
    axios.get(`${BASE_URL}/api/users/documents/pending`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>setPendingDocsCount(Array.isArray(r.data)?r.data.length:0)).catch(()=>{});
  };

  const fetchConditionReports=()=>{
    axios.get(`${BASE_URL}/api/condition-reports`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>setConditionReports(Array.isArray(r.data)?r.data:[])).catch(()=>{});
  };

  const fetchBookings=()=>{
    axios.get(ENDPOINTS.BOOKINGS,{headers:{Authorization:`Bearer ${token}`}}).then(r=>setBookings(Array.isArray(r.data)?r.data:[])).catch(()=>{});
  };

  useEffect(()=>{
    fetchConditionReports();
    fetchPendingDocs();
    if(role==="STAFF")return;
    fetchBookings();
    axios.get(ENDPOINTS.VEHICLES,{headers:{Authorization:`Bearer ${token}`}}).then(r=>setVehicles(Array.isArray(r.data)?r.data:[])).catch(()=>{});
  },[]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCashPayment=async id=>{ try{await axios.patch(`${ENDPOINTS.BOOKINGS}/${id}/cash-payment`,{},{headers:{Authorization:`Bearer ${token}`}});fetchBookings();}catch(e){alert(e.response?.data?.message||"Failed.");} };
  const handleCancel=async id=>{ try{await axios.patch(`${ENDPOINTS.BOOKINGS}/${id}/admin-cancel`,{},{headers:{Authorization:`Bearer ${token}`}});fetchBookings();}catch(e){alert(e.response?.data?.message||"Failed.");} };
  const handleDeleteBooking=async id=>{
    if(!window.confirm("Permanently delete this booking? This cannot be undone.")) return;
    try{ await axios.delete(`${ENDPOINTS.BOOKINGS}/${id}`,{headers:{Authorization:`Bearer ${token}`}}); fetchBookings(); }
    catch(e){ alert(e.response?.data?.message||"Failed to delete booking."); }
  };

  const renderContent=()=>{
    switch(activeTab){
      case "overview":  return <OverviewPanel role={role} bookings={bookings} vehicles={vehicles} conditionReports={conditionReports} onCashPayment={handleCashPayment} onCancel={handleCancel} pendingDocsCount={pendingDocsCount} />;
      case "analytics": return <GenericPanel title="Analytics & Reports" subtitle="Revenue and usage stats" icon={<FaChartBar />} hint="Connect your payment gateway to see real analytics." />;
      case "bookings":  return <div style={card}><PanelHeader title="All Bookings" subtitle="Full booking management" action={<div style={{display:"flex",gap:8}}><button onClick={()=>setShowWalkInModal(true)} style={{ background:"#10b981", color:"#fff", border:"none", borderRadius:"10px", padding:"8px 16px", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>+ Walk-in Booking</button><button onClick={fetchBookings} style={{ background:"#F97316", color:"#fff", border:"none", borderRadius:"10px", padding:"8px 16px", fontSize:"13px", fontWeight:"600", cursor:"pointer" }}>Refresh</button></div>} />{bookings.length===0?<EmptyState icon={<FaClipboardList />} label="No bookings yet" hint="Bookings appear once customers reserve." />:<BookingsTable bookings={bookings} onCashPayment={handleCashPayment} onCancel={handleCancel} onDelete={handleDeleteBooking} showActions={true} />}</div>;
      case "vehicles":  return <VehiclesPanel isAdmin={role==="ADMIN"||role==="OWNER"} />;
      case "drivers":   return <DriversPanel  isAdmin={role==="ADMIN"||role==="OWNER"} />;
      case "fines":     return <FinesPanel />;
      case "customers": return <CustomersPanel />;
      case "documents": return <DocumentsPanel />;
      case "condition-reports": return <ConditionReportsPanel reports={conditionReports} fetchReports={fetchConditionReports} />;
      case "staff":     return <GenericPanel title="Staff Management" subtitle="Manage admin and staff accounts" icon={<FaShieldAlt />} hint="Staff accounts appear here." />;
      default: return null;
    }
  };

  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden", fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      {showWalkInModal && <WalkInBookingModal onClose={() => setShowWalkInModal(false)} onSuccess={() => {fetchBookings(); setShowWalkInModal(false);}} />}
      <aside style={{ width:"240px", minWidth:"240px", background:"#0f172a", display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0 }}>
        <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", background:"rgba(255,255,255,0.06)", borderRadius:"8px", padding:"8px 12px" }}>
            <div style={{ width:28, height:28, borderRadius:8, background:`linear-gradient(135deg,${roleCfg.color},${roleCfg.color}99)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:13, fontWeight:700, flexShrink:0 }}>
              {(user?.name||user?.email||"U")[0].toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize:"12px", fontWeight:"700", color:"#fff", margin:0 }}>{user?.name||user?.email||"User"}</p>
              <p style={{ fontSize:"10px", color:roleCfg.color, margin:0, fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.5px" }}>{roleCfg.label}</p>
            </div>
          </div>
        </div>
        <div style={{ padding:"14px 24px 8px", flexShrink:0 }}><span style={{ fontSize:"10px", fontWeight:"700", color:"#475569", textTransform:"uppercase", letterSpacing:"1px" }}>Main Menu</span></div>
        <nav style={{ padding:"0 12px", flex:1, overflowY:"auto" }}>
          {visibleTabs.map(item=>{
            const active=activeTab===item.id;
            return <button key={item.id} onClick={()=>setActiveTab(item.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"10px 14px", borderRadius:"10px", border:"none", cursor:"pointer", marginBottom:"2px", fontSize:"13px", fontWeight:active?"600":"500", color:active?"#fff":"#94a3b8", background:active?"linear-gradient(135deg,#F97316,#EA580C)":"transparent", transition:"all 0.15s", textAlign:"left" }} onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="#e2e8f0";}}} onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="#94a3b8";}}}>
              <span style={{ fontSize:"14px" }}>{item.icon}</span>{item.label}{active&&<span style={{ marginLeft:"auto", width:"6px", height:"6px", background:"rgba(255,255,255,0.6)", borderRadius:"50%" }} />}
            </button>;
          })}
        </nav>
      </aside>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <header style={{ background:"#fff", borderBottom:"1px solid #f1f5f9", padding:"0 28px", height:"56px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <h1 style={{ fontSize:"16px", fontWeight:"700", color:"#0f172a", margin:0 }}>{visibleTabs.find(t=>t.id===activeTab)?.label||"Dashboard"}</h1>
            <span style={{ background:roleCfg.bg, color:roleCfg.color, fontSize:"11px", fontWeight:"700", padding:"2px 8px", borderRadius:"20px" }}>{roleCfg.label}</span>
          </div>

        </header>
        <main style={{ flex:1, padding:"24px 28px", overflowY:"auto" }}>{renderContent()}</main>
      </div>
    </div>
  );
}
