const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { setSuggestionsChannel } = require("../utils/suggestionsStore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("suggestions")
    .setDescription("Set the suggestions channel")
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("Select the suggestions channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), // 32768

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel", true);
    await setSuggestionsChannel(interaction.guildId, channel.id);
    await interaction.reply({
      content: `Suggestions channel set to ${channel}.`,
      ephemeral: true
    });
  }
};

