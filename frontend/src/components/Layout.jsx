import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const FULL_SCREEN_ROUTES = ["/management"];

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const isFullScreen = FULL_SCREEN_ROUTES.some(r => pathname.startsWith(r));

  if (isFullScreen) {
    // NO position:fixed — just a normal full-height div
    // This lets React properly unmount it when navigating away
    return (
      <div style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
      }}>
        {children}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      width: "100%",
      background: "#f8fafc",
      fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
    }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
