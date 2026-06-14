require("dotenv").config();

const PORT = process.env.PORT || 3001;
const MONGODB_URI =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI;

// Azure Foundry IQ (World Knowledge Base)
const AZURE_FOUNDRY_ENDPOINT = process.env.AZURE_FOUNDRY_ENDPOINT;
const AZURE_FOUNDRY_KEY = process.env.AZURE_FOUNDRY_KEY;

// Gemini API (LLM)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

module.exports = {
  PORT,
  MONGODB_URI,
  AZURE_FOUNDRY_ENDPOINT,
  AZURE_FOUNDRY_KEY,
  GEMINI_API_KEY,
  GEMINI_MODEL,
};
