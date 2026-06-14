/**
 * foundryClient.js
 *
 * A client for Azure Foundry IQ knowledge queries.
 * Migrated to OpenAI v1 chat completions format.
 */
const { OpenAI } = require("openai");
const {
  AZURE_FOUNDRY_ENDPOINT,
  AZURE_FOUNDRY_KEY,
} = require("../utils/config");

const DEFAULT_TIMEOUT_MS = 8000;

class FoundryClient {
  constructor() {
    this.endpoint = String(AZURE_FOUNDRY_ENDPOINT || "").trim();
    this.key = String(AZURE_FOUNDRY_KEY || "").trim();
    this.timeoutMs = Number(
      process.env.AZURE_FOUNDRY_TIMEOUT_MS || DEFAULT_TIMEOUT_MS,
    );
    this.ready = Boolean(
      this.endpoint && this.key
    );

    console.log("[FoundryClient] Constructor - endpoint set:", !!this.endpoint);
    console.log("[FoundryClient] Constructor - key set:", !!this.key);
    console.log("[FoundryClient] Constructor - is ready:", this.ready);
    console.log("[FoundryClient] Constructor - endpoint:", this.endpoint);

    if (!this.ready) {
      console.error(
        "FoundryClient initialization failed: missing endpoint or key.",
      );
    } else {
      this.client = new OpenAI({
        apiKey: this.key,
        baseURL: this.endpoint + "/openai/v1",
      });
    }
  }

  /**
   * Query the Foundry knowledge base for relevant world context.
   * @param {string} query
   * @returns {Promise<{context: string, sources: string[]}>}
   */
  async queryKnowledge(query) {
    console.log("[FoundryClient] queryKnowledge called, query:", query?.substring(0, 80) + (!!query?.substring ? "" : "..."));
    if (!this.ready) {
      console.log("[FoundryClient] Not ready, returning empty context");
      return { context: "", sources: [] };
    }

    if (!query || typeof query !== "string") {
      console.log("[FoundryClient] Invalid query, returning empty context");
      return { context: "", sources: [] };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      console.log("[FoundryClient] Querying chat completions baseURL:", this.endpoint + "/openai/v1");
      const response = await this.client.chat.completions.create({
        model: "echoworld-foundry",
        messages: [{ role: "user", content: query }],
      }, {
        signal: controller.signal,
      });

      const responseText = response.choices[0]?.message?.content || "";
      console.log("[FoundryClient] Response received successfully");
      return { context: responseText, sources: [] };
    } catch (error) {
      const message =
        error.name === "AbortError" ? "Foundry query timed out" : error.message;
      console.error("FoundryClient queryKnowledge error:", message);
      return { context: "", sources: [] };
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = new FoundryClient();
