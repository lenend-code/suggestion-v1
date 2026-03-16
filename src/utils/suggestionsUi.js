const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder
} = require("discord.js");

function buildVoteRow(suggestionId, likes, dislikes) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`suggestion:like:${suggestionId}`)
      .setStyle(ButtonStyle.Success)
      .setLabel(`Like (${likes ?? 0})`),
    new ButtonBuilder()
      .setCustomId(`suggestion:dislike:${suggestionId}`)
      .setStyle(ButtonStyle.Danger)
      .setLabel(`Dislike (${dislikes ?? 0})`),
    new ButtonBuilder()
      .setCustomId(`suggestion:comment:${suggestionId}`)
      .setStyle(ButtonStyle.Secondary)
      .setLabel("Add Comment")
  );
}

function buildCommentMenuRow(suggestionId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`suggestion:commentMenu:${suggestionId}`)
      .setPlaceholder("Comments")
      .addOptions(
        { label: "Add Comment", value: "add_comment" },
        { label: "View Comments", value: "view_comments" }
      )
  );
}

function chunkText(text, maxLen) {
  const out = [];
  let remaining = text || "";
  while (remaining.length > maxLen) {
    let cut = remaining.lastIndexOf("\n", maxLen);
    if (cut < 1) cut = maxLen;
    out.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).replace(/^\n+/, "");
  }
  if (remaining.length) out.push(remaining);
  return out;
}

function requireComponentsV2() {
  if (typeof ContainerBuilder !== "function" || typeof TextDisplayBuilder !== "function") {
    throw new Error(
      "ContainerBuilder is not available in your discord.js version. Please update discord.js."
    );
  }
}

function buildSuggestionMessage({
  suggestionId,
  authorId,
  content,
  attachmentUrls,
  likes,
  dislikes
}) {
  requireComponentsV2();
  if (!suggestionId) throw new Error("suggestionId is required to build vote buttons.");

  const filesText =
    attachmentUrls && attachmentUrls.length
      ? `\n\nAttachments:\n${attachmentUrls.map((u) => `- ${u}`).join("\n")}`
      : "";

  // Match the look in your screenshot
  const title = "**Suggestion**";
  const fromLine = `From <@${authorId}>`;
  const suggestionText = `${content || "(no text)"}${filesText}`;
  const stats = `Likes: ${likes ?? 0} | Dislikes: ${dislikes ?? 0}`;

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(title))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(fromLine))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(suggestionText))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(stats));

  // Put buttons INSIDE the container (all-in-one Components V2 message)
  container.addActionRowComponents(buildVoteRow(suggestionId, likes ?? 0, dislikes ?? 0));
  return { flags: MessageFlags.IsComponentsV2, components: [container] };
}

function buildCommentMenuMessage(suggestionId) {
  requireComponentsV2();
  if (!suggestionId) throw new Error("suggestionId is required.");

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("Comments"))
    .addSeparatorComponents(new SeparatorBuilder());

  // Select menu INSIDE the container
  container.addActionRowComponents(buildCommentMenuRow(suggestionId));
  return { flags: MessageFlags.IsComponentsV2, components: [container] };
}

function buildCommentsMessage({ suggestionId, comments }) {
  requireComponentsV2();
  if (!suggestionId) throw new Error("suggestionId is required.");

  const list = Array.isArray(comments) ? comments : [];
  const header = `**Comments (${list.length})**`;

  const blocks = [];
  if (!list.length) {
    blocks.push("No comments yet.");
  } else {
    for (let i = 0; i < list.length; i += 1) {
      const c = list[i];
      const ts = Math.floor((c.createdAt || Date.now()) / 1000);
      blocks.push(`${i + 1}. <@${c.authorId}> • <t:${ts}:R>\n${c.content}`);
    }
  }

  const container = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(header)
  );

  const bodyChunks = chunkText(blocks.join("\n\n"), 3800);
  container.addSeparatorComponents(new SeparatorBuilder());
  for (const chunk of bodyChunks) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(chunk));
  }

  return { flags: MessageFlags.IsComponentsV2, components: [container] };
}

module.exports = {
  buildSuggestionMessage,
  buildCommentMenuMessage,
  buildCommentsMessage
};

