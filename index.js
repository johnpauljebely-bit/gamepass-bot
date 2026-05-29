const { Client, GatewayIntentBits } = require("discord.js");
const fetch = require("node-fetch");
const FormData = require("form-data");
require("dotenv").config();

const UNIVERSE_ID = process.env.ROBLOX_UNIVERSE_ID;
const API_KEY = process.env.ROBLOX_OPEN_CLOUD_API_KEY || null;
const COOKIE = process.env.ROBLOX_COOKIE || null;

const gamepasses = {
  1: process.env.GAMEPASS_1,
  2: process.env.GAMEPASS_2,
  3: process.env.GAMEPASS_3,
  4: process.env.GAMEPASS_4,
  5: process.env.GAMEPASS_5,
};

async function getCsrfToken(cookie) {
  const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch("https://auth.roblox.com/v2/logout", {
      method: "POST",
      headers: {
        Cookie: `.ROBLOSECURITY=${cookie}`,
        "User-Agent": "Roblox/WinInet",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.headers.get("x-csrf-token");
  } catch (e) {
    clearTimeout(timeout);
    throw new Error("CSRF token request timed out or failed.");
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log(`<:confirmed:1508971773960392825> Bot is online as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "edit-gamepass") return;

  const passNumber = interaction.options.getInteger("pass");
  const newPrice = interaction.options.getInteger("price");
  const gamepassId = gamepasses[passNumber];

  await interaction.deferReply();

  try {
    let csrfToken = null;
    if (!API_KEY && COOKIE) {
      csrfToken = await getCsrfToken(COOKIE);
      if (!csrfToken) {
        await interaction.editReply({
          flags: 64,
          content: `<:bot:1508971229241933925> Failed to get CSRF token — cookie may be expired.`,
        });
        return;
      }
    }

    const authHeaders = API_KEY
      ? { "x-api-key": API_KEY }
      : { Cookie: `.ROBLOSECURITY=${COOKIE}`, "x-csrf-token": csrfToken };

    const form = new FormData();
    form.append("name", `Gamepass (${newPrice})`);
    form.append("description", `Changed to ${newPrice} by ${interaction.user.tag}.`);
    form.append("price", newPrice);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let res;
    try {
      res = await fetch(
        `https://apis.roblox.com/game-passes/v1/universes/${UNIVERSE_ID}/game-passes/${gamepassId}`,
        {
          method: "PATCH",
          headers: {
            "User-Agent": "Roblox/WinInet",
            ...authHeaders,
            ...form.getHeaders(),
          },
          body: form,
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);
    } catch (e) {
      clearTimeout(timeout);
      await interaction.editReply({
        flags: 64,
        content: `<:bot:1508971229241933925> Request timed out — Roblox API did not respond. Try again in a moment.`,
      });
      return;
    }

    const text = await res.text();
    console.log("Roblox response:", res.status, text);

    if (res.ok) {
      await interaction.editReply({
        flags: 32768,
        components: [
          {
            type: 17,
            components: [
              {
                type: 9,
                components: [
                  {
                    type: 10,
                    content: `## <:blocks:1508973221607899308> Gamepass Edited`,
                  },
                ],
                accessory: {
                  type: 2,
                  style: 5,
                  label: "Click Here",
                  url: `https://roblox.com/game-pass/${gamepassId}`,
                },
              },
              {
                type: 10,
                content: `> *Gamepass ${passNumber}*'s price has been updated accordingly to **${newPrice}** Robux.`,
              },
              {
                type: 10,
                content: `-# Please purchase this pass and let us know when you are done.`,
              },
              {
                type: 14,
                spacing: 2,
              },
              {
                type: 12,
                items: [
                  {
                    media: {
                      url: "https://media.discordapp.net/attachments/1508989759261774126/1508989773283328030/image.png?ex=6a1a2ebd&is=6a18dd3d&hm=61ba01876c7213cbf8f710caa3ff6dad1c840f2f36fbee3cea9b6f553125e6d0&=&format=webp&quality=lossless&width=2784&height=210",
                    },
                  },
                ],
              },
            ],
          },
        ],
      });
    } else {
      await interaction.editReply({
        flags: 64,
        content: `<:bot:1508971229241933925> Roblox error: Status ${res.status} — ${text}`,
      });
    }
  } catch (error) {
    await interaction.editReply({
      flags: 64,
      content: `<:bot:1508971229241933925> Something went wrong: ${error.message}`,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
