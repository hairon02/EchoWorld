require("dotenv").config();

const PORT = process.env.PORT || 3001;
const MONGODB_URI =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI;

// Azure Foundry IQ (World Knowledge Base)
const AZURE_FOUNDRY_ENDPOINT = process.env.AZURE_FOUNDRY_ENDPOINT;
const AZURE_FOUNDRY_KEY = process.env.AZURE_FOUNDRY_KEY;

// NVIDIA NIM (LLM)
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct";

module.exports = {
  PORT,
  MONGODB_URI,
  AZURE_FOUNDRY_ENDPOINT,
  AZURE_FOUNDRY_KEY,
  NVIDIA_API_KEY,
  NVIDIA_MODEL,
};
