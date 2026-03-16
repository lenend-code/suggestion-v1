const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  Events
} = require("discord.js");
const { connectMongo } = require("./db/mongoose");

function requireConfig() {
  const configPath = path.join(__dirname, "..", "config.json");
  if (!fs.existsSync(configPath)) {
    throw new Error(
      "Missing config.json. Copy config.example.json to config.json and fill token/clientId."
    );
  }
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const cfg = require(configPath);
  if (!cfg?.token) throw new Error("config.json must include token.");
  if (!cfg?.mongoUri) throw new Error("config.json must include mongoUri.");
  return cfg;
}

function loadHandlers(client) {
  client.commands = new Collection();

  // commands
  const commandsDir = path.join(__dirname, "commands");
  const commandFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith(".js"));
  for (const file of commandFiles) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const cmd = require(path.join(commandsDir, file));
    client.commands.set(cmd.data.name, cmd);
  }

  // events
  const eventsDir = path.join(__dirname, "events");
  const eventFiles = fs.readdirSync(eventsDir).filter((f) => f.endsWith(".js"));
  for (const file of eventFiles) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const evt = require(path.join(eventsDir, file));
    client.on(evt.name, (...args) => evt.execute(...args));
  }

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      const payload = { content: "صار خطأ أثناء تنفيذ الأمر.", ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  });
}

async function main() {
  const { token, mongoUri } = requireConfig();

  await connectMongo(mongoUri);

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
  });

  loadHandlers(client);

  client.once(Events.ClientReady, (c) => {
    // eslint-disable-next-line no-console
    console.log(`Logged in as ${c.user.tag}`);
  });

  await client.login(token);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

