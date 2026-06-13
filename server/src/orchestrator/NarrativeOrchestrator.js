/**
 * NarrativeOrchestrator.js
 *
 * Orchestrates narrative generation by grounding LLM calls in
 * world lore from Foundry IQ. Ensures all scenes are consistent
 * with the knowledge base to prevent hallucinations.
 */

const foundryClient = require("./foundryClient");
const {
  LLM_API_KEY,
  LLM_PROVIDER,
  LLM_MODEL_ID,
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_KEY,
} = require("../utils/config");

class NarrativeOrchestrator {
  constructor() {
    this.apiKey = String(LLM_API_KEY || "").trim();
    this.provider = String(LLM_PROVIDER || "claude").toLowerCase();
    this.modelId = String(LLM_MODEL_ID || "").trim();
    this.azureOpenAiEndpoint = String(AZURE_OPENAI_ENDPOINT || "").trim();
    this.azureOpenAiKey = String(AZURE_OPENAI_KEY || "").trim();
    this.ready = Boolean(this.apiKey || this.azureOpenAiKey);

    if (!this.ready) {
      console.error(
        "NarrativeOrchestrator: LLM credentials not set. Narrative generation disabled.",
      );
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
      const parsed = this._parseResponse(response);

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
    if (this.provider === "claude") {
      return this._callClaude(systemPrompt, userPrompt);
    } else if (this.provider === "openai" || this.provider.startsWith("gpt-")) {
      return this._callOpenAi(systemPrompt, userPrompt);
    }
    throw new Error(`Unsupported LLM provider: ${this.provider}`);
  }

  async _callOpenAi(systemPrompt, userPrompt) {
    if (this.azureOpenAiEndpoint && this.azureOpenAiKey) {
      return this._callAzureOpenAi(systemPrompt, userPrompt);
    }

    return this._callGpt4o(systemPrompt, userPrompt);
  }

  async _callClaude(systemPrompt, userPrompt) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.modelId || "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async _callGpt4o(systemPrompt, userPrompt) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.modelId || "gpt-4o",
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`GPT-4o API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async _callAzureOpenAi(systemPrompt, userPrompt) {
    const baseUrl = this.azureOpenAiEndpoint.replace(/\/+$/, "");
    const deployment = this.modelId || "gpt-4o";
    const url = `${baseUrl}/openai/deployments/${deployment}/chat/completions?api-version=2023-10-01-preview`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": this.azureOpenAiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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
