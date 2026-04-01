// RoleBasedRedirect.jsx
// Reads role from localStorage (uppercase) and redirects to the correct dashboard.
// Used on any route that needs to dynamically send a user "home" without
// knowing their role at the call site.

import { Navigate } from "react-router-dom";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

const RoleBasedRedirect = () => {
  const user = getUser();

  // Roles are stored as UPPERCASE strings — must match exactly.
  switch (user?.role) {
    case "OWNER":
    case "ADMIN":
    case "STAFF":
      return <Navigate to="/management" replace />;
    case "DRIVER":
      return <Navigate to="/driver" replace />;
    case "CUSTOMER":
      return <Navigate to="/customer" replace />;
    default:
      // Not logged in or unknown role → go to login
      return <Navigate to="/login" replace />;
  }
};

export default RoleBasedRedirect;
