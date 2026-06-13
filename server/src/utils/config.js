require("dotenv").config();

const PORT = process.env.PORT;
const MONGODB_URI =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI;
const AZURE_FOUNDRY_ENDPOINT = process.env.AZURE_FOUNDRY_ENDPOINT;
const AZURE_FOUNDRY_KEY = process.env.AZURE_FOUNDRY_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_PROVIDER = process.env.LLM_PROVIDER || "claude";
const LLM_MODEL_ID = process.env.LLM_MODEL_ID;

module.exports = {
  PORT,
  MONGODB_URI,
  AZURE_FOUNDRY_ENDPOINT,
  AZURE_FOUNDRY_KEY,
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_KEY,
  LLM_API_KEY,
  LLM_PROVIDER,
  LLM_MODEL_ID,
};
