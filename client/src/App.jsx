import React, { useEffect, useState } from "react";
import StartScreen from "./screens/StartScreen";
import GameScreen from "./screens/GameScreen";
import EndScreen from "./screens/EndScreen";
import AudioControls from "./components/AudioControls";
import useAudio from "./hooks/useAudio";

const SCREEN_STATE = {
  START: "start",
  PLAYING: "playing",
  ENDED: "ended",
};

export default function App() {
  const [gameState, setGameState] = useState(SCREEN_STATE.START);
  const [playerName, setPlayerName] = useState("");

  const {
    isMuted,
    startAmbient,
    stopAmbient,
    toggleMute,
    playChoiceHover,
    playChoiceClick,
    playSceneTransition,
    playGameStart,
  } = useAudio();

  useEffect(() => {
    if (gameState === SCREEN_STATE.PLAYING) {
      startAmbient();
      playGameStart();
    }

    if (gameState === SCREEN_STATE.ENDED) {
      stopAmbient();
    }
  }, [gameState, playGameStart, startAmbient, stopAmbient]);

  const handleStart = (name) => {
    setPlayerName(name);
    setGameState(SCREEN_STATE.PLAYING);
  };

  const handleEnd = () => {
    setGameState(SCREEN_STATE.ENDED);
  };

  const handleRestart = () => {
    setPlayerName("");
    setGameState(SCREEN_STATE.START);
  };

  return (
    <div className="min-h-screen w-full bg-echo-black text-echo-text font-body-text">
      <AudioControls isMuted={isMuted} toggleMute={toggleMute} />

      {gameState === SCREEN_STATE.START && (
        <StartScreen onStart={handleStart} />
      )}
      {gameState === SCREEN_STATE.PLAYING && (
        <GameScreen
          playerName={playerName}
          onEnd={handleEnd}
          playChoiceHover={playChoiceHover}
          playChoiceClick={playChoiceClick}
          playSceneTransition={playSceneTransition}
        />
      )}
      {gameState === SCREEN_STATE.ENDED && (
        <EndScreen
          outcome="The adventure ends here. Well played."
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
