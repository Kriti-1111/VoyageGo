// ProtectedRoute.jsx
// Single source of truth: reads from localStorage, matches App.jsx pattern.
// The AuthContext-based version has been removed — the whole app reads from
// localStorage directly (see Navbar.jsx, CarDetails.jsx, Explore.jsx).
// If you migrate to AuthContext later, update here and App.jsx together.

import { Navigate } from "react-router-dom";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

const ROLE_HOME = {
  OWNER: "/management",
  ADMIN: "/management",
  STAFF: "/management",
  DRIVER: "/driver",
  CUSTOMER: "/customer",
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = getUser();

  // Not logged in → send to login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but wrong role → send to their own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to={ROLE_HOME[user.role] || "/"} replace />;

  return children;
};

export default ProtectedRoute;
