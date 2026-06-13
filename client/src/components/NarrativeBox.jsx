import React from "react";

export default function NarrativeBox({ text }) {
  return (
    <section
      style={{
        background: "#1a1a2e",
        border: "1px solid #2d2d4a",
        borderRadius: 8,
        padding: "1.5rem",
        minHeight: 140,
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#e8e0d0",
          fontFamily: "Crimson Text, Georgia, serif",
          lineHeight: 1.75,
        }}
      >
        {text || "The story will appear here."}
      </p>
    </section>
  );
}
