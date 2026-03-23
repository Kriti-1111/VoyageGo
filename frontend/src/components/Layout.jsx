import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }) {
  const { pathname } = useLocation();

  // Management dashboard: has its own internal sidebar but still gets the shared Navbar
  // Only suppress the Footer on management pages (it would look odd inside the sidebar layout)
  const isManagement = pathname.startsWith("/management");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: isManagement ? "100vh" : "auto",
        minHeight: isManagement ? "unset" : "100vh",
        width: "100%",
        background: "#f8fafc",
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        overflow: isManagement ? "hidden" : "unset",
      }}
    >
      <Navbar />
      <main
        style={{
          flex: 1,
          overflow: isManagement ? "hidden" : "unset",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </main>
      {!isManagement && <Footer />}
    </div>
  );
}
