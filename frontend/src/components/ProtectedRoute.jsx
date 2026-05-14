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

  // Not logged in,send to login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but wrong role → send to their own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to={ROLE_HOME[user.role] || "/"} replace />;

  return children;
};

export default ProtectedRoute;
