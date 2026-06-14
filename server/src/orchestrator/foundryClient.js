/**
 * foundryClient.js
 *
 * A lightweight client for Azure Foundry IQ knowledge queries.
 * Uses the server environment variables AZURE_FOUNDRY_ENDPOINT and
 * AZURE_FOUNDRY_KEY to authenticate requests.
 */
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
      this.endpoint && this.key && typeof fetch === "function",
    );

    console.log("[FoundryClient] Constructor - endpoint set:", !!this.endpoint);
    console.log("[FoundryClient] Constructor - key set:", !!this.key);
    console.log("[FoundryClient] Constructor - is ready:", this.ready);
    console.log("[FoundryClient] Constructor - endpoint:", this.endpoint);

    if (!this.ready) {
      console.error(
        "FoundryClient initialization failed: missing endpoint/key or global fetch is unavailable.",
      );
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

    const baseUrl = this.endpoint.replace(/\/+$/, "");
    const baseQueryUrl = baseUrl.endsWith("/query") ? baseUrl : `${baseUrl}/query`;
    const url = `${baseQueryUrl}?api-version=2024-05-01-preview`;

    try {
      console.log("[FoundryClient] Fetching:", url);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.key,
          Authorization: `Bearer ${this.key}`,
        },
        body: JSON.stringify({ query, top: 5 }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await this._extractErrorMessage(response);
        console.error("FoundryClient queryKnowledge error:", errorText);
        return { context: "", sources: [] };
      }

      const payload = await response.json();
      console.log("[FoundryClient] Response received, keys:", Object.keys(payload || {}));
      return this._parseKnowledgeResponse(payload);
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

  _parseKnowledgeResponse(payload) {
    if (!payload || typeof payload !== "object") {
      return { context: "", sources: [] };
    }

    const context = this._extractContext(payload);
    const sources = this._extractSources(payload);

    return { context, sources };
  }

  _extractContext(payload) {
    if (typeof payload.context === "string" && payload.context.trim()) {
      return payload.context.trim();
    }

    if (typeof payload.answer === "string" && payload.answer.trim()) {
      return payload.answer.trim();
    }

    if (Array.isArray(payload.results)) {
      const chunks = payload.results
        .map((item) => item.text || item.answer || item.content)
        .filter(Boolean);
      return chunks.join("\n\n").trim();
    }

    return JSON.stringify(payload);
  }

  _extractSources(payload) {
    if (Array.isArray(payload.sources)) {
      return payload.sources.map(this._normalizeSource).filter(Boolean);
    }

    if (Array.isArray(payload.results)) {
      return payload.results.flatMap((item) => {
        if (Array.isArray(item.sources)) {
          return item.sources.map(this._normalizeSource).filter(Boolean);
        }
        return [];
      });
    }

    return [];
  }

  _normalizeSource(source) {
    if (!source) {
      return null;
    }

    if (typeof source === "string") {
      return source;
    }

    if (typeof source === "object") {
      return source.id || source.name || source.source || null;
    }

    return String(source);
  }
}

module.exports = new FoundryClient();
