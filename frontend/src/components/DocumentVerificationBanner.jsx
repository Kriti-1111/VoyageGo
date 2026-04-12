import { useState } from "react";
import axios from "axios";

// Helper for FileReader
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

export default function DocumentVerificationBanner({ user, onUploadSuccess }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [citizenshipFront, setCitizenshipFront] = useState(null);
  const [citizenshipBack, setCitizenshipBack] = useState(null);
  const [license, setLicense] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const status = user?.documents?.status || "NotSubmitted";

  if (status === "Verified") {
    return null; // Don't show anything if verified
  }

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!citizenshipFront || !citizenshipBack) {
      setError("Please select both Front and Back of Citizenship.");
      return;
    }
    if (user?.role === "DRIVER" && !license) {
      setError("Please provide a valid Driver's License.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const frontB64 = await fileToBase64(citizenshipFront);
      const backB64 = await fileToBase64(citizenshipBack);
      const licenseB64 = license ? await fileToBase64(license) : "";

      const API = "http://localhost:5000";
      const token = localStorage.getItem("token");

      await axios.post(
        `${API}/api/users/documents`,
        {
          citizenshipFront: frontB64,
          citizenshipBack: backB64,
          license: licenseB64,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Successfully uploaded
      setIsModalOpen(false);
      onUploadSuccess(); // triggers parent to refetch user data
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload documents.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Banner */}
      <div
        style={{
          background: status === "Rejected" ? "#fef2f2" : "#fffbeb",
          border: `1px solid ${status === "Rejected" ? "#fecaca" : "#fde68a"}`,
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: status === "Rejected" ? "#b91c1c" : "#b45309" }}>
            {status === "NotSubmitted" && "Please verify your identity to unlock full booking access"}
            {status === "PendingReview" && "Your documents are under review. We'll notify you shortly."}
            {status === "Rejected" && `Your documents were rejected: ${user?.documents?.rejectionReason || "Blurry image"}`}
          </p>
          {(status === "NotSubmitted" || status === "Rejected") && (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: status === "Rejected" ? "#ef4444" : "#d97706" }}>
              Quick verification process to ensure a smooth booking experience.
            </p>
          )}
        </div>

        {(status === "NotSubmitted" || status === "Rejected") && (
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: status === "Rejected" ? "#ef4444" : "#f59e0b",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {status === "Rejected" ? "Resubmit Documents" : "Upload Documents"}
          </button>
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => !submitting && setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "24px",
              width: "100%",
              maxWidth: 400,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ margin: "0 0 16px", fontSize: 18, color: "#0f172a" }}>Upload Documents</h2>
            
            <form onSubmit={handleUpload}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Citizenship Front*
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setCitizenshipFront(e.target.files[0])} 
                  required
                  style={{ fontSize: 13, color: "#64748b" }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Citizenship Back*
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setCitizenshipBack(e.target.files[0])} 
                  required
                  style={{ fontSize: 13, color: "#64748b" }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  {user?.role === "DRIVER" ? "Driver's License*" : "License (Optional unless Self-Drive)"}
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setLicense(e.target.files[0])} 
                  required={user?.role === "DRIVER"}
                  style={{ fontSize: 13, color: "#64748b" }}
                />
              </div>

              {error && (
                <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{error}</div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer"
                  }}
                >
                  {submitting ? "Uploading..." : "Submit for Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
