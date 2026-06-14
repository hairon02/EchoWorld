const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { connectToMongo } = require("./db/mongo");
const apiRouter = require("./routes");
const config = require("./utils/config");
const GameEngine = require("./engine/GameEngine");
const Session = require("./db/Session");
const NarrativeOrchestrator = require("./orchestrator/NarrativeOrchestrator");

console.log("[server] index.js loaded");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use("/api", apiRouter);

app.get("/", (req, res) => {
  res.json({ success: true, message: "EchoWorld server running" });
});

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  /**
   * game:start event - Initialize a new game session for a player
   * Receives: { playerName }
   * Emits: "game:scene" with initial scene data
   */
  socket.on("game:start", async (data) => {
    console.log("[server] game:start event received, data:", JSON.stringify(data, null, 2));
    try {
      const { playerName } = data;

      if (!playerName || typeof playerName !== "string") {
        console.log("[server] Invalid playerName, aborting");
        socket.emit("error", { message: "Invalid playerName" });
        return;
      }

      const session = await GameEngine.startGame(playerName);
      console.log("[server] GameEngine.startGame returned:", JSON.stringify(session, null, 2));
      socket.join(session.sessionId);

      socket.emit("game:scene", {
        sessionId: session.sessionId,
        scene: session.currentScene,
        history: session.history,
      });
      console.log("[server] Emitted game:scene to client", session.sessionId);

      console.log(
        `Game started for ${playerName} with session ${session.sessionId}`,
      );
    } catch (error) {
      console.error("game:start error:", error.message);
      socket.emit("error", { message: "Failed to start game" });
    }
  });

  /**
   * game:choice event - Process a player's decision
   * Receives: { sessionId, choiceId }
   * Emits: "game:scene" with updated scene or "error" if invalid
   */
  socket.on("game:choice", async (data) => {
    console.log("[server] game:choice event received, data:", JSON.stringify(data, null, 2));
    try {
      const { sessionId, choiceId } = data;

      if (!sessionId || !choiceId) {
        console.log("[server] Invalid sessionId or choiceId, aborting");
        socket.emit("error", { message: "Invalid sessionId or choiceId" });
        return;
      }

      const beforeState = GameEngine.getState(sessionId);
      console.log("[server] Session state BEFORE makeDecision:", JSON.stringify(beforeState, null, 2));

      const updatedSession = await GameEngine.makeDecision(sessionId, choiceId);
      console.log("[server] GameEngine.makeDecision returned:", JSON.stringify(updatedSession, null, 2));

      socket.emit("game:scene", {
        sessionId: updatedSession.sessionId,
        scene: updatedSession.currentScene,
        history: updatedSession.history,
        decisions: updatedSession.decisions,
      });
      console.log("[server] Emitted game:scene to client after choice", choiceId);

      console.log(
        `Choice ${choiceId} made in session ${sessionId} by ${updatedSession.playerName}`,
      );
    } catch (error) {
      console.error("game:choice error:", error.message);
      socket.emit("error", { message: error.message });
    }
  });

  /**
   * game:end event - End a session and persist to MongoDB
   * Receives: { sessionId }
   * Emits: "game:summary" with final session stats
   */
  socket.on("game:end", async (data) => {
    try {
      const { sessionId } = data;

      if (!sessionId) {
        socket.emit("error", { message: "Invalid sessionId" });
        return;
      }

      const session = GameEngine.getState(sessionId);
      const endedAt = new Date();

      const sessionData = {
        sessionId: session.sessionId,
        playerName: session.playerName,
        startedAt: new Date(session.createdAt),
        endedAt,
        decisions: session.decisions,
        status: "completed",
      };

      await Session.create(sessionData);
      GameEngine.endGame(sessionId);
      socket.leave(sessionId);

      const summary = {
        sessionId: session.sessionId,
        playerName: session.playerName,
        totalDecisions: session.decisions.length,
        totalScenes: session.history.length,
        duration: Math.floor((endedAt - new Date(session.createdAt)) / 1000),
      };

      socket.emit("game:summary", summary);

      console.log(`Session ${sessionId} ended and persisted to MongoDB`);
    } catch (error) {
      console.error("game:end error:", error.message);
      socket.emit("error", { message: error.message });
    }
  });

  /**
   * Handle client disconnection gracefully
   * Marks active session as abandoned if not already ended
   */
  socket.on("disconnect", async () => {
    console.log("socket disconnected:", socket.id);

    try {
      const rooms = socket.rooms;
      for (const sessionId of rooms) {
        if (sessionId !== socket.id) {
          try {
            const session = GameEngine.getState(sessionId);
            await Session.updateOne(
              { sessionId },
              {
                status: "abandoned",
                endedAt: new Date(),
              },
            );
            GameEngine.endGame(sessionId);
            console.log(
              `Session ${sessionId} marked as abandoned due to disconnect`,
            );
          } catch {
            // Session not found or already ended, continue
          }
        }
      }
    } catch (error) {
      console.error("disconnect cleanup error:", error.message);
    }
  });
});

async function start() {
  try {
    await connectToMongo();
  } catch (err) {
    console.error("Continuing without MongoDB due to error");
  }

  const port = config.PORT || 3001;
  server.listen(port, () => console.log(`Server listening on ${port}`));
}

start();
