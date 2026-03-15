import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif" }}>

      {/* ── Hero ── */}
      <section style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 55%,#3730a3 100%)", padding:"100px 32px 120px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-100px", right:"-100px", width:"400px", height:"400px", borderRadius:"50%", background:"rgba(99,102,241,0.12)" }} />
        <div style={{ position:"absolute", bottom:"-80px", left:"-60px", width:"300px", height:"300px", borderRadius:"50%", background:"rgba(139,92,246,0.1)" }} />

        <div style={{ maxWidth:"700px", margin:"0 auto", position:"relative" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)", borderRadius:"20px", padding:"6px 16px", marginBottom:"24px" }}>
            <span style={{ width:"6px", height:"6px", background:"#a5b4fc", borderRadius:"50%" }} />
            <span style={{ fontSize:"13px", color:"#a5b4fc", fontWeight:"600" }}>Available across Kathmandu</span>
          </div>

          <h1 style={{ fontSize:"clamp(36px,6vw,60px)", fontWeight:"900", color:"#fff", margin:"0 0 16px", lineHeight:1.1, letterSpacing:"-1px" }}>
            Travel Nepal<br />
            <span style={{ background:"linear-gradient(135deg,#a5b4fc,#c4b5fd)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              Your Way
            </span>
          </h1>

          <p style={{ fontSize:"18px", color:"#94a3b8", margin:"0 0 40px", lineHeight:1.7 }}>
            Book vehicles, hire professional drivers, and explore Nepal with complete confidence. Simple. Fast. Reliable.
          </p>

          <div style={{ display:"flex", gap:"12px", justifyContent:"center", flexWrap:"wrap" }}>
            {/* Explore button — same for everyone, logged in or not */}
            <button onClick={() => navigate("/explore")}
              style={{ padding:"14px 32px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontSize:"16px", fontWeight:"700", cursor:"pointer", transition:"transform 0.15s, box-shadow 0.15s", boxShadow:"0 8px 24px rgba(99,102,241,0.4)" }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(99,102,241,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 8px 24px rgba(99,102,241,0.4)"; }}>
              Explore →
            </button>

            {/* Show register only to guests */}
            {!user && (
              <button onClick={() => navigate("/register")}
                style={{ padding:"14px 32px", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.06)", color:"#e2e8f0", fontSize:"16px", fontWeight:"600", cursor:"pointer", backdropFilter:"blur(8px)", transition:"all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.12)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.06)"}>
                Create Account
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ background:"#fff", borderBottom:"1px solid #f1f5f9", padding:"32px" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"32px", textAlign:"center" }}>
          {[
            { value:"500+", label:"Happy Customers" },
            { value:"50+",  label:"Verified Drivers" },
            { value:"30+",  label:"Vehicles" },
            { value:"24/7", label:"Support" },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontSize:"32px", fontWeight:"800", color:"#6366f1", margin:0, letterSpacing:"-1px" }}>{s.value}</p>
              <p style={{ fontSize:"14px", color:"#64748b", margin:"4px 0 0", fontWeight:"500" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding:"80px 32px", background:"#f8fafc" }}>
        <div style={{ maxWidth:"1000px", margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:"56px" }}>
            <h2 style={{ fontSize:"32px", fontWeight:"800", color:"#0f172a", margin:"0 0 12px", letterSpacing:"-0.5px" }}>Why choose VoyageGo?</h2>
            <p style={{ fontSize:"16px", color:"#64748b", margin:0 }}>Everything you need for stress-free travel</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"20px" }}>
            {[
              { icon:"🚗", title:"Wide Vehicle Selection",  desc:"From sedans to vans — pick the vehicle that fits your journey and group size.",            color:"#eef2ff" },
              { icon:"🧑‍✈️", title:"Professional Drivers",   desc:"All drivers are verified, experienced, and trained to deliver safe trips.",              color:"#f0fdf4" },
              { icon:"📱", title:"Easy Booking",            desc:"Book in minutes. Track your ride, manage bookings, and cancel anytime.",                   color:"#fffbeb" },
              { icon:"🔒", title:"Safe & Secure",           desc:"Your payments and personal data are protected at every step of your journey.",             color:"#fff1f2" },
              { icon:"📍", title:"Real-time Tracking",      desc:"Know where your driver is at all times with live location updates.",                       color:"#ecfeff" },
              { icon:"⭐", title:"Rated by Thousands",      desc:"Join our growing community of happy travellers across Nepal.",                             color:"#fdf4ff" },
            ].map(f => (
              <div key={f.title}
                style={{ background:"#fff", borderRadius:"16px", padding:"24px", border:"1px solid #f1f5f9", transition:"transform 0.2s, box-shadow 0.2s", cursor:"default" }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>
                <div style={{ width:"48px", height:"48px", background:f.color, borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", marginBottom:"16px" }}>{f.icon}</div>
                <h3 style={{ fontSize:"15px", fontWeight:"700", color:"#0f172a", margin:"0 0 8px" }}>{f.title}</h3>
                <p style={{ fontSize:"13px", color:"#64748b", margin:0, lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding:"80px 32px", background:"#fff" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto", textAlign:"center" }}>
          <h2 style={{ fontSize:"32px", fontWeight:"800", color:"#0f172a", margin:"0 0 12px", letterSpacing:"-0.5px" }}>How it works</h2>
          <p style={{ fontSize:"16px", color:"#64748b", margin:"0 0 56px" }}>Get on the road in 3 simple steps</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"32px" }}>
            {[
              { step:"01", title:"Create an account", desc:"Sign up free in under a minute as a customer or driver.", icon:"👤" },
              { step:"02", title:"Browse & book",      desc:"Pick your vehicle, set your dates, and confirm your booking.", icon:"🔍" },
              { step:"03", title:"Enjoy your ride",    desc:"Your driver picks you up and you travel in comfort.", icon:"🛣️" },
            ].map(s => (
              <div key={s.step} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"14px" }}>
                <div style={{ width:"60px", height:"60px", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:"16px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", boxShadow:"0 8px 24px rgba(99,102,241,0.3)" }}>{s.icon}</div>
                <span style={{ fontSize:"11px", fontWeight:"800", color:"#6366f1", letterSpacing:"1.5px" }}>STEP {s.step}</span>
                <h3 style={{ fontSize:"16px", fontWeight:"700", color:"#0f172a", margin:0 }}>{s.title}</h3>
                <p style={{ fontSize:"13px", color:"#64748b", margin:0, lineHeight:1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner — guests only ── */}
      {!user && (
        <section style={{ background:"linear-gradient(135deg,#0f172a,#1e1b4b)", padding:"80px 32px", textAlign:"center" }}>
          <div style={{ maxWidth:"560px", margin:"0 auto" }}>
            <h2 style={{ fontSize:"32px", fontWeight:"800", color:"#fff", margin:"0 0 12px", letterSpacing:"-0.5px" }}>Ready to get started?</h2>
            <p style={{ fontSize:"16px", color:"#94a3b8", margin:"0 0 32px" }}>Join thousands of travellers already using VoyageGo</p>
            <div style={{ display:"flex", gap:"12px", justifyContent:"center" }}>
              <button onClick={() => navigate("/register")}
                style={{ padding:"13px 28px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontSize:"15px", fontWeight:"700", cursor:"pointer" }}>
                Sign Up Free
              </button>
              <button onClick={() => navigate("/login")}
                style={{ padding:"13px 28px", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.2)", background:"transparent", color:"#e2e8f0", fontSize:"15px", fontWeight:"600", cursor:"pointer" }}>
                Sign In
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
