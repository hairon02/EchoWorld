import React from "react";

export default function ChoicePanel({ choices = [], onChoose }) {
  return (
    <div style={{ marginTop: 20 }}>
      {choices.length === 0 ? (
        <p>No choices available yet.</p>
      ) : (
        choices.map((choice) => (
          <button
            key={choice}
            onClick={() => onChoose(choice)}
            style={{
              display: "block",
              width: "100%",
              padding: "12px 16px",
              margin: "8px 0",
            }}
          >
            {choice}
          </button>
        ))
      )}
    </div>
  );
}
