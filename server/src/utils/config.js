require("dotenv").config();

const PORT = process.env.PORT || 3001;
const MONGODB_URI =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI;

// Azure OpenAI (LLM)
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;

// Azure AI Search (Knowledge Base)
const AZURE_SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT;
const AZURE_SEARCH_KEY = process.env.AZURE_SEARCH_KEY;
const AZURE_SEARCH_INDEX = process.env.AZURE_SEARCH_INDEX || "echoworld-kb";

module.exports = {
  PORT,
  MONGODB_URI,
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_KEY,
  AZURE_OPENAI_DEPLOYMENT,
  AZURE_SEARCH_ENDPOINT,
  AZURE_SEARCH_KEY,
  AZURE_SEARCH_INDEX,
};
