/**
 * @jest-environment node
 */

const mockCreateCompletion = jest.fn();

// Mock the OpenAI client for Azure OpenAI usage
jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreateCompletion,
      },
    },
  }));
});

// Mock config before requiring the orchestrator so it picks up test values
jest.mock("../../utils/config", () => ({
  AZURE_OPENAI_ENDPOINT: "https://test.openai.azure.com",
  AZURE_OPENAI_KEY: "fake-key",
  AZURE_OPENAI_DEPLOYMENT: "gpt-4o-mini",
  AZURE_OPENAI_API_VERSION: "2024-02-01",
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

  mockCreateCompletion.mockResolvedValue({
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

  mockCreateCompletion.mockResolvedValue({
    choices: [
      {
        message: {
          content: "this is not json",
        },
      },
    ],
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

test("generateScene falls back when Azure OpenAI throws an error", async () => {
  foundryClient.queryKnowledge.mockResolvedValue({
    context: "ancient lore",
    sources: [],
  });

  mockCreateCompletion.mockRejectedValue(
    Object.assign(new Error("Azure OpenAI failed"), {
      response: { status: 500 },
      message: "server error",
    }),
  );

  const result = await orchestrator.generateScene({
    currentScene: "A dark corridor",
    playerDecision: "Light torch",
    sessionHistory: [],
  });

  const fallback = orchestrator._getFallbackScene();
  expect(result.narrativeText).toBe(fallback.narrativeText);
  expect(result.choices).toEqual(fallback.choices);
});
