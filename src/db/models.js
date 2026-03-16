const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    suggestionsChannelId: { type: String, default: null }
  },
  { timestamps: true }
);

const CommentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    authorId: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Number, required: true }
  },
  { _id: false }
);

const SuggestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    authorId: { type: String, required: true },
    content: { type: String, default: "" },
    attachmentUrls: { type: [String], default: [] },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    voters: { type: Map, of: String, default: {} }, // userId -> "like" | "dislike"
    comments: { type: [CommentSchema], default: [] },
    createdAt: { type: Number, required: true }
  },
  { timestamps: true }
);

const Settings =
  mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
const Suggestion =
  mongoose.models.Suggestion || mongoose.model("Suggestion", SuggestionSchema);

module.exports = {
  Settings,
  Suggestion
};

