const fs = require("node:fs");
const path = require("node:path");
const { REST, Routes } = require("discord.js");

function requireConfig() {
  const configPath = path.join(__dirname, "..", "config.json");
  if (!fs.existsSync(configPath)) {
    throw new Error(
      "Missing config.json. Copy config.example.json to config.json and fill token/clientId."
    );
  }
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const cfg = require(configPath);
  if (!cfg?.token || !cfg?.clientId) throw new Error("config.json must include token and clientId.");
  return cfg;
}

function loadCommands() {
  const commandsDir = path.join(__dirname, "commands");
  const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith(".js"));
  return files.map((file) => {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const cmd = require(path.join(commandsDir, file));
    return cmd.data.toJSON();
  });
}

async function main() {
  const { token, clientId } = requireConfig();
  const commands = loadCommands();

  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  // eslint-disable-next-line no-console
  console.log(`Registered ${commands.length} commands.`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

