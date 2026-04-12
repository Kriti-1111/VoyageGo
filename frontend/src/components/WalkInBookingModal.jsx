import { useState, useEffect } from "react";
import axios from "axios";

// Helper for FileReader
function fileToBase64(file) {
  if (!file) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

const API = "http://localhost:5000";

// Re-using pricing calc from BookingPage to show live prices
function calcPrice(
  pricePerHour,
  startDate,
  endDate,
  driverRatePerHour = 0,
  mode = "hourly"
) {
  if (!startDate || !endDate) return null;
  const diffMs = new Date(endDate) - new Date(startDate);
  const rawHours = diffMs / (1000 * 60 * 60);
  const totalHours = Math.ceil(rawHours);
  const totalDays = Math.ceil(totalHours / 24);

  if (rawHours < 1 || rawHours > 30 * 24) return null;

  const dailyBase = pricePerHour * 24;
  const vehicleDailyRate = totalDays <= 6 ? dailyBase * 0.8 : dailyBase * 0.7;
  const driverDailyRate = driverRatePerHour * 8;

  let vehicleCost = 0;
  let driverCost = 0;

  if (mode === "hourly") {
    vehicleCost = Math.round(totalHours * pricePerHour);
    driverCost =
      driverRatePerHour > 0 ? Math.round(totalHours * driverRatePerHour) : 0;
  } else {
    vehicleCost = Math.round(totalDays * vehicleDailyRate);
    driverCost =
      driverRatePerHour > 0 ? Math.round(totalDays * driverDailyRate) : 0;
  }

  return { total: vehicleCost + driverCost };
}

export default function WalkInBookingModal({ onClose, onSuccess }) {
  const [vehicles, setVehicles] = useState([]);
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [vehicleId, setVehicleId] = useState("");
  
  const [mode, setMode] = useState("hourly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [requiresDriver, setRequiresDriver] = useState(true);
  const [pickupType, setPickupType] = useState("self");
  const [pickupLocation, setPickupLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [driverPool, setDriverPool] = useState([]);
  const [driverId, setDriverId] = useState("");

  // Documents State
  const [citizenshipFront, setCitizenshipFront] = useState(null);
  const [citizenshipBack, setCitizenshipBack] = useState(null);
  const [license, setLicense] = useState(null);
  const [docsVerified, setDocsVerified] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const token = localStorage.getItem("token");

    const fetchInitial = async () => {
      try {
        const vRes = await axios.get(`${API}/api/vehicles`, { headers: { Authorization: `Bearer ${token}` } });
        setVehicles(Array.isArray(vRes.data) ? vRes.data.filter(v => v.isActive) : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchInitial();

    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (vehicleId) {
      const v = vehicles.find(v => (v._id || v.id) === vehicleId);
      if (v && v.drivers) {
        setDriverPool(v.drivers);
      } else {
        setDriverPool([]);
      }
      setDriverId("");
    }
  }, [vehicleId, vehicles]);

  const selV = vehicles.find(v => (v._id || v.id) === vehicleId);
  const selD = driverPool.find(d => (d._id || d.id) === driverId);

  const priceEstimate = selV 
    ? calcPrice(selV.pricePerHour, startDate, endDate, selD?.driverRatePerHour || 0, mode) 
    : null;

  async function handleConfirm() {
    if (!name || !phone || !vehicleId || !startDate || !endDate) {
      alert("Please fill in required fields (Name, Phone, Vehicle, Dates).");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/api/bookings/walkin`, {
        name,
        phone,
        email,
        vehicleId,
        startDate,
        endDate,
        notes,
        mode,
        requiresDriver,
        pickupType,
        pickupLocation,
        paymentMethod,
        ...(driverId && { driverId })
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      const newBooking = res.data;

      // Ensure docs are uploaded if verified checkbox is checked
      if (docsVerified && citizenshipFront && citizenshipBack) {
        try {
          const frontB64 = await fileToBase64(citizenshipFront);
          const backB64 = await fileToBase64(citizenshipBack);
          const licenseB64 = await fileToBase64(license);
          
          await axios.post(`${API}/api/users/documents/walkin`, {
            customerId: newBooking.customerId || newBooking.customer,
            citizenshipFront: frontB64,
            citizenshipBack: backB64,
            license: licenseB64 || ""
          }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (docErr) {
          console.error("Document upload failed, but booking succeeded:", docErr);
          alert("Booking succeeded, but document verification failed.");
        }
      }

      if (paymentMethod === "eSewa") {
        // --- TEMPORARY FIX: using demoPay endpoint as requested to bypass eSewa sandbox outage ---
        await axios.post(`${API}/api/pay/demo`, {
          bookingId: newBooking._id || newBooking.id
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        alert("Walk-in booking created and confirmed with Demo Payment (simulating eSewa)! 🎉");
        onSuccess?.();
        onClose();

        /*
        // ORIGINAL ESEWA LOGIC
        const initRes = await axios.post(`${API}/api/pay/esewa/admin-initiate`, {
          bookingId: newBooking._id || newBooking.id
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        const { gateway_url, amount, tax_amount, total_amount, transaction_uuid, product_code, signature, success_url, failure_url } = initRes.data;
        
        const form = document.createElement("form");
        form.method = "POST";
        form.action = gateway_url;
        form.style.display = "none";
        
        const fields = { amount, tax_amount, total_amount, transaction_uuid, product_code, signature, success_url, failure_url };
        Object.keys(fields).forEach(key => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = fields[key];
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
        */
      } else {
        await axios.post(`${API}/api/pay/walkin/cash`, {
          bookingId: newBooking._id || newBooking.id
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        alert("Booking created and marked as paid!");
        onSuccess?.();
        onClose();
      }
    } catch(err) {
      alert(err.response?.data?.message || "Booking failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const lbl = { fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4, display: "block" };
  const inp = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.18)", overflow: "hidden", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
        
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Walk-in Booking</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, color: "#94a3b8", cursor: "pointer", lineHeight: 1 }}>&times;</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {loadingInitial ? (
            <p style={{ textAlign: "center", color: "#94a3b8" }}>Loading data...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Customer & Vehicle */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Customer Name*</label>
                  <input style={inp} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Phone Number*</label>
                  <input style={inp} placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Email (Optional)</label>
                  <input style={inp} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Select Vehicle*</label>
                  <select style={inp} value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map(v => (
                      <option key={v._id || v.id} value={v._id || v.id}>{v.name} (Rs {v.pricePerHour}/hr)</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Booking Mode & Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
                  <button onClick={() => setMode("hourly")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${mode === "hourly" ? "#F97316" : "#e2e8f0"}`, background: mode === "hourly" ? "#FFF7ED" : "#f8fafc", color: mode === "hourly" ? "#F97316" : "#64748b", fontWeight: 700, cursor: "pointer" }}>Hourly</button>
                  <button onClick={() => setMode("daily")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${mode === "daily" ? "#F97316" : "#e2e8f0"}`, background: mode === "daily" ? "#FFF7ED" : "#f8fafc", color: mode === "daily" ? "#F97316" : "#64748b", fontWeight: 700, cursor: "pointer" }}>Daily</button>
                </div>
                <div>
                  <label style={lbl}>Start Time</label>
                  <input type="datetime-local" style={inp} value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>End Time</label>
                  <input type="datetime-local" style={inp} value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>

              {/* Driver Options */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: requiresDriver ? 12 : 0, cursor: "pointer" }}>
                  <input type="checkbox" checked={requiresDriver} onChange={e => setRequiresDriver(e.target.checked)} style={{ transform: "scale(1.2)" }} />
                  Needs a Driver
                </label>
                
                {requiresDriver && (
                  <div>
                    <label style={lbl}>Prefer Specific Driver? (Optional)</label>
                    <select style={inp} value={driverId} onChange={e => setDriverId(e.target.value)}>
                      <option value="">-- Any Available / Auto-Assign --</option>
                      {driverPool.map(d => (
                        <option key={d._id || d.id} value={d._id || d.id}>{d.name} (Rs {d.driverRatePerHour}/hr)</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Pickup & Notes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Pickup Type</label>
                  <select style={inp} value={pickupType} onChange={e => setPickupType(e.target.value)}>
                    <option value="self">Self Pickup</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
                {pickupType === "delivery" && (
                  <div>
                    <label style={lbl}>Delivery Location</label>
                    <input style={inp} placeholder="Address" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} />
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Notes</label>
                  <textarea rows={2} style={{ ...inp, resize: "none" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." />
                </div>
                <div>
                  <label style={lbl}>Payment Method</label>
                  <select style={inp} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    <option value="Cash">Cash (Paid at Counter)</option>
                    <option value="eSewa">eSewa</option>
                  </select>
                </div>
              </div>

              {/* CUSTOMER DOCUMENTS (In-Person Verification) */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 13, color: "#0f172a", textTransform: "uppercase" }}>Customer Documents (In-Person)</h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={lbl}>Citizenship Front*</label>
                    <input type="file" accept="image/*" onChange={(e) => setCitizenshipFront(e.target.files[0])} style={{...inp, padding: "7px"}} />
                  </div>
                  <div>
                    <label style={lbl}>Citizenship Back*</label>
                    <input type="file" accept="image/*" onChange={(e) => setCitizenshipBack(e.target.files[0])} style={{...inp, padding: "7px"}} />
                  </div>
                </div>

                {!requiresDriver && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={lbl}>License (Self-Drive)</label>
                    <input type="file" accept="image/*" onChange={(e) => setLicense(e.target.files[0])} style={{...inp, padding: "7px"}} />
                  </div>
                )}

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: docsVerified ? "#15803d" : "#0f172a", cursor: "pointer" }}>
                  <input type="checkbox" checked={docsVerified} onChange={e => setDocsVerified(e.target.checked)} style={{ transform: "scale(1.2)" }} />
                  ☑ Documents verified in person by staff
                </label>
              </div>

              {/* Price Estimate */}
              {priceEstimate && priceEstimate.total !== null && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, color: "#15803d", fontWeight: 700, alignItems: "center" }}>
                  <span>Estimated Total:</span>
                  <span style={{ fontSize: 16 }}>Rs {priceEstimate.total.toLocaleString()}</span>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleConfirm} disabled={submitting || loadingInitial} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#F97316,#EA580C)", color: "#fff", fontWeight: 600, cursor: submitting || loadingInitial ? "not-allowed" : "pointer", opacity: submitting || loadingInitial ? 0.7 : 1 }}>
            {submitting ? "Booking..." : "Create Booking"}
          </button>
        </div>

      </div>
    </div>
  );
}
