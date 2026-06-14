/**
 * GameEngine - single source of truth for game state.
 * Manages active game sessions with player state, narrative context,
 * and decision history. Never mutate session state outside of this module.
 */

const NarrativeOrchestrator = require("../orchestrator/NarrativeOrchestrator");

class GameEngine {
  constructor() {
    /** @type {Map<string, Object>} Active sessions indexed by sessionId */
    this.sessions = new Map();
  }

  /**
   * Start a new game session for a player.
   * @param {string} playerName - The name of the player starting the game
   * @returns {Promise<Object>} Initial game session state with sessionId and first scene
   */
  async startGame(playerName) {
    console.log("[GameEngine] startGame called for playerName:", playerName);
    const sessionId = this.#generateSessionId();

    const fallbackScene = this.#getInitialScene();
    let initialScene;

    try {
      console.log("[GameEngine] Calling NarrativeOrchestrator.generateScene for initial scene...");
      const generated = await NarrativeOrchestrator.generateScene({
        currentScene: "You begin your adventure in a mysterious world",
        playerDecision: "start",
        sessionHistory: [],
      });

      if (generated && generated.narrativeText && Array.isArray(generated.choices)) {
        initialScene = {
          id: "scene_opening",
          narrativeText: generated.narrativeText,
          choices: generated.choices,
        };
        console.log("[GameEngine] AI-generated initial scene received:", initialScene.narrativeText.substring(0, 60) + "...");
      } else {
        console.log("[GameEngine] generateScene returned invalid data, using fallback initial scene");
        initialScene = fallbackScene;
      }
    } catch (error) {
      console.error("[GameEngine] Error calling NarrativeOrchestrator for initial scene:", error.message);
      initialScene = fallbackScene;
    }

    const session = {
      sessionId,
      playerName,
      sceneCount: 1,
      currentScene: initialScene,
      history: [
        {
          sceneId: initialScene.id,
          narrativeText: initialScene.narrativeText,
          timestamp: Date.now(),
        },
      ],
      decisions: [],
      createdAt: Date.now(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Record a player decision and advance to the next scene.
   * @param {string} sessionId - The session identifier
   * @param {string} choiceId - The id of the choice selected
   * @returns {Promise<Object>} Updated session state with new scene
   * @throws {Error} If session not found or choice is invalid
   */
  async makeDecision(sessionId, choiceId) {
    console.log(`[GameEngine] makeDecision called for session ${sessionId}, choiceId ${choiceId}`);
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    console.log("[GameEngine] Found session:", sessionId);

    const choice = session.currentScene.choices.find((c) => c.id === choiceId);

    if (!choice) {
      throw new Error(`Choice ${choiceId} not found in current scene`);
    }
    console.log(`[GameEngine] Found choice: "${choice.text}" (${choiceId})`);

    session.decisions.push({
      choiceId,
      choiceText: choice.text,
      fromSceneId: session.currentScene.id,
      timestamp: Date.now(),
    });

    session.sceneCount = (session.sceneCount || 1) + 1;
    const isFinalScene = session.sceneCount >= 10;

    // Build session history for the orchestrator
    const sessionHistory = session.decisions.map((dec, idx) => ({
      choice: dec.choiceText,
      narrative: session.history[idx + 1] ? session.history[idx + 1].narrativeText : "",
    }));

    // Try AI generation, fallback to hardcoded sceneMap
    let nextScene;
    try {
      console.log(`[GameEngine] Calling NarrativeOrchestrator.generateScene for scene ${session.sceneCount} (isFinalScene: ${isFinalScene})...`);
      const generated = await NarrativeOrchestrator.generateScene({
        currentScene: session.currentScene.narrativeText,
        playerDecision: choice.text,
        sessionHistory,
        isFinalScene,
      });

      const isValid = isFinalScene
        ? (generated && generated.narrativeText && Array.isArray(generated.choices) && generated.choices.length === 0)
        : (generated && generated.narrativeText && Array.isArray(generated.choices) && generated.choices.length === 3);

      if (isValid) {
        nextScene = {
          id: `scene_${Date.now()}`,
          narrativeText: generated.narrativeText,
          choices: generated.choices,
        };
        console.log("[GameEngine] AI-generated next scene received:", nextScene.narrativeText.substring(0, 60) + "...");
      } else {
        console.log("[GameEngine] generateScene returned invalid data, falling back to hardcoded scene");
        nextScene = isFinalScene ? this.#getFinalFallbackScene() : this.#getNextScene(choiceId);
      }
    } catch (error) {
      console.error("[GameEngine] Error calling NarrativeOrchestrator for next scene:", error.message);
      nextScene = isFinalScene ? this.#getFinalFallbackScene() : this.#getNextScene(choiceId);
    }

    console.log(`[GameEngine] Next scene resolved to: "${nextScene.id}" — ${nextScene.narrativeText.substring(0, 50)}...`);
    session.currentScene = nextScene;

    session.history.push({
      sceneId: nextScene.id,
      narrativeText: nextScene.narrativeText,
      timestamp: Date.now(),
    });

    return session;
  }

  /**
   * Retrieve the current state of a game session.
   * @param {string} sessionId - The session identifier
   * @returns {Object} Session state snapshot
   * @throws {Error} If session not found
   */
  getState(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    console.log(`[GameEngine] getState returned session ${sessionId} with scene: ${session.currentScene.id}`);

    return session;
  }

  /**
   * End a game session and remove it from active sessions.
   * @param {string} sessionId - The session identifier
   * @returns {boolean} True if session was found and deleted, false otherwise
   */
  endGame(sessionId) {
    return this.sessions.delete(sessionId);
  }

  /**
   * Generate a unique session ID.
   * @private
   * @returns {string} Unique session identifier
   */
  #generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the initial scene for a new game.
   * @private
   * @returns {Object} Scene object with id, narrativeText, and choices array
   */
  #getInitialScene() {
    return {
      id: "scene_opening",
      narrativeText:
        "You wake up in a strange land. The air is thick with mystery and possibility. Ancient structures loom in the distance, their purpose unknown. Your journey is just beginning, and every choice will shape your destiny. What do you do?",
      choices: [
        {
          id: "choice_explore_ruins",
          text: "Head towards the ancient ruins to investigate",
        },
        {
          id: "choice_find_shelter",
          text: "Find shelter and gather information from locals",
        },
        {
          id: "choice_follow_path",
          text: "Follow the winding path leading into the forest",
        },
      ],
    };
  }

  /**
   * Get the next scene based on a choice ID.
   * @private
   * @param {string} choiceId - The id of the choice made
   * @returns {Object} Next scene object
   */
  #getNextScene(choiceId) {
    const sceneMap = {
      choice_explore_ruins: {
        id: "scene_ruins",
        narrativeText:
          "The ruins tower before you, their weathered stone carved with symbols you cannot decipher. As you approach, you hear a faint humming sound emanating from within. Dust particles dance in the shafts of light piercing through cracks in the ancient walls. This place holds secrets, but they come at a cost.",
        choices: [
          {
            id: "choice_enter_carefully",
            text: "Enter carefully, watching for dangers",
          },
          {
            id: "choice_call_out",
            text: "Call out to see if anyone is inside",
          },
          {
            id: "choice_leave_ruins",
            text: "Leave and explore elsewhere",
          },
        ],
      },
      choice_find_shelter: {
        id: "scene_village",
        narrativeText:
          "You stumble upon a small village nestled in a valley. Warm lights flicker in the windows of modest homes. A figure emerges from the largest building, eyeing you with a mix of curiosity and caution. The locals seem to recognize something in your presence, though you cannot say what.",
        choices: [
          {
            id: "choice_approach_villager",
            text: "Approach the figure and ask for help",
          },
          {
            id: "choice_observe_first",
            text: "Observe the village from a distance first",
          },
          {
            id: "choice_continue_journey",
            text: "Continue your journey alone",
          },
        ],
      },
      choice_follow_path: {
        id: "scene_forest",
        narrativeText:
          "The forest path grows narrower as you venture deeper into the woods. The canopy above filters the sunlight into a gentle green glow. Strange sounds echo through the trees—some familiar, others utterly alien. You feel a presence watching you, neither threatening nor welcoming, simply observant.",
        choices: [
          {
            id: "choice_investigate_sounds",
            text: "Investigate the source of the sounds",
          },
          {
            id: "choice_quicken_pace",
            text: "Quicken your pace to leave the forest",
          },
          {
            id: "choice_sit_and_listen",
            text: "Sit and listen to understand the forest better",
          },
        ],
      },
    };

    return sceneMap[choiceId] || this.#getInitialScene();
  }

  /**
   * Get the fallback final scene when generation fails or is ending.
   * @private
   * @returns {Object} Final scene object
   */
  #getFinalFallbackScene() {
    return {
      id: "scene_final_fallback",
      narrativeText: "Your journey comes to an end. The echoes of your choices fade into the history of EchoWorld. The adventure is complete.",
      choices: [],
    };
  }
}

module.exports = new GameEngine();
