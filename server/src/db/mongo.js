const mongoose = require("mongoose");
const config = require("../utils/config");

async function connectToMongo() {
  const uri = config.MONGODB_URI;
  if (!uri) {
    console.warn("MONGO_URI not set; skipping MongoDB connection");
    return;
  }

  try {
    mongoose.set("strictQuery", false);
    await mongoose
      .connect(config.MONGODB_URI)
      .then(() => logger.info("connect to ", config.MONGODB_URI))
      .catch((error) =>
        logger.error("error connecting to MongoDB", error.message),
      );
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
}

module.exports = { connectToMongo, mongoose };
