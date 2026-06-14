/**
 * @jest-environment node
 */

const mockCreateChatCompletion = jest.fn();

// Mock the OpenAI client
jest.mock("openai", () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreateChatCompletion,
        },
      },
    })),
  };
});

// Mock config before requiring the orchestrator so it picks up test values
jest.mock("../../utils/config", () => ({
  NVIDIA_API_KEY: "fake-nvidia-key",
  NVIDIA_MODEL: "meta/llama-3.3-70b-instruct",
}));

// Mock the foundry client
jest.mock("../foundryClient", () => ({
  queryKnowledge: jest.fn(),
}));

const foundryClient = require("../foundryClient");
// Re-require to ensure mocks are applied
const orchestrator = require("../NarrativeOrchestrator");

beforeEach(() => {
  jest.clearAllMocks();
});

test("generateScene returns parsed narrative and 3 choices when LLM returns valid JSON", async () => {
  const hundredWords = Array(100).fill("word").join(" ");

  foundryClient.queryKnowledge.mockResolvedValue({
    context: "ancient lore",
    sources: ["lore://fragment1"],
  });

  mockCreateChatCompletion.mockResolvedValue({
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

  mockCreateChatCompletion.mockResolvedValue({
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

test("generateScene falls back when LLM throws an error", async () => {
  foundryClient.queryKnowledge.mockResolvedValue({
    context: "ancient lore",
    sources: [],
  });

  mockCreateChatCompletion.mockRejectedValue(new Error("NVIDIA API failed"));

  const result = await orchestrator.generateScene({
    currentScene: "A dark corridor",
    playerDecision: "Light torch",
    sessionHistory: [],
  });

  const fallback = orchestrator._getFallbackScene();
  expect(result.narrativeText).toBe(fallback.narrativeText);
  expect(result.choices).toEqual(fallback.choices);
});
