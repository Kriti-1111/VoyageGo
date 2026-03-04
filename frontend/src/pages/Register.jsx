import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

function Register() {
  const [form, setForm] = useState({
    role: "customer",
    name: "",
    email: "",
    password: "",
    phone: "",
    licenseNo: "",
    permanentAddress: "",
    temporaryAddress: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const res = await authService.register(form);
      
      // Store token and user data
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      
      // Redirect based on role
      switch (res.user.role) {
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'DRIVER':
          navigate('/driver');
          break;
        case 'CUSTOMER':
          navigate('/customer');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="brand">VoyageGo</h1>
        <h2>Create Account</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Role */}
          <div className="form-group">
            <label>Role</label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
            >
              <option value="customer">Customer</option>
              <option value="driver">Driver</option>
            </select>
          </div>

          {/* Name */}
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              required
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="example@email.com"
              required
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="98XXXXXXXX"
              pattern="^(97|98)\d{8}$"
              title="Enter valid Nepal mobile number (97/98XXXXXXXX)"
              required
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />
          </div>

          {/* License Number - Only for driver */}
          {form.role === "driver" && (
            <div className="form-group">
              <label>Driving License Number</label>
              <input
                type="text"
                placeholder="e.g. NP-01-2020-000123"
                required={form.role === "driver"}
                onChange={(e) =>
                  setForm({ ...form, licenseNo: e.target.value })
                }
              />
            </div>
          )}

          {/* Permanent Address */}
          <div className="form-group">
            <label>Permanent Address</label>
            <input
              type="text"
              placeholder="District"
              required
              onChange={(e) =>
                setForm({ ...form, permanentAddress: e.target.value })
              }
            />
          </div>

          {/* Temporary Address */}
          <div className="form-group">
            <label>Temporary Address</label>
            <input
              type="text"
              placeholder="Current living address"
              required
              onChange={(e) =>
                setForm({ ...form, temporaryAddress: e.target.value })
              }
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create strong password"
              required
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
          </div>

          <button type="submit" className="btn-primary">
            Create Account
          </button>
        </form>

        <p className="switch-link">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

export default Register;