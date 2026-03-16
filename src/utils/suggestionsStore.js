const { Settings, Suggestion } = require("../db/models");

async function getSuggestionsChannel(guildId) {
  const settings = await Settings.findOne({ guildId }).lean();
  return settings?.suggestionsChannelId ?? null;
}

async function setSuggestionsChannel(guildId, channelId) {
  await Settings.updateOne(
    { guildId },
    { $set: { suggestionsChannelId: channelId } },
    { upsert: true }
  );
  return { guildId, channelId };
}

async function createSuggestion({
  suggestionId,
  guildId,
  messageId,
  channelId,
  authorId,
  content,
  attachmentUrls
}) {
  const doc = await Suggestion.create({
    id: suggestionId,
    guildId,
    channelId,
    messageId,
    authorId,
    content: content ?? "",
    attachmentUrls: attachmentUrls ?? [],
    likes: 0,
    dislikes: 0,
    voters: {},
    comments: [],
    createdAt: Date.now()
  });
  return doc.toObject();
}

async function getSuggestion(suggestionId) {
  const s = await Suggestion.findOne({ id: suggestionId }).lean();
  return s || null;
}

async function addComment(suggestionId, { authorId, content }) {
  const trimmed = String(content ?? "").trim();
  if (!trimmed) return getSuggestion(suggestionId);

  const comment = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    authorId,
    content: trimmed,
    createdAt: Date.now()
  };

  await Suggestion.updateOne({ id: suggestionId }, { $push: { comments: comment } });
  return getSuggestion(suggestionId);
}

async function updateVote(suggestionId, userId, nextVote) {
  const doc = await Suggestion.findOne({ id: suggestionId });
  if (!doc) return null;

  const voters = doc.voters || new Map();
  const prev = voters.get(userId) ?? null; // "like" | "dislike" | null

  const applyDelta = (vote, delta) => {
    if (vote === "like") doc.likes = Math.max(0, (doc.likes ?? 0) + delta);
    if (vote === "dislike") doc.dislikes = Math.max(0, (doc.dislikes ?? 0) + delta);
  };

  if (prev === nextVote) {
    voters.delete(userId);
    applyDelta(prev, -1);
  } else {
    if (prev) applyDelta(prev, -1);
    voters.set(userId, nextVote);
    applyDelta(nextVote, +1);
  }

  doc.voters = voters;
  await doc.save();
  return doc.toObject();
}

module.exports = {
  getSuggestionsChannel,
  setSuggestionsChannel,
  createSuggestion,
  getSuggestion,
  addComment,
  updateVote
};

