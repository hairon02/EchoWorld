import React from "react";

const panelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  alignItems: "center",
  maxWidth: "480px",
  width: "100%",
  margin: "0 auto",
};

const buttonStyle = {
  width: "100%",
  maxWidth: "100%",
  backgroundColor: "transparent",
  border: "1px solid #2d2d4a",
  borderRadius: "8px",
  padding: "12px 24px",
  color: "#e8e0d0",
  fontSize: "0.95rem",
  cursor: "pointer",
  fontFamily: "Crimson Text, Georgia, serif",
  transition: "all 0.3s ease",
  textAlign: "center",
};

export default function ChoicePanel({
  choices = [],
  onChoose,
  playChoiceHover,
  playChoiceClick,
}) {
  return (
    <div style={panelStyle}>
      {choices.length === 0 ? (
        <p style={{ color: "#8a8090" }}>No choices available yet.</p>
      ) : (
        choices.map((choice, index) => {
          const text = typeof choice === 'string' ? choice : choice.text;
          const key = typeof choice === 'string' ? `${choice}-${index}` : choice.id;
          
          return (
            <button
              key={key}
              onClick={() => {
                if (playChoiceClick) playChoiceClick();
                onChoose(choice);
              }}
              style={buttonStyle}
              onMouseEnter={() => {
                if (playChoiceHover) playChoiceHover();
              }}
              onMouseOver={(event) => {
                event.currentTarget.style.borderColor = "#c9a84c";
                event.currentTarget.style.color = "#c9a84c";
              }}
              onMouseOut={(event) => {
                event.currentTarget.style.borderColor = "#2d2d4a";
                event.currentTarget.style.color = "#e8e0d0";
              }}
            >
              {text}
            </button>
          );
        })
      )}
    </div>
  );
}
