import React, { useState } from "react";
import { motion } from "framer-motion";
import ParticleBackground from "../components/ParticleBackground";

const containerStyle = {
  position: "relative",
  zIndex: 10,
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "1.5rem",
  width: "100%",
  padding: "0 1.5rem",
};

const cardStyle = {
  width: "100%",
  maxWidth: "520px",
  backgroundColor: "rgba(18, 18, 33, 0.92)",
  border: "1px solid #2d2d4a",
  borderRadius: "24px",
  padding: "2rem",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
}; 

const inputStyle = {
  width: "320px",
  backgroundColor: "#1a1a2e",
  border: "1px solid #2d2d4a",
  borderRadius: "8px",
  padding: "12px 20px",
  color: "#e8e0d0",
  fontSize: "1rem",
  outline: "none",
  fontFamily: "Crimson Text, Georgia, serif",
};

const buttonStyle = {
  width: "320px",
  backgroundColor: "transparent",
  border: "1px solid #c9a84c",
  borderRadius: "8px",
  padding: "12px 32px",
  color: "#c9a84c",
  fontSize: "1rem",
  cursor: "pointer",
  fontFamily: "Cinzel, Georgia, serif",
  letterSpacing: "2px",
  transition: "all 0.3s ease",
};

export default function StartScreen({ onStart }) {
  const [playerName, setPlayerName] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedName = playerName.trim();
    if (!trimmedName) return;
    onStart(trimmedName);
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#0a0a0f",
      }}
    >
      <ParticleBackground />
      <main style={containerStyle}>
        <div style={cardStyle}>
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{
              margin: 0,
              fontFamily: "Cinzel, Georgia, serif",
              fontSize: "3.2rem",
              letterSpacing: "0.2em",
              color: "#c9a84c",
              textTransform: "uppercase",
              textAlign: "center",
              textShadow: "0 0 20px rgba(201,168,76,0.3)",
            }}
          >
            ECHOWORLD
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            style={{
              margin: "1rem 0 0",
              color: "#8a8090",
              fontStyle: "italic",
              textAlign: "center",
              fontSize: "1rem",
            }}
          >
            Every choice reshapes the world
          </motion.p>

          <div
            style={{
              margin: "2rem auto",
              height: "1px",
              width: "100%",
              maxWidth: "200px",
              backgroundColor: "#2d2d4a",
            }}
          />

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <input
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Enter your name, wanderer..."
              style={inputStyle}
              type="text"
              autoComplete="name"
            />
            <button
              type="submit"
              disabled={!playerName.trim()}
              style={buttonStyle}
              onMouseOver={(event) => {
                event.currentTarget.style.backgroundColor = "#c9a84c";
                event.currentTarget.style.color = "#0a0a0f";
              }}
              onMouseOut={(event) => {
                event.currentTarget.style.backgroundColor = "transparent";
                event.currentTarget.style.color = "#c9a84c";
              }}
            >
              Begin Adventure
            </button>
          </motion.form>

          <p
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
              color: "#8a8090",
              fontSize: "0.95rem",
            }}
          >
            Your story adapts to every decision
          </p>
        </div>
      </main>
    </div>
  );
}
