import { useRecoilState } from "recoil";
import { Route, Routes, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Admin from "../pages/Admin";
import Customer from "../pages/Customer";
import Driver from "../pages/Driver";
import ErrorPage from "../pages/ErrorPage";
import CarDetails from "../pages/CarDetails";
import { userSelector } from "../store/atoms";

function AppRoutes() {
  const [userinfo] = useRecoilState(userSelector);

  return (
    <>
      {/* Show Navbar for non-logged in users or Customers */}
      {(!userinfo.role || userinfo.role === "CUSTOMER") && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Vehicle Detail,accessible by logged-in customers */}
        <Route path="/vehicle/:carId" element={<CarDetails />} />

        {/* Role-Based Routes */}
        {userinfo.role === "ADMIN" && (
          <Route path="/admin" element={<Admin />} />
        )}

        {userinfo.role === "CUSTOMER" && (
          <Route path="/customer" element={<Customer />} />
        )}

        {userinfo.role === "DRIVER" && (
          <Route path="/driver" element={<Driver />} />
        )}

        {/* Fallback / 404 */}
        <Route
          path="/"
          element={
            userinfo.role ? (
              <Navigate to={`/${userinfo.role.toLowerCase()}`} />
            ) : (
              <Login />
            )
          }
        />
        <Route path="*" element={<ErrorPage />} />
      </Routes>

      {(!userinfo.role || userinfo.role === "CUSTOMER") && <Footer />}
    </>
  );
}

export default AppRoutes;
