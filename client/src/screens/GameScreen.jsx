import React from "react";
import NarrativeBox from "../components/NarrativeBox";
import ChoicePanel from "../components/ChoicePanel";

export default function GameScreen({ story, choices, onChoose, onEnd }) {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>EchoWorld</h1>
      <NarrativeBox text={story} />
      <ChoicePanel choices={choices} onChoose={onChoose} />
      <button onClick={onEnd} style={{ marginTop: 20, padding: "10px 16px" }}>
        End Adventure
      </button>
    </main>
  );
}
