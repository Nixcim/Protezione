
const Discord = require("discord.js");
const config = require("../configs/config.json");

exports.run = (database, message, args) => {
    if (!["933403887489146880"].includes(message.author.id)) return message.react(config.emojis.red);
    message.reply(`Nîx Was Here Calm Down Baby:)`)
};

exports.conf = {
    name: "ready?",
    aliases: []
};
