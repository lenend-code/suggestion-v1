const mongoose = require("mongoose");

async function connectMongo(mongoUri) {
  if (!mongoUri) throw new Error("config.json must include mongoUri.");

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
  return mongoose;
}

module.exports = { connectMongo };

