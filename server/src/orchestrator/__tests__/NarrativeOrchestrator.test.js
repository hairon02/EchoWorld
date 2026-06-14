/**
 * @jest-environment node
 */

const mockGenerateContent = jest.fn();

// Mock the Google Generative AI client
jest.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockImplementation(() => ({
        generateContent: mockGenerateContent,
      })),
    })),
  };
});

// Mock config before requiring the orchestrator so it picks up test values
jest.mock("../../utils/config", () => ({
  GEMINI_API_KEY: "fake-gemini-key",
  GEMINI_MODEL: "gemini-3.5-flash",
}));

// Mock the foundry client
jest.mock("../foundryClient", () => ({
  queryKnowledge: jest.fn(),
}));

const foundryClient = require("../foundryClient");
// Re-require to ensure mocks are applied
const orchestrator = require("../NarrativeOrchestrator");

beforeEach(() => {
  jest.resetAllMocks();
});

test("generateScene returns parsed narrative and 3 choices when Gemini returns valid JSON", async () => {
  const hundredWords = Array(100).fill("word").join(" ");

  foundryClient.queryKnowledge.mockResolvedValue({
    context: "ancient lore",
    sources: ["lore://fragment1"],
  });

  mockGenerateContent.mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        narrativeText: hundredWords,
        choices: [
          { id: "choice_1", text: "Do A" },
          { id: "choice_2", text: "Do B" },
          { id: "choice_3", text: "Do C" },
        ],
      }),
    },
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

test("generateScene falls back when Gemini returns invalid JSON", async () => {
  foundryClient.queryKnowledge.mockResolvedValue({
    context: "ancient lore",
    sources: [],
  });

  mockGenerateContent.mockResolvedValue({
    response: {
      text: () => "this is not json",
    },
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

test("generateScene falls back when Gemini throws an error", async () => {
  foundryClient.queryKnowledge.mockResolvedValue({
    context: "ancient lore",
    sources: [],
  });

  mockGenerateContent.mockRejectedValue(new Error("Gemini API failed"));

  const result = await orchestrator.generateScene({
    currentScene: "A dark corridor",
    playerDecision: "Light torch",
    sessionHistory: [],
  });

  const fallback = orchestrator._getFallbackScene();
  expect(result.narrativeText).toBe(fallback.narrativeText);
  expect(result.choices).toEqual(fallback.choices);
});
