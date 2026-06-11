const mongoose = require("mongoose");

/**
 * Scene schema - Stores narrative scenes and their choices in MongoDB.
 * Scenes are the building blocks of the narrative branching structure.
 */
const sceneSchema = new mongoose.Schema(
  {
    sceneId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    narrativeText: {
      type: String,
      required: true,
      minlength: 80,
      maxlength: 150,
    },
    choices: [
      {
        id: {
          type: String,
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        _id: false,
      },
    ],
    worldContext: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Scene", sceneSchema);
