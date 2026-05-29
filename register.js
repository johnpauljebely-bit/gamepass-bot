const { REST, Routes, SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

const command = new SlashCommandBuilder()
  .setName("edit-gamepass")
  .setDescription("Change the price of a Roblox gamepass")
  .addIntegerOption(opt =>
    opt.setName("pass").setDescription("Gamepass number (1-5)").setRequired(true)
       .addChoices(
         { name: "Gamepass 1", value: 1 },
         { name: "Gamepass 2", value: 2 },
         { name: "Gamepass 3", value: 3 },
         { name: "Gamepass 4", value: 4 },
         { name: "Gamepass 5", value: 5 },
       )
  )
  .addIntegerOption(opt =>
    opt.setName("price").setDescription("New price in Robux").setRequired(true)
  );

const rest = new REST().setToken(process.env.DISCORD_TOKEN);
(async () => {
  console.log("Registering command...");
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: [command.toJSON()] }
  );
  console.log("<:confirmed:1508971773960392825> Command registered!");
})();
