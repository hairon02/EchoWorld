/**
 * NarrativeOrchestrator.js
 *
 * Orchestrates narrative generation by grounding LLM calls in
 * world lore from Foundry IQ. Ensures all scenes are consistent
 * with the knowledge base to prevent hallucinations.
 */

const OpenAI = require("openai");
const foundryClient = require("./foundryClient");
const {
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_KEY,
  AZURE_OPENAI_DEPLOYMENT,
  AZURE_OPENAI_API_VERSION,
} = require("../utils/config");

class NarrativeOrchestrator {
  constructor() {
    this.azureOpenAiEndpoint = String(AZURE_OPENAI_ENDPOINT || "").trim();
    this.azureOpenAiKey = String(AZURE_OPENAI_KEY || "").trim();
    this.azureOpenAiDeployment = String(AZURE_OPENAI_DEPLOYMENT || "").trim();
    this.azureOpenAiApiVersion = String(
      AZURE_OPENAI_API_VERSION || "2024-02-01",
    ).trim();
    this.ready = Boolean(
      this.azureOpenAiEndpoint &&
      this.azureOpenAiKey &&
      this.azureOpenAiDeployment,
    );

    if (!this.ready) {
      console.error(
        "NarrativeOrchestrator: LLM credentials not set. Narrative generation disabled.",
      );
    }

    if (this.azureOpenAiEndpoint && this.azureOpenAiKey) {
      this.azureOpenAiClient = new OpenAI({
        apiKey: this.azureOpenAiKey,
        baseURL: this.azureOpenAiEndpoint.replace(/\/+$/, ""),
        defaultHeaders: {
          "api-key": this.azureOpenAiKey,
        },
        apiVersion: this.azureOpenAiApiVersion,
      });
    }
  }

  /**
   * Generate next scene based on player decision and session history.
   * Queries Foundry IQ for world context, builds a grounded prompt,
   * and calls the LLM to generate narrative + choices.
   *
   * @param {Object} input
   * @param {string} input.currentScene - Current scene narrative
   * @param {string} input.playerDecision - The choice player made
   * @param {Array} input.sessionHistory - Array of { narrative, choice } objects
   * @returns {Promise<{narrativeText: string, choices: Array<{id: string, text: string}>}>}
   */
  async generateScene(input = {}) {
    if (!this.ready) {
      return this._getFallbackScene();
    }

    const {
      currentScene = "",
      playerDecision = "",
      sessionHistory = [],
    } = input;

    try {
      // 1. Query Foundry IQ for world context
      const query = this._buildKnowledgeQuery(
        currentScene,
        playerDecision,
        sessionHistory,
      );
      const { context: worldContext, sources } =
        await foundryClient.queryKnowledge(query);

      // 2. Build the grounded prompt
      const prompt = this._buildSystemPrompt(
        currentScene,
        playerDecision,
        sessionHistory,
        worldContext,
      );
      const userPrompt = this._buildUserPrompt(
        currentScene,
        playerDecision,
        worldContext,
      );

      // 3. Call LLM
      const response = await this._callLlm(prompt, userPrompt);

      // 4. Parse and validate response
      const parsed =
        typeof response === "string" ? this._parseResponse(response) : response;

      if (!this._isValidScene(parsed)) {
        console.error("Invalid scene generated, using fallback.");
        return this._getFallbackScene();
      }

      return {
        narrativeText: parsed.narrativeText,
        choices: parsed.choices,
        sources,
      };
    } catch (error) {
      console.error(
        "NarrativeOrchestrator generateScene error:",
        error.message,
      );
      return this._getFallbackScene();
    }
  }

  _buildKnowledgeQuery(currentScene, playerDecision, sessionHistory) {
    const historyContext = sessionHistory
      .slice(-2)
      .map((item) => item.narrative)
      .join(" ");

    return `${currentScene} ${playerDecision} ${historyContext}`;
  }

