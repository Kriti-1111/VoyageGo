import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home       from "./pages/Home";
import Explore    from "./pages/Explore";
import Login      from "./pages/Login";
import Register   from "./pages/Register";
import Management from "./pages/Management";
import Customer   from "./pages/Customer";
import Driver     from "./pages/Driver";
import ErrorPage  from "./pages/ErrorPage";
import Layout     from "./components/Layout";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}

const ROLE_HOME = {
  OWNER:    "/management",
  ADMIN:    "/management",
  STAFF:    "/management",
  DRIVER:   "/driver",
  CUSTOMER: "/customer",
};

// Requires login + correct role — used ONLY for dashboard routes
function ProtectedRoute({ children, allowedRoles }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role))
    return <Navigate to={ROLE_HOME[user.role] || "/"} replace />;
  return children;
}

// Sends logged-in users away from login/register to their dashboard
function GuestRoute({ children }) {
  const user = getUser();
  if (user) return <Navigate to={ROLE_HOME[user.role] || "/"} replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>

        {/* ── Fully public — NO restrictions, any role or guest ── */}
        <Route path="/"        element={<Layout><Home /></Layout>} />
        <Route path="/explore" element={<Layout><Explore /></Layout>} />

        {/* ── Auth pages — redirect if already logged in ── */}
        <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

        {/* ── Dashboards — protected by role ── */}
        <Route path="/management" element={
          <ProtectedRoute allowedRoles={["OWNER","ADMIN","STAFF"]}>
            <Layout><Management /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/driver" element={
          <ProtectedRoute allowedRoles={["DRIVER"]}>
            <Layout><Driver /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/customer" element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <Layout><Customer /></Layout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Router>
  );
}
