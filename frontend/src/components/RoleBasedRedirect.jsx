// RoleBasedRedirect.jsx 
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRedirect = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" />;
    case 'driver':
      return <Navigate to="/driver/dashboard" />;
    case 'customer':
      return <Navigate to="/customer/dashboard" />;
    default:
      return <Navigate to="/login" />;
  }
};

export default RoleBasedRedirect;