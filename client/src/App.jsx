import React, { useState } from "react";
import StartScreen from "./screens/StartScreen";
import GameScreen from "./screens/GameScreen";
import EndScreen from "./screens/EndScreen";

const SCREENS = {
  START: "start",
  GAME: "game",
  END: "end",
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.START);
  const [story, setStory] = useState("");
  const [choices, setChoices] = useState([]);
  const [outcome, setOutcome] = useState(null);

  const handleStart = () => {
    setScreen(SCREENS.GAME);
    setStory("The story begins as your party enters the forgotten city...");
    setChoices(["Explore the plaza", "Follow the river", "Rest at the inn"]);
    setOutcome(null);
  };

  const handleChoice = (choice) => {
    setStory(`You chose: ${choice}. The world shifts around you.`);
    setChoices(["Press forward", "Search for clues", "Call for help"]);
    if (choice === "Rest at the inn") {
      setOutcome("You found shelter and prepared for the next chapter.");
    }
  };

  const handleEnd = () => {
    setOutcome("The adventure ends here. Well played.");
    setScreen(SCREENS.END);
  };

  return (
    <div>
      {screen === SCREENS.START && <StartScreen onStart={handleStart} />}
      {screen === SCREENS.GAME && (
        <GameScreen
          story={story}
          choices={choices}
          onChoose={handleChoice}
          onEnd={handleEnd}
        />
      )}
      {screen === SCREENS.END && <EndScreen outcome={outcome} />}
    </div>
  );
}
