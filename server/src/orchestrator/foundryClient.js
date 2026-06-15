/**
 * foundryClient.js
 *
 * A lightweight client for Azure AI Search queries to the EchoWorld knowledge base.
 * Uses fetch to query the index directly.
 */
const {
  AZURE_SEARCH_ENDPOINT,
  AZURE_SEARCH_KEY,
  AZURE_SEARCH_INDEX,
} = require("../utils/config");

const DEFAULT_TIMEOUT_MS = 8000;

class FoundryClient {
  constructor() {
    this.endpoint = String(AZURE_SEARCH_ENDPOINT || "").trim();
    this.key = String(AZURE_SEARCH_KEY || "").trim();
    this.index = String(AZURE_SEARCH_INDEX || "echoworld-kb").trim();
    this.timeoutMs = Number(
      process.env.AZURE_FOUNDRY_TIMEOUT_MS || DEFAULT_TIMEOUT_MS,
    );
    this.ready = Boolean(
      this.endpoint && this.key && typeof fetch === "function",
    );

    console.log("[FoundryClient] Constructor - endpoint set:", !!this.endpoint);
    console.log("[FoundryClient] Constructor - key set:", !!this.key);
    console.log("[FoundryClient] Constructor - index set:", this.index);
    console.log("[FoundryClient] Constructor - is ready:", this.ready);

    if (!this.ready) {
      console.error(
        "FoundryClient initialization failed: missing search endpoint/key or global fetch is unavailable.",
      );
    }
  }

  /**
   * Query the Azure AI Search index for relevant world context.
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

    const baseUrl = this.endpoint.replace(/\/+$/, "") + "/";
    const url = `${baseUrl}indexes/${this.index}/docs/search?api-version=2023-11-01`;

    try {
      console.log("[FoundryClient] Fetching Azure AI Search query:", url);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.key,
        },
        body: JSON.stringify({
          search: query,
          top: 3
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await this._extractErrorMessage(response);
        console.error("FoundryClient queryKnowledge error:", errorText);
        return { context: "", sources: [] };
      }

      const data = await response.json();
      //console.log('[FoundryClient] Full response:', JSON.stringify(data, null, 2));
      
      const context = data.value
        ?.map((doc) => doc.snippet || doc.content || doc.text || JSON.stringify(doc))
        .filter(Boolean)
        .join("\n\n") || "";

      console.log("[FoundryClient] Search results count:", data.value?.length || 0);
      console.log("[FoundryClient] Context length:", context.length);

      const sources = data.value?.map((d) => d.metadata_storage_path || d.metadata_storage_name || d.uid || "unknown") || [];

      return { context, sources };
    } catch (error) {
      const message =
        error.name === "AbortError" ? "Foundry query timed out" : error.message;
      console.error("FoundryClient queryKnowledge error:", message);
      return { context: "", sources: [] };
    } finally {
      clearTimeout(timeout);
    }
  }

  _extractErrorMessage(response) {
    return response
      .text()
      .then((text) => text || `HTTP ${response.status}`)
      .catch(() => `HTTP ${response.status}`);
  }
}

module.exports = new FoundryClient();
