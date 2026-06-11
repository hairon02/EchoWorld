import React from "react";

export default function NarrativeBox({ text }) {
  return (
    <section
      style={{
        background: "#f1f1f1",
        padding: 18,
        borderRadius: 12,
        minHeight: 140,
      }}
    >
      <p>{text || "The story will appear here."}</p>
    </section>
  );
}
