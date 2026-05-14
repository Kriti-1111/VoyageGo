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
      return <Navigate to="/login" replace />;
  }
};

export default RoleBasedRedirect;
