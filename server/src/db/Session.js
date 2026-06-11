const mongoose = require("mongoose");

/**
 * Session schema - Stores persistent game session data in MongoDB.
 * Each session tracks a player's game progress, decisions, and game state.
 */
const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    playerName: {
      type: String,
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    decisions: [
      {
        sceneId: {
          type: String,
          required: true,
        },
        choice: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
          default: Date.now,
        },
        _id: false,
      },
    ],
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Session", sessionSchema);
