import React from "react";

export default function AboutUs() {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <style>
        {`
          @media (max-width: 768px) {
            .about-container {
              padding: 40px 20px !important;
            }
            .about-text {
              font-size: 15px !important;
            }
          }
        `}
      </style>
      <div
        className="about-container"
        style={{
          maxWidth: "800px",
          width: "100%",
          textAlign: "center",
          backgroundColor: "#fff",
        }}
      >
        <div style={{ fontSize: "40px", marginBottom: "16px" }}></div>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#F97316",
            margin: "0 0 16px 0",
          }}
        >
          About Us
        </h1>
        <div
          style={{
            height: "3px",
            width: "60px",
            backgroundColor: "#F97316",
            margin: "0 auto 20px auto",
            borderRadius: "2px",
          }}
        ></div>
        <p
          className="about-text"
          style={{
            fontSize: "16px",
            lineHeight: "1.7",
            color: "#334155",
            margin: "0",
            fontWeight: "400",
          }}
        >
          VoyageGo is a modern vehicle rental platform designed to make renting
          a car simple, transparent, and hassle-free. We connect customers with
          a curated fleet of quality vehicles from compact hatchbacks to luxury
          SUVs offering flexible hourly and daily rental options to suit every
          journey. Whether you prefer to drive yourself or travel with a
          professional driver, VoyageGo gives you the freedom to choose. Our
          platform is built with convenience at its core, featuring seamless
          online booking, secure eSewa payments, real-time booking updates, and
          a dedicated team of verified drivers ready to serve you across the
          Kathmandu Valley. At VoyageGo, we believe getting from point A to
          point B should be the least of your worries so sit back, and let us
          handle the ride.
        </p>
      </div>
    </div>
  );
}
