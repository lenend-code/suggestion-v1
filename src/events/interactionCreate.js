const { Events } = require("discord.js");
const { addComment, getSuggestion, updateVote } = require("../utils/suggestionsStore");
const {
  buildCommentMenuMessage,
  buildCommentsMessage,
  buildSuggestionMessage
} = require("../utils/suggestionsUi");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // BUTTONS
    if (interaction.isButton()) {
      const parts = interaction.customId.split(":");
      if (parts.length !== 3) return;
      const [prefix, action, suggestionId] = parts;
      if (prefix !== "suggestion") return;

      if (action === "comment") {
        try {
          const menuPayload = buildCommentMenuMessage(suggestionId);
          await interaction.reply({ ...menuPayload, ephemeral: true });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(err);
          await interaction.reply({
            content: "ContainerBuilder غير متوفر في نسخة discord.js الحالية.",
            ephemeral: true
          }).catch(() => {});
        }
        return;
      }

      if (action !== "like" && action !== "dislike") return;

      const updated = await updateVote(suggestionId, interaction.user.id, action);
      if (!updated) {
        await interaction.reply({ content: "هذا الاقتراح غير موجود.", ephemeral: true }).catch(() => {});
        return;
      }

      try {
        const uiPayload = buildSuggestionMessage({
          suggestionId,
          authorId: updated.authorId,
          content: updated.content,
          attachmentUrls: updated.attachmentUrls,
          likes: updated.likes,
          dislikes: updated.dislikes
        });
        await interaction.update(uiPayload);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        await interaction.reply({
          content: "ContainerBuilder غير متوفر في نسخة discord.js الحالية.",
          ephemeral: true
        }).catch(() => {});
      }
      return;
    }

    // SELECT MENU
    if (interaction.isStringSelectMenu()) {
      const parts = interaction.customId.split(":");
      if (parts.length !== 3) return;
      const [prefix, action, suggestionId] = parts;
      if (prefix !== "suggestion") return;
      if (action !== "commentMenu") return;

      const picked = interaction.values?.[0];
      if (picked === "add_comment") {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
        const modal = new ModalBuilder()
          .setCustomId(`suggestion:addCommentModal:${suggestionId}`)
          .setTitle("Add Comment");

        const input = new TextInputBuilder()
          .setCustomId("comment")
          .setLabel("Your comment")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
        return;
      }

      if (picked === "view_comments") {
        const s = await getSuggestion(suggestionId);
        if (!s) {
          await interaction.reply({ content: "هذا الاقتراح غير موجود.", ephemeral: true }).catch(() => {});
          return;
        }

        try {
          const commentsPayload = buildCommentsMessage({
            suggestionId,
            comments: s.comments
          });
          // Open a NEW container message for comments (ephemeral)
          await interaction.reply({ ...commentsPayload, ephemeral: true });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(err);
          await interaction.reply({
            content: "ContainerBuilder غير متوفر في نسخة discord.js الحالية.",
            ephemeral: true
          }).catch(() => {});
        }
        return;
      }

      await interaction.update(interaction.message); // no-op fallback
      return;
    }

    // MODAL SUBMIT
    if (interaction.isModalSubmit()) {
      const parts = interaction.customId.split(":");
      if (parts.length !== 3) return;
      const [prefix, action, suggestionId] = parts;
      if (prefix !== "suggestion") return;
      if (action !== "addCommentModal") return;

      const comment = interaction.fields.getTextInputValue("comment");
      const updated = await addComment(suggestionId, { authorId: interaction.user.id, content: comment });
      if (!updated) {
        await interaction.reply({ content: "هذا الاقتراح غير موجود.", ephemeral: true }).catch(() => {});
        return;
      }

      const fresh = await getSuggestion(suggestionId);

      try {
        const commentsPayload = buildCommentsMessage({
          suggestionId,
          comments: fresh?.comments ?? []
        });
        await interaction.reply({ ...commentsPayload, ephemeral: true });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        await interaction.reply({ content: "تم إضافة تعليقك.", ephemeral: true }).catch(() => {});
      }
    }
  }
};