  _buildSystemPrompt(
    currentScene,
    playerDecision,
    sessionHistory,
    worldContext,
  ) {
    return `You are an AI narrative game master for EchoWorld.

      World Lore and Context:
      ${worldContext || "No specific lore available."}

      Session History:
      ${
        sessionHistory.length === 0
          ? "This is the start of the adventure."
          : sessionHistory
              .map(
                (item, i) => `${i + 1}. Player chose: "${item.choice}"
      Result: ${item.narrative}`,
              )
              .join("\n")
      }

      Your task:
      1. Generate a vivid, immersive narrative scene (80-150 words) that continues the story.
      2. The narrative must be grounded in the world lore and consistent with session history.
      3. Provide exactly 3 choices for the player's next action.
      4. Each choice must be brief (5-10 words) and meaningfully affect the story.
      5. Response format MUST be valid JSON:
      {
        "narrativeText": "string (80-150 words)",
        "choices": [
          { "id": "choice_1", "text": "action one" },
          { "id": "choice_2", "text": "action two" },
          { "id": "choice_3", "text": "action three" }
        ]
      }`;
  }

  _buildUserPrompt(currentScene, playerDecision, worldContext) {
    return `Current scene: "${currentScene}"
      Player decision: "${playerDecision}"

      Generate the next scene as JSON.`;
  }

  async _callLlm(systemPrompt, userPrompt) {
    return this._callOpenAi({
      prompt: { system: systemPrompt, user: userPrompt },
      maxTokens: 1024,
    });
  }

  async _callOpenAi({ prompt, maxTokens }) {
    if (!this.azureOpenAiClient) {
      throw new Error(
        "Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY, and AZURE_OPENAI_DEPLOYMENT.",
      );
    }

    return this._callGpt4o({ prompt, maxTokens });
  }

  async _callGpt4o({ prompt, maxTokens }) {
    try {
      const deployment = this.azureOpenAiDeployment || "gpt-4o-mini";
      const response = await this.azureOpenAiClient.chat.completions.create({
        model: deployment,
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        max_tokens: maxTokens,
      });

      const content = response.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new Error("Azure OpenAI returned an unexpected response shape.");
      }

      return this._parseResponse(content);
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.message || String(error);

      if (status === 429 || /quota/i.test(message)) {
        throw new Error(`Azure OpenAI quota exceeded: ${message}`);
      }
      if (/deployment.*not found|model.*not found|404/i.test(message)) {
        throw new Error(`Azure OpenAI deployment not found: ${message}`);
      }

      throw new Error(`Azure OpenAI error: ${message}`);
    }
  }

  _parseResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Failed to parse LLM response:", error.message);
      throw error;
    }
  }

  _isValidScene(scene) {
    if (!scene || typeof scene !== "object") {
      return false;
    }

    const { narrativeText, choices } = scene;

    if (typeof narrativeText !== "string") {
      return false;
    }

    const wordCount = narrativeText.trim().split(/\s+/).length;
    if (wordCount < 80 || wordCount > 150) {
      console.warn(
        `Narrative word count ${wordCount} outside 80-150 range. Accepting anyway.`,
      );
    }

    if (!Array.isArray(choices) || choices.length !== 3) {
      console.error(`Expected 3 choices, got ${choices?.length || 0}`);
      return false;
    }

    const validChoices = choices.every(
      (choice) =>
        choice.id &&
        typeof choice.id === "string" &&
        choice.text &&
        typeof choice.text === "string",
    );

    return validChoices;
  }

  _getFallbackScene() {
    return {
      narrativeText:
        "The path ahead grows quiet. Shadows dance at the edge of sight. You sense something waiting, watching. What do you do?",
      choices: [
        { id: "choice_1", text: "Advance cautiously" },
        { id: "choice_2", text: "Search your surroundings" },
        { id: "choice_3", text: "Call out into the darkness" },
      ],
    };
  }
}

module.exports = new NarrativeOrchestrator();
