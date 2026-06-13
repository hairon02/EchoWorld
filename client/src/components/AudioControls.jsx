import React from "react";
import { motion } from "framer-motion";

export default function AudioControls({ isMuted, toggleMute }) {
  return (
    <motion.button
      type="button"
      onClick={toggleMute}
      initial={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "fixed",
        right: "1rem",
        bottom: "1rem",
        zIndex: 50,
        backgroundColor: "#1a1a2e",
        border: "1px solid #2d2d4a",
        borderRadius: "9999px",
        padding: "0.75rem 1rem",
        color: "#c9a84c",
        fontSize: "1rem",
        cursor: "pointer",
        fontFamily: "Cinzel, Georgia, serif",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = "#c9a84c";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = "#2d2d4a";
      }}
      aria-label="Toggle sound"
      title="Toggle sound"
    >
      {isMuted ? "🔇" : "🔊"}
    </motion.button>
  );
}
