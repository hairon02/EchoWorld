import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ParticleBackground from "../components/ParticleBackground";
import NarrativeBox from "../components/NarrativeBox";
import ChoicePanel from "../components/ChoicePanel";
import useSocket from "../hooks/useSocket";
export default function GameScreen({
  socket,
  playerName = "Wanderer",
  onEnd,
  playChoiceHover,
  playChoiceClick,
  playSceneTransition,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState([]);
  const [story, setStory] = useState("Cargando historia...");
  const [choices, setChoices] = useState([]);
  const [sceneIndex, setSceneIndex] = useState(1);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!socket || !onEnd) return undefined;

    const handleServerEnd = () => {
      onEnd();
    };

    const handleNewScene = (payload) => {
      console.log("[GameScreen] received game:scene payload:", payload);
      if (playSceneTransition) playSceneTransition();
      if (payload?.sessionId) setCurrentSessionId(payload.sessionId);
      if (payload?.scene?.narrativeText) setStory(payload.scene.narrativeText);
      if (payload?.scene?.choices) {
        setChoices(payload.scene.choices);
        if (payload.scene.choices.length === 0) {
          console.log("[GameScreen] No choices available. Auto-emitting game:end.");
          socket.emit("game:end", { sessionId: payload.sessionId });
        }
      }
      
      if (payload?.decisions) {
        const mappedHistory = payload.decisions.map((dec, idx) => ({
          scene: idx + 1,
          choice: dec.choiceText,
        }));
        setHistory(mappedHistory);
        setSceneIndex(payload.decisions.length + 1);
      } else {
        setHistory([]);
        setSceneIndex(1);
      }
    };

    const handleServerSummary = (data) => {
      console.log("[GameScreen] received game:summary:", data);
      setSummary(data);
    };

    socket.on("game:end", handleServerEnd);
    socket.on("game:scene", handleNewScene);
    socket.on("game:summary", handleServerSummary);

    return () => {
      socket.off("game:end", handleServerEnd);
      socket.off("game:scene", handleNewScene);
      socket.off("game:summary", handleServerSummary);
    };
  }, [socket, onEnd, playSceneTransition]);

  const sceneNumber = history.length + 1;

  const handleChoice = (choice) => {
    if (playChoiceClick) playChoiceClick();

    const choiceId = typeof choice === 'string' ? choice : choice.id;

    if (socket && currentSessionId && choiceId) {
      console.log("[GameScreen] Emitting game:choice:", { sessionId: currentSessionId, choiceId });
      socket.emit("game:choice", { sessionId: currentSessionId, choiceId });
      
      // Muestra un estado de carga mientras se genera el siguiente fragmento de historia
      setStory("Cargando historia...");
      setChoices([]);
    } else {
      console.warn("[GameScreen] Cannot emit choice, missing socket, sessionId or choiceId", {
        hasSocket: !!socket,
        currentSessionId,
        choiceId
      });
    }
  };

  const handleEndAdventure = () => {
    if (socket && currentSessionId) {
      console.log("[GameScreen] Emitting game:end for session:", currentSessionId);
      socket.emit("game:end", { sessionId: currentSessionId });
    }
    onEnd();
  };

  const handleToggleSidebar = () => setIsSidebarOpen((current) => !current);

  return (
    <>
      <button
        type="button"
        onClick={handleToggleSidebar}
        style={{
          position: "fixed",
          top: "1rem",
          left: isSidebarOpen ? "17rem" : "1rem",
          zIndex: 9999,
          backgroundColor: "#1a1a2e",
          border: "1px solid #2d2d4a",
          borderRadius: "8px",
          padding: "8px 12px",
          color: "#c9a84c",
          fontSize: "0.8rem",
          cursor: "pointer",
          fontFamily: "Cinzel, Georgia, serif",
          transition: "all 0.3s ease",
        }}
      >
        {isSidebarOpen ? "◀ Chronicle" : "▶ Chronicle"}
      </button>

      <div className="relative min-h-screen w-full overflow-hidden bg-echo-black text-echo-text">
        <ParticleBackground />

        <div className="relative z-10 flex min-h-screen w-full">
          <AnimatePresence initial={false}>
            {isSidebarOpen && (
              <motion.aside
                className="w-64 shrink-0 border-r border-echo-border bg-echo-surface px-5 py-6"
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <div className="mb-6">
                  <p className="font-serif-display text-sm uppercase tracking-[0.25em] text-echo-gold">
                    Chronicle
                  </p>
                </div>

                <div className="flex max-h-[calc(100vh-220px)] flex-col gap-4 overflow-y-auto pr-1">
                  {history.length === 0 ? (
                    <p className="text-echo-muted text-sm">
                      No decisions yet. Your tale begins.
                    </p>
                  ) : (
                    history.map((entry, index) => (
                      <div
                        key={`${entry.scene}-${index}`}
                        className="space-y-1 pb-3"
                      >
                        <p className="text-echo-muted text-xs">
                          Scene {entry.scene}
                        </p>
                        <p className="text-echo-text text-sm leading-5">
                          {entry.choice}
                        </p>
                        {index < history.length - 1 && (
                          <div className="border-b border-echo-border" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="flex items-center justify-between gap-4 border-b border-echo-border bg-echo-surface px-6 py-5">
              <div className="flex items-center gap-4">
                <span className="font-serif-display text-lg text-echo-gold">
                  {playerName}
                </span>
                <span className="text-sm text-echo-muted">
                  Scene {sceneNumber}
                </span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleEndAdventure}
                  className="rounded-full border border-echo-red px-4 py-2 text-sm text-echo-red transition hover:bg-echo-red hover:text-white"
                >
                  End Adventure
                </button>
              </div>
            </header>

            <div className="relative flex flex-1 flex-col justify-between gap-6 px-8 py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={story}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative"
                >
                  <div className="relative overflow-hidden rounded-[32px] border border-echo-border bg-echo-surface p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
                    <div className="absolute left-0 top-0 h-8 w-8 border-t border-l border-echo-border" />
                    <div className="absolute right-0 bottom-0 h-8 w-8 border-b border-r border-echo-border" />

                    <div className="mb-6 flex items-center justify-center text-center text-sm uppercase text-echo-muted">
                      <span className="relative px-4">
                        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-echo-border" />
                        <span className="relative bg-echo-surface px-3">◆</span>
                      </span>
                    </div>

                    <NarrativeBox text={story} />

                    <div className="mt-6 flex items-center justify-center text-center text-sm uppercase text-echo-muted">
                      <span className="relative px-4">
                        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-echo-border" />
                        <span className="relative bg-echo-surface px-3">◆</span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-auto">
                {choices.length === 0 ? (
                  <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                    <button
                      type="button"
                      onClick={() => onEnd(summary)}
                      style={{
                        backgroundColor: "#c9a84c",
                        border: "none",
                        borderRadius: "8px",
                        padding: "14px 40px",
                        color: "#0a0a0f",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontFamily: "Cinzel, Georgia, serif",
                        letterSpacing: "1.5px",
                        boxShadow: "0 10px 25px rgba(201, 168, 76, 0.25)",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.transform = "translateY(-2px)";
                        event.currentTarget.style.boxShadow = "0 15px 30px rgba(201, 168, 76, 0.4)";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.transform = "translateY(0)";
                        event.currentTarget.style.boxShadow = "0 10px 25px rgba(201, 168, 76, 0.25)";
                      }}
                    >
                      Conclude Journey
                    </button>
                  </div>
                ) : (
                  <ChoicePanel choices={choices} onChoose={handleChoice} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
