import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import ExploreDrivers from "./pages/ExploreDrivers";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Management from "./pages/Management";
import Customer from "./pages/Customer";
import Driver from "./pages/Driver";
import CarDetails from "./pages/CarDetails";
import BookingPage from "./pages/BookingPage";
import ConditionReport from "./pages/ConditionReport";
import ReturnVehicle from "./pages/ReturnVehicle";
import Payment from "./pages/Payment";
import EsewaReturn from "./pages/EsewaReturn";
import ErrorPage from "./pages/ErrorPage";
import Layout from "./components/Layout";

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

function ProtectedRoute({ children, allowedRoles }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role))
    return <Navigate to={ROLE_HOME[user.role] || "/"} replace />;
  return children;
}

function GuestRoute({ children }) {
  const user = getUser();
  if (user) return <Navigate to={ROLE_HOME[user.role] || "/"} replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public ── */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/explore"
          element={
            <Layout>
              <Explore />
            </Layout>
          }
        />
        <Route
          path="/drivers"
          element={
            <Layout>
              <ExploreDrivers />
            </Layout>
          }
        />
        <Route
          path="/car/:carId"
          element={
            <Layout>
              <CarDetails />
            </Layout>
          }
        />

        {/* ── Booking flow ── */}
        <Route
          path="/booking/:carId"
          element={
            <ProtectedRoute
              allowedRoles={["CUSTOMER", "OWNER", "ADMIN", "STAFF", "DRIVER"]}
            >
              <Layout>
                <BookingPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ── Trip lifecycle — customer only ── */}
        <Route
          path="/booking/:bookingId/condition-report"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <Layout>
                <ConditionReport />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/:bookingId/return"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <Layout>
                <ReturnVehicle />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="/payment/esewa/return" element={<EsewaReturn />} />

        <Route
          path="/payment/:bookingId"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <Layout>
                <Payment />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ── Auth ── */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        {/* ── Dashboards ── */}
        <Route
          path="/management/*"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "STAFF"]}>
              <Layout>
                <Management />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/*"
          element={
            <ProtectedRoute allowedRoles={["DRIVER"]}>
              <Layout>
                <Driver />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/*"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <Layout>
                <Customer />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Router>
  );
}
