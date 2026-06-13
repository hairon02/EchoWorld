import React from "react";
import ParticleBackground from "../components/ParticleBackground";

const pageStyle = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  backgroundColor: "#0a0a0f",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
};

const contentStyle = {
  position: "relative",
  zIndex: 10,
  width: "100%",
  maxWidth: "720px",
  backgroundColor: "rgba(18, 18, 33, 0.92)",
  border: "1px solid #2d2d4a",
  borderRadius: "20px",
  padding: "2rem",
  boxShadow: "0 24px 70px rgba(0, 0, 0, 0.4)",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  alignItems: "center",
};

const titleStyle = {
  margin: 0,
  fontFamily: "Cinzel, Georgia, serif",
  fontSize: "2.25rem",
  color: "#c9a84c",
};

const bodyStyle = {
  margin: 0,
  color: "#e8e0d0",
  fontFamily: "Crimson Text, Georgia, serif",
  lineHeight: 1.8,
  fontSize: "1rem",
};

export default function EndScreen({ outcome, onRestart }) {
  return (
    <div style={pageStyle}>
      <ParticleBackground />
      <section style={contentStyle}>
        <h1 style={titleStyle}>Journey Complete</h1>
        <p style={bodyStyle}>
          {outcome || "The story has reached its conclusion."}
        </p>
        <p style={bodyStyle}>Thanks for playing EchoWorld.</p>

        <button
          type="button"
          onClick={onRestart}
          style={{
            backgroundColor: "transparent",
            border: "1px solid #c9a84c",
            borderRadius: 8,
            padding: "12px 32px",
            color: "#c9a84c",
            fontSize: "1rem",
            cursor: "pointer",
            fontFamily: "Cinzel, Georgia, serif",
            letterSpacing: "2px",
            transition: "all 0.3s ease",
            marginTop: "1rem",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = "#c9a84c";
            event.currentTarget.style.color = "#0a0a0f";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = "transparent";
            event.currentTarget.style.color = "#c9a84c";
          }}
        >
          Begin a New Adventure
        </button>
      </section>
    </div>
  );
}
