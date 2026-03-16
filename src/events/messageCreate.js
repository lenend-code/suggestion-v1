const crypto = require("node:crypto");
const { Events } = require("discord.js");
const { createSuggestion, getSuggestionsChannel } = require("../utils/suggestionsStore");
const { buildSuggestionMessage } = require("../utils/suggestionsUi");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild) return;
    if (message.author?.bot) return;

    const channelId = await getSuggestionsChannel(message.guildId);
    if (!channelId) return;
    if (message.channelId !== channelId) return;

    const content = message.content ?? "";
    const attachmentUrls = Array.from(message.attachments?.values?.() ?? []).map((a) => a.url);

    // Create suggestion record first, then post builder message.
    const suggestionId = crypto.randomUUID();
    let uiPayload;
    try {
      uiPayload = buildSuggestionMessage({
        suggestionId,
        authorId: message.author.id,
        content,
        attachmentUrls,
        likes: 0,
        dislikes: 0
      });
    } catch (err) {
      console.error(err);
      return;
    }

    const sent = await message.channel.send(uiPayload);

    await createSuggestion({
      suggestionId,
      guildId: message.guildId,
      messageId: sent.id,
      channelId: message.channelId,
      authorId: message.author.id,
      content,
      attachmentUrls
    });

    // Remove the original user message to keep channel clean.
    if (message.deletable) {
      await message.delete().catch(() => {});
    }
  }
};

