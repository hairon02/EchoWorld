const dotenv = require('dotenv');
dotenv.config();

const orchestrator = require('./src/orchestrator/NarrativeOrchestrator');
const mongoose = require('mongoose');

async function run() {
  console.log("Testing generateScene...");
  const result = await orchestrator.generateScene({
    currentScene: "You stand before a glowing portal.",
    playerDecision: "I step into the portal.",
    sessionHistory: []
  });
  console.log("generateScene result:\n", JSON.stringify(result, null, 2));

  console.log("Testing DB connection...");
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/echoworld';
  await mongoose.connect(uri);
  console.log("DB connected successfully.");
  await mongoose.disconnect();
  console.log("DB disconnected.");
}

run().catch(err => {
  console.error("Test failed:", err);
});
