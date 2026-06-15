import React, { useState, useEffect, useRef } from "react";

export default function NarrativeBox({ text, isLoading }) {
  const [displayedText, setDisplayedText] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setDisplayedText("");

    if (!text || isLoading) return;

    let index = 0;
    intervalRef.current = setInterval(() => {
      index++;
      setDisplayedText(text.substring(0, index));
      if (index >= text.length) {
        clearInterval(intervalRef.current);
      }
    }, 30);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, isLoading]);

  const isTyping = !isLoading && text && displayedText.length < text.length;

  const Divider = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        margin: "0.5rem 0",
      }}
    >
      <div style={{ flex: 1, height: "1px", backgroundColor: "#2d2d4a" }} />
      <span style={{ color: "#c9a84c", margin: "0 10px", fontSize: "0.8rem" }}>✦</span>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#2d2d4a" }} />
    </div>
  );

  const Skeleton = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        width: "100%",
        animation: "pulse 1.5s infinite ease-in-out",
      }}
    >
      <div style={{ width: "100%", height: "16px", backgroundColor: "#2d2d4a", borderRadius: "4px" }} />
      <div style={{ width: "85%", height: "16px", backgroundColor: "#2d2d4a", borderRadius: "4px" }} />
      <div style={{ width: "70%", height: "16px", backgroundColor: "#2d2d4a", borderRadius: "4px" }} />
    </div>
  );

  return (
    <section
      style={{
        backgroundColor: "#1a1a2e",
        border: "1px solid #2d2d4a",
        borderRadius: "12px",
        padding: "2rem",
        minHeight: "180px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes blink {
          from, to { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>
      
      <Divider />
      
      <div style={{ flex: 1, display: "flex", alignItems: "center", margin: "1rem 0", width: "100%" }}>
        {isLoading ? (
          <Skeleton />
        ) : (
          <p
            style={{
              color: "#e8e0d0",
              fontFamily: "Crimson Text, Georgia, serif",
              fontSize: "1.1rem",
              lineHeight: "1.8",
              margin: "0",
              textAlign: "left",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {displayedText}
            {isTyping && (
              <span
                style={{
                  animation: "blink 1s step-end infinite",
                  color: "#c9a84c",
                  marginLeft: "2px",
                  fontWeight: "bold",
                }}
              >
                |
              </span>
            )}
          </p>
        )}
      </div>

      <Divider />
    </section>
  );
}
