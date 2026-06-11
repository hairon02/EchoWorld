import React from "react";

export default function StartScreen({ onStart }) {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>EchoWorld</h1>
      <p>
        Welcome to the real-time narrative adventure. Choose your first path and
        enter the story.
      </p>
      <button onClick={onStart} style={{ padding: "12px 20px", marginTop: 16 }}>
        Begin Adventure
      </button>
    </main>
  );
}
