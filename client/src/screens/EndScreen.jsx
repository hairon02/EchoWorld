import React from "react";

export default function EndScreen({ outcome }) {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Game Over</h1>
      <p>{outcome || "The story has reached its conclusion."}</p>
      <p>Thanks for playing EchoWorld.</p>
    </main>
  );
}
