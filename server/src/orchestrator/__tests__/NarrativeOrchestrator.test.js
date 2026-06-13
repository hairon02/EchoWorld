/**
 * @jest-environment node
 */

// Mock config before requiring the orchestrator so it picks up test values
jest.mock("../../utils/config", () => ({
  LLM_API_KEY: "fake-key",
  LLM_PROVIDER: "openai",
  LLM_MODEL_ID: "gpt-4o",
  AZURE_OPENAI_ENDPOINT: "",
  AZURE_OPENAI_KEY: "",
}));

// Mock the foundry client
jest.mock("../foundryClient", () => ({
  queryKnowledge: jest.fn(),
}));

const foundryClient = require("../foundryClient");
const orchestrator = require("../NarrativeOrchestrator");

beforeEach(() => {
  jest.resetAllMocks();
  delete global.fetch;
});

test("generateScene returns parsed narrative and 3 choices when LLM returns valid JSON", async () => {
  const hundredWords = Array(100).fill("word").join(" ");

  foundryClient.queryKnowledge.mockResolvedValue({
    context: "ancient lore",
    sources: ["lore://fragment1"],
  });

  // Mock OpenAI chat completion response where message.content contains a JSON string
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify({
              narrativeText: hundredWords,
              choices: [
                { id: "choice_1", text: "Do A" },
                { id: "choice_2", text: "Do B" },
                { id: "choice_3", text: "Do C" },
              ],
            }),
          },
        },
      ],
    }),
  });

  const result = await orchestrator.generateScene({
    currentScene: "You stand at the gate.",
    playerDecision: "Open the gate",
    sessionHistory: [],
  });

  expect(result).toBeDefined();
  expect(result.narrativeText).toBe(hundredWords);
  expect(Array.isArray(result.choices)).toBe(true);
  expect(result.choices).toHaveLength(3);
  expect(result.sources).toEqual(["lore://fragment1"]);
});

test("generateScene falls back when LLM returns invalid JSON", async () => {
  foundryClient.queryKnowledge.mockResolvedValue({
    context: "ancient lore",
    sources: [],
  });

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: "this is not json",
          },
        },
      ],
    }),
  });

  const result = await orchestrator.generateScene({
    currentScene: "A silent hall",
    playerDecision: "Whisper",
    sessionHistory: [],
  });

  const fallback = orchestrator._getFallbackScene();
  expect(result.narrativeText).toBe(fallback.narrativeText);
  expect(result.choices).toEqual(fallback.choices);
});

test("generateScene falls back when LLM responds with non-OK HTTP", async () => {
  foundryClient.queryKnowledge.mockResolvedValue({
    context: "ancient lore",
    sources: [],
  });

  global.fetch = jest
    .fn()
    .mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "server error",
    });

  const result = await orchestrator.generateScene({
    currentScene: "A dark corridor",
    playerDecision: "Light torch",
    sessionHistory: [],
  });

  const fallback = orchestrator._getFallbackScene();
  expect(result.narrativeText).toBe(fallback.narrativeText);
  expect(result.choices).toEqual(fallback.choices);
});
