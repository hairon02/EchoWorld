const fs = require('fs');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

dotenv.config();

async function run() {
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const modelName = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1-mini';

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: endpoint
  });

  try {
    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "user", content: "Say hello!" }
      ],
      max_tokens: 50,
    });
    console.log("SUCCESS:", response.choices[0].message.content);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

run();
