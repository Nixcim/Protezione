const Discord = require("discord.js");
const config = require("./src/configs/config.json");
const whitelist1 = require("./src/configs/whitelist1.json");
const loginkeys = require("./src/configs/loginkeys.json");
const logs = require("./src/configs/logs.json");
const guards = require("./src/configs/guards.json");
const mongo = require("./src/configs/mongo.json");
const RoleDatabase = require("./src/models/rol.js");
const ChannelDatabase = require("./src/models/kanal.js");
const mongoose = require("mongoose");
const moment = require("moment");
//moment.locale("tr");
const fs = require("fs");
const request = require("request");
const tokens = global.tokenler = [""];
const perms = [
"ADMINISTRATOR",
"MANAGE_GUILD",
"MANAGE_ROLES",
"MANAGE_CHANNELS",
"BAN_MEMBERS",
"KICK_MEMBERS",
"MANAGE_NICKNAMES",
"MANAGE_EMOJIS",
"MANAGE_WEBHOOKS"
];

mongoose.connect(mongo.database_url, { useNewUrlParser: true, useUnifiedTopology: true }).then(e => console.log(`[MONGOOSE] MongoDB bağlantısı başarıyla kuruldu!`)).catch(err => console.error(`[MONGOOSE] MongoDB bağlantısı kurulurken bir hata oluştu! Hata: ${err}`));

const database = new Discord.Client({ fetchAllMembers: true })

database.on("ready", () => {
database.user.setPresence({ activity: { name: config.mainbots.game, type: config.mainbots.type }, status: config.mainbots.status })
if (database.channels.cache.get(config.voiceChannel)) database.channels.cache.get(config.voiceChannel).join().then(e => {
e.voice.setSelfDeaf(true);
});
channelBackup()
rolBackup()
setTimeout(() => {
database.user.setPresence({ activity: { name: config.mainbots.game, type: config.mainbots.type }, status: config.mainbots.status })
if (database.channels.cache.get(config.voiceChannel)) database.channels.cache.get(config.voiceChannel).join().then(e => {
e.voice.setSelfDeaf(true);
});
channelBackup()
rolBackup()
}, 1800000);

let tokenler = loginkeys.tokenler;

tokenler.forEach(e => {
let token = new Discord.Client({ fetchAllMembers: true });

token.on("ready", () => {
let botVoiceChannel = token.channels.cache.get(config.voiceChannel); 
if (botVoiceChannel) 
botVoiceChannel.join().then(e => { e.voice.setSelfDeaf(true);})
token.user.setPresence({ activity: { name: config.helperbots.game, type: config.helperbots.type }, status: config.helperbots.status })
console.log(`[HELPER] ${token.user.username} başarıyla aktif edildi!`)
token.idle = false;
token.uj = 0;
tokens.push(token)
});

token.login(e).catch(err => console.error(`[HELPER] ${e.substring(Math.floor(e.length / 2))} aktif edilirken bir sorun oluştu!`));
});
});

database.commands = new Discord.Collection();
database.aliases = new Discord.Collection();
fs.readdir("./src/commands", (err, files) => {
	if (err) console.error(err);
	files.forEach((f) => {
		let props = require(`./src/commands/${f}`);
		console.log(`[COMMAND] ${props.conf.name} aktif!`);
		database.commands.set(props.conf.name, props);
		props.conf.aliases.forEach((alias) => {
			database.aliases.set(alias, props.conf.name);
		});
	});
});

database.on("message", async message => {
if (message.author.bot) return;
let prefix = config.prefix;
let database = message.client;
let logkanal = database.channels.cache.get(logs.database_log);
if (message.author.bot) return;
if (!message.content.toLowerCase().startsWith(prefix)) return;
let command = message.content.toLowerCase().split(' ')[0].slice(prefix.length);
let params = message.content.toLowerCase().split(' ').slice(1);
let cmd;
if (database.commands.has(command)) {
cmd = database.commands.get(command);
} else if (database.aliases.has(command)) {
cmd = database.commands.get(database.aliases.get(command));
}
if (cmd) {
cmd.run(database, message, params);
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logkanal) logkanal.send(nixEmbed.setDescription(`${message.author} (\`${message.author.id}\`) kullanıcısı ${message.channel} (\`${message.channel.id}\`) kanalında \`${prefix}${cmd.conf.name}\` komutunu kullandı \nKomut İçeriği: \`${message.content}\` \n────────────────────────────────────────`))
}
});

// GUARD 1 \\

let guard1 = new Discord.Client({ fetchAllMembers: true });

guard1.on("ready", () => {
let botVoiceChannel = guard1.channels.cache.get(config.voiceChannel); 
if (botVoiceChannel) 
botVoiceChannel.join().then(e => { e.voice.setSelfDeaf(true);})
guard1.user.setPresence({ activity: { name: config.mainbots.game, type: config.mainbots.type }, status: config.mainbots.status })
setTimeout(() => {
guard1.user.setPresence({ activity: { name: config.mainbots.game, type: config.mainbots.type }, status: config.mainbots.status })
}, 1800000);
});

guard1.on("guildMemberAdd", async nix => {
let guilty = await nix.guild.fetchAuditLogs({ type: "BOT_ADD" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now()-guilty.createdTimestamp > 5000 || safe1(guilty.executor.id) || !guards.botAddGuard) return;
let logChannel = nix.guild.channels.cache.find(e => e.id === logs.guard1_log);
let kullanıcı = nix.guild.member(guilty.executor.id);
if (nix.user.bot == true) {
ytKapat(nix.guild.id);
if (kullanıcı.bannable) kullanıcı.ban({ reason: `${nix.user.username} | Nîx Bot Ekleme Koruması [Kullanıcı]` });
if (nix.bannable) nix.ban({ reason: `${kullanıcı.user.username} | Nîx Bot Ekleme Koruması [Bot]` });
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logChannel) {
logChannel.send(nixEmbed.setDescription(`**Bot Eklendi!** \n\n\`•\` **Botu Ekleyen Kullanıcı:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\`•\` **Eklenen Bot:** ${nix.user} \n\nBot ve botu ekleyen kullanıcı sunucudan ${kullanıcı.bannable ? "**başarıyla yasaklandı**" : "**yasaklanamadı**"}!`));
}
}
});

guard1.on("guildBanAdd", async (guild, nix) => {
let guilty = await guild.fetchAuditLogs({ type: "MEMBER_BAN_ADD" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now()-guilty.createdTimestamp > 5000 || safe1(guilty.executor.id) || !guards.banGuard) return;
let logChannel = guild.channels.cache.find(e => e.id === logs.guard1_log);
let kullanıcı = guild.member(guilty.executor.id);
ytKapat(guild.id);
if (kullanıcı.bannable) kullanıcı.ban({ reason: `${nix.username} | Nîx Sağ Tık Ban Koruması` });
guild.members.unban(nix.id, `${guilty.executor.username} Sağ Tık Ban Koruması`);
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logChannel) {
logChannel.send(nixEmbed.setDescription(`**Sağ Tık Ban Atıldı!** \n\n\`•\` **Sağ Tık Banlayan Yetkili:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\`•\` **Banlanan Kullanıcı:** ${nix.user} \n\nBanlanan kullanıcının banı açıldı ve sağ tık ban atan kullanıcı **başarıyla yasaklandı**!`));
}
});

guard1.on("guildMemberRemove", async nix => {
let guilty = await nix.guild.fetchAuditLogs({ type: "MEMBER_KICK" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now()-guilty.createdTimestamp > 5000 || safe1(guilty.executor.id) || !guards.kickGuard) return;
let logChannel = nix.guild.channels.cache.find(e => e.id === logs.guard1_log);
let kullanıcı = nix.guild.member(guilty.executor.id);
ytKapat(nix.guild.id);
if (kullanıcı.bannable) kullanıcı.ban({ reason: `${nix.user.username} | Nîx Sağ Tık Koruması` });
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logChannel) {
logChannel.send(nixEmbed.setDescription(`**Sağ Tık Kick Atıldı!** \n\n\`•\` **Sağ Tık Kickleyen Yetkili:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\`•\` **Kicklenen Kullanıcı:** ${nix.user} \n\nSağ tık kick atan kullanıcı sunucudan ${kullanıcı.bannable ? "**başarıyla yasaklandı**" : "**yasaklanamadı**"}!`));
}
});

guard1.on("guildMemberUpdate", async (eskinix, yeninix) => {
if (yeninix.roles.cache.size > eskinix.roles.cache.size) {
let guilty = await yeninix.guild.fetchAuditLogs({ type: "MEMBER_ROLE_UPDATE" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now()-guilty.createdTimestamp > 5000 || safe1(guilty.executor.id) || !guards.memberGuard) return;
let logChannel = yeninix.guild.channels.cache.find(e => e.id === logs.guard1_log);
let kullanıcı = yeninix.guild.member(guilty.executor.id);
if (perms.some(e => !eskinix.hasPermission(e) && yeninix.hasPermission(e))) {
if (kullanıcı.bannable) kullanıcı.ban({ reason: `Nîx Sağ Tık Rol Verme Koruması` });
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logChannel) {
logChannel.send(nixEmbed.setDescription(`**Sağ Tık Rol Verildi/Alındı!** \n\n\`•\` **Sağ Tık Rol Veren/Alan Kullanıcı:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\`•\` **Rol Verilen/Alınan Kullanıcı:** ${yeninix.user} (\`${yeninix.user.id}\`) \n\nSağ tık rol alıp/veren kullanıcı sunucudan ${kullanıcı.bannable ? "**başarıyla yasaklandı**" : "**yasaklanamadı**"}!`));
}
}
}
});

guard1.on("roleCreate", async nix => {
let guilty = await nix.guild.fetchAuditLogs({ type: "ROLE_CREATE" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now()-guilty.createdTimestamp > 5000 || safe1(guilty.executor.id) || !guards.roleGuard) return;
let logChannel = nix.guild.channels.cache.find(e => e.id === logs.guard1_log);
let kullanıcı = nix.guild.member(guilty.executor.id);
if (kullanıcı.manageable) kullanıcı.roles.cache.has(config.booster) ? kullanıcı.roles.set([config.booster, config.jail]) : kullanıcı.roles.set([config.jail])
nix.delete({ reason: `Nîx Rol Oluşturma Koruması` });
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logChannel) {
logChannel.send(nixEmbed.setDescription(`**Rol Oluşturuldu!** \n\n\`•\` **Rol Oluşturan Kullanıcı:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\n\`•\` **Oluşturulan Rol Bilgileri:** ${nix.name} (\`${nix.id}\`) \n\nRol oluşturan kullanıcı ${kullanıcı.manageable ? "**başarıyla cezalandırıldı**" : "**cezalandırılamadı**"}!`));
}
});

guard1.on("roleUpdate", async (eskinix, yeninix) => {
let guilty = await yeninix.guild.fetchAuditLogs({ type: "ROLE_UPDATE" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now()-guilty.createdTimestamp > 5000 || safe1(guilty.executor.id) || !guards.roleGuard) return;
let logChannel = yeninix.guild.channels.cache.find(e => e.id === logs.guard1_log);
let kullanıcı = yeninix.guild.member(guilty.executor.id);
ytKapat(yeninix.guild.id);
if (kullanıcı.manageable) kullanıcı.roles.cache.has(config.booster) ? kullanıcı.roles.set([config.booster, config.jail]) : kullanıcı.roles.set([config.jail])
if (perms.some(e => !eskinix.permissions.has(e) && yeninix.permissions.has(e))) {
yeninix.setPermissions(eskinix.permissions);
yeninix.guild.roles.cache.filter(e => !e.managed && (e.permissions.has("ADMINISTRATOR") || e.permissions.has("MANAGE_GUILD") || e.permissions.has("MANAGE_ROLES") || e.permissions.has("MANAGE_CHANNELS") || e.permissions.has("MANAGE_EMOJIS") || e.permissions.has("MANAGE_NICKNAMES") || e.permissions.has("MANAGE_WEBHOOKS"))).forEach(e => e.setPermissions(36818497));
};
yeninix.edit({
name: eskinix.name,
color: eskinix.hexColor,
hoist: eskinix.hoist,
permissions: eskinix.permissions,
mentionable: eskinix.mentionable
});
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logChannel) {
logChannel.sendnixEmbed.setDescription((`**Rol Güncellendi!** \n\n\`•\` **Rolü Güncelleyen Kullanıcı:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\`•\` **Güncellenen Rol:** \`${yeninix.name}\` (\`${yeninix.id}\`) \n\nRolü güncelleyen kullanıcı sunucudan ${kullanıcı.manageable ? "**başarıyla cezalandırıldı**" : "**cezalandırılamadı**"}!`));
}
});

guard1.on("roleDelete", async nix => {
let guilty = await nix.guild.fetchAuditLogs({ type: "ROLE_DELETE" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now()-guilty.createdTimestamp > 5000 || safe1(guilty.executor.id) || !guards.roleGuard) return;
let logChannel = nix.guild.channels.cache.find(e => e.id === logs.guard1_log);
let kullanıcı = nix.guild.member(guilty.executor.id);
if (kullanıcı.bannable) kullanıcı.ban({ reason: `Nîx Rol Silme Koruması` });
ytKapat(nix.guild.id);
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logChannel) {
logChannel.send(nixEmbed.setDescription(`**Rol Silindi!** \n\n\`•\` **Rolü Silen Kullanıcı:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\`•\` **Silinen Rol:** \`${nix.name}\` (\`${nix.id}\`) \n\nRolü silen kullanıcı sunucudan ${kullanıcı.bannable ? "**başarıyla yasaklandı**" : "**yasaklanamadı**"}!`));
}
});

// GUARD 2 \\

let guard2 = new Discord.Client({ fetchAllMembers: true });

guard2.on("ready", () => {
let botVoiceChannel = guard2.channels.cache.get(config.voiceChannel); 
if (botVoiceChannel) 
botVoiceChannel.join().then(e => { e.voice.setSelfDeaf(true);})
guard2.user.setPresence({ activity: { name: config.mainbots.game, type: config.mainbots.type }, status: config.mainbots.status })
setTimeout(() => {
guard2.user.setPresence({ activity: { name: config.mainbots.game, type: config.mainbots.type }, status: config.mainbots.status })
}, 1800000);
});

guard2.on("channelCreate", async channel => {
let guilty = await channel.guild.fetchAuditLogs({ type: "CHANNEL_CREATE" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now()-guilty.createdTimestamp > 5000 || safe1(guilty.executor.id) || !guards.channelGuard) return;
let logChannel = channel.guild.channels.cache.find(e => e.id === logs.guard2_log);
let kullanıcı = channel.guild.member(guilty.executor.id);
channel.delete({ reason: `Nîx Kanal Açma Koruması` });
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (kullanıcı.manageable) kullanıcı.roles.cache.has(config.booster) ? kullanıcı.roles.set([config.booster, config.jail]) : kullanıcı.roles.set([config.jail]);
if (logChannel) {
logChannel.send(nixEmbed.setDescription(`**Kanal Oluşturuldu!** \n\n\`•\` **Kanal Oluşturan Yetkili:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\`•\` **Açılan Kanal:** \`${channel.name}\` (\`${channel.id}\`) \n\nKanal oluşturan kullanıcı ${kullanıcı.manageable ? "**başarıyla cezalandırıldı**" : "**cezalandırılamadı**"}!`));
}
});

guard2.on("channelUpdate", async (oldChannel, newChannel) => {
let guilty = await newChannel.guild.fetchAuditLogs({ type: "CHANNEL_UPDATE" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now()-guilty.createdTimestamp > 5000 || safe1(guilty.executor.id) || !guards.channelGuard) return;
let logChannel = newChannel.guild.channels.cache.find(e => e.id === logs.guard2_log);
let kullanıcı = newChannel.guild.member(guilty.executor.id);
ytKapat(oldChannel.guild.id);
if (kullanıcı.bannable) kullanıcı.ban({ reason: "Nîx Kanal Güncelleme Koruması" });
if (newChannel.type !== "category" && newChannel.parentID !== oldChannel.parentID) newChannel.setParent(oldChannel.parentID);
if (newChannel.type === "category") {
newChannel.edit({
name: oldChannel.name
});
} else if (newChannel.type === "text") {
newChannel.edit({
name: oldChannel.name,
topic: oldChannel.topic,
nsfw: oldChannel.nsfw,
rateLimitPerUser: oldChannel.rateLimitPerUser
});
} else if (newChannel.type === "voice") {
newChannel.edit({
name: oldChannel.name,
bitrate: oldChannel.bitrate,
userLimit: oldChannel.userLimit
});
};
oldChannel.permissionOverwrites.forEach(e => {
let yeniPermler = {}
e.allow.toArray().forEach(r => {
yeniPermler[r] = true;
});
e.deny.toArray().forEach(r => {
yeniPermler[r] = false;
});
newChannel.createOverwrite(e.id, yeniPermler);
});
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logChannel) {
logChannel.send(nixEmbed.setDescription(`**Kanal Güncellendi!** \n\n\`•\` **Kanalı Güncelleyen Yetkili:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\`•\` **Güncellenen Kanal:** \`${newChannel.name}\` (\`${newChannel.id}\`) \n\nKanalı güncelleyen kullanıcı ${kullanıcı.bannable ? "**başarıyla yasaklandı**" : "**yasaklanamadı**"}!`));
}
});

guard2.on("channelDelete", async nix => {
let guilty = await nix.guild.fetchAuditLogs({ type: "CHANNEL_DELETE" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now()-guilty.createdTimestamp > 5000 || safe1(guilty.executor.id) || !guards.channelGuard) return;
let logChannel = nix.guild.channels.cache.find(e => e.id === logs.guard2_log);
let kullanıcı = nix.guild.member(guilty.executor.id);
ytKapat(nix.guild.id);
if (kullanıcı.bannable) kullanıcı.ban({ reason: "nix Kanal Silme Koruması" });
const newChannel = await channel.clone({ reason: "nix Kanal Silme Koruması"});
if(channel.tpye == "category") channel.children.forEach(x => x.setParent(newChannel.id))
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logChannel) {
logChannel.send(nixEmbed.setDescription(`**Kanal Silindi!** \n\n\`•\` **Kanalı Silen Yetkili:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\`•\` **Silinen Kanal:** \`${nix.name}\` (\`${nix.id}\`) \n\nKanalı silen kullanıcı ${kullanıcı.bannable ? "**başarıyla yasaklandı**" : "**yasaklanamadı**"}!`));
}
});

guard2.on("guildUpdate", async (eskinix, yeninix) => {
let guilty = await yeninix.fetchAuditLogs({ type: "GUILD_UPDATE" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now() - guilty.createdTimestamp > 10000 || safe1(guilty.executor.id) || !guards.urlGuard) return;
let logChannel = yeninix.channels.cache.find(e => e.id === logs.guard2_log);
let kullanıcı = yeninix.member(guilty.executor.id);
if (eskinix.vanityURLCode !== yeninix.vanityURLCode) {
if (kullanıcı.bannable) kullanıcı.ban({ reason: `nix Özel URL Koruması` });
const ayarlar = {
url: `https://discord.com/api/v6/guilds/${yeninix.id}/vanity-url`,
body: {
code: config.url
},
json: true,
method: "PATCH",
headers: {
"Authorization": `Bot ${loginkeys.guard1}`
}
};
request(ayarlar, (err, res, body) => {
if (err) return console.log(err);
});
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logChannel) {
logChannel.send(nixEmbed.setDescription(`**Özel URL Güncellendi!** \n\n\`•\` **URL'yi Güncelleyen Kullanıcı:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\`•\` **Eski URL:** \`${eskinix.vanityURLCode}\` \n\`•\` **Yeni URL:** \`${yeninix.vanityURLCode}\` \n\nURL'yi değiştiren kullanıcı sunucudan ${kullanıcı.bannable ? "**başarıyla yasaklandı**" : "**yasaklanamadı**"}!`));
}
};
});

// GUARD 3 \\

let guard3 = new Discord.Client({ fetchAllMembers: true });

guard1.on("ready", () => {
let botVoiceChannel = guard3.channels.cache.get(config.voiceChannel); 
if (botVoiceChannel) 
botVoiceChannel.join().then(e => { e.voice.setSelfDeaf(true);})
guard3.user.setPresence({ activity: { name: config.mainbots.game, type: config.mainbots.type }, status: config.mainbots.status })
setTimeout(() => {
guard3.user.setPresence({ activity: { name: config.mainbots.game, type: config.mainbots.type }, status: config.mainbots.status })
}, 1800000);
});

guard3.on("webhookUpdate", async nix => {
let guilty = await nix.guild.fetchAuditLogs({ type: "WEBHOOK_CREATE" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now()-guilty.createdTimestamp > 5000 || safe1(guilty.executor.id) || !guards.webHookGuard) return;
let logChannel = nix.guild.channels.cache.find(e => e.id === logs.guard3_log);
let kullanıcı = nix.guild.member(guilty.executor.id);
ytKapat(nix.guild.id);
if (kullanıcı.bannable) kullanıcı.ban({ reason: "nix Webhook Koruması" });
const webhooklar = await nix.fetchWebhooks();
await webhooklar.map(e => e.delete({ reason: `nix Webhook Koruması` }));
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logChannel) {
logChannel.send(nixEmbed.setDescription(`**Webhook Oluşturuldu!** \n\n\`•\` **Webhook Oluşturan Yetkili:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\`•\` **Webhook Oluşturulan Kanal:** ${nix} (\`${nix.id}\`) \n\nWebhook oluşturan kullanıcı ${kullanıcı.bannable ? "**başarıyla yasaklandı**" : "**yasaklanamadı**"}!`));
}
});

guard3.on("emojiCreate", async nix => {
let guilty = await nix.guild.fetchAuditLogs({ type: "EMOJI_CREATE" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now()-guilty.createdTimestamp > 5000 || safe1(guilty.executor.id) || !guards.emojiGuard) return;
let logChannel = nix.guild.channels.cache.find(e => e.id === logs.guard3_log);
let kullanıcı = nix.guild.member(guilty.executor.id)
if (kullanıcı.manageable) kullanıcı.roles.cache.has(config.booster) ? kullanıcı.roles.set([config.booster, config.jail]) : kullanıcı.roles.set([config.jail])
nix.delete({ reason: "nix Emoji Yükleme Koruması" });
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logChannel) {
logChannel.send(nixEmbed.setDescription(`**Emoji Oluşturuldu!** \n\n\`•\` **Emoji Oluşturan Yetkili:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\`•\` **Oluşturulan Emoji:** \`${nix.name}\` (\`${nix.id}\`) \n\nEmojiyi yükleyen kullanıcı ${kullanıcı.manageable ? "**başarıyla cezalandırıldı**" : "**cezalandırılamadı**"}!`))
}
});

guard3.on("emojiUpdate", async (eskinix, yeninix) => {
let guilty = await yeninix.guild.fetchAuditLogs({ type: "EMOJI_UPDATE" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now()-guilty.createdTimestamp > 5000 || safe1(guilty.executor.id) || !guards.emojiGuard) return;
let logChannel = yeninix.guild.channels.cache.find(e => e.id === logs.guard3_log);
let kullanıcı = yeninix.guild.member(guilty.executor.id)
if (kullanıcı.manageable) kullanıcı.roles.cache.has(config.booster) ? kullanıcı.roles.set([config.booster, config.jail]) : kullanıcı.roles.set([config.jail])
if (yeninix.name !== eskinix.name) yeninix.setName(eskinix.name);
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logChannel) {
logChannel.send(nixEmbed.setDescription(`**Emoji Güncellendi!** \n\n\`•\` **Emoji Oluşturan Yetkili:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\`•\` **Emojinin Eski Adı:** \`${eskinix.name}\` \n\`•\` **Emojinin Yeni Adı:** \`${yeninix.name}\` \n\`•\` **Emojinin ID'si:** \`${yeninix.id}\` \n\nEmojiyi güncelleyen kullanıcı ${kullanıcı.manageable ? "**başarıyla cezalandırıldı**" : "**cezalandırılamadı**"}!`));
}
});

guard3.on("emojiDelete", async nix => {
let guilty = await nix.guild.fetchAuditLogs({ type: "EMOJI_DELETE" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now()-guilty.createdTimestamp > 5000 || safe1(guilty.executor.id) || !guards.emojiGuard) return;
let logChannel = nix.guild.channels.cache.find(e => e.id === logs.guard3_log);
let kullanıcı = nix.guild.member(guilty.executor.id)
if (kullanıcı.manageable) kullanıcı.roles.cache.has(config.booster) ? kullanıcı.roles.set([config.booster, config.jail]) : kullanıcı.roles.set([config.jail])
nix.guild.emojis.create(nix.url, nix.name);
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logChannel) {
logChannel.send(nixEmbed.setDescription(`**Emoji Silindi!** \n\n\`•\` **Emoji Silen Yetkili:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\`•\` **Silinen Emoji:** \`${nix.name}\` (\`${nix.id}\`) \n\nEmojiyi silen kullanıcı ${kullanıcı.manageable ? "**başarıyla cezalandırıldı**" : "**cezalandırılamadı**"}!`));
}
});

guard3.on("guildUpdate", async (eskinix, yeninix) => {
let guilty = await yeninix.fetchAuditLogs({ type: "GUILD_UPDATE" }).then(e => e.entries.first());
if (!guilty || !guilty.executor || Date.now()-guilty.createdTimestamp > 5000 || safe1(guilty.executor.id) || !guards.serverGuard) return;
let logChannel = yeninix.guild.channels.cache.find(e => e.id === logs.guard3_log);
let kullanıcı = yeninix.guild.member(guilty.executor.id);
if (kullanıcı.bannable) kullanıcı.ban({ reason: `Nîx Sunucu Güncelleme Koruması` });
if (yeninix.name !== eskinix.name) yeninix.setName(eskinix.name);
if (yeninix.iconURL({ dynamic: true }) !== eskinix.iconURL({ dynamic: true })) yeninix.setIcon(eskinix.iconURL({ dynamic: true }));
if (yeninix.afkChannel !== eskinix.afkChannel) yeninix.setAFKChannel(eskinix.afkChannel);
if (yeninix.banner !== eskinix.banner) yeninix.setBanner(eskinix.bannerURL);
if (yeninix.region !== eskinix.region) yeninix.setRegion(eskinix.region);
let nixEmbed = new Discord.MessageEmbed().setFooter(config.footer, database.guilds.cache.get(config.guildID).iconURL({ dynamic: true })).setColor("RANDOM").setTimestamp();
if (logChannel) {
logChannel.send(nixEmbed.setDescription(`**Sunucu Güncellendi!** \n\n\`•\` **Sunucuyu Güncelleyen Kişi:** ${guilty.executor} (\`${guilty.executor.id}\`) \n\nSunucuyu güncelleyen kullanıcı ${kullanıcı.bannable ? "**başarıyla yasaklandı**" : "**yasaklanamadı**"}!`));
}
});

// FONKSİYONLAR

function safe1(kullanıcıID) {
let üye = database.guilds.cache.get(config.guildID).members.cache.get(kullanıcıID);
let guvenliler = whitelist1.güvenliliste || [];
if (!üye || üye.id === database.user.id || config.owner.some(e => üye.id === e) || üye.id === üye.guild.owner.id || guvenliler.some(e => üye.id === e.slice(1) || üye.roles.cache.has(e.slice(1)))) return true
else return false;
};

function ytKapat(sunucuID) {
let sunucu = database.guilds.cache.get(sunucuID);
if (!sunucu) return;
sunucu.roles.cache.filter(e => e.editable && (e.permissions.has("ADMINISTRATOR") || e.permissions.has("MANAGE_CHANNELS") || e.permissions.has("MANAGE_EMOJIS") || e.permissions.has("MANAGE_GUILD") || e.permissions.has("MANAGE_ROLES") || e.permissions.has("MANAGE_WEBHOOKS") || e.permissions.has("MENTION_EVERYONE") || e.permissions.has("BAN_MEMBERS") || e.permissions.has("KICK_MEMBERS"))).forEach(async r => {
await r.setPermissions(0);
});
let logKanal = database.channels.cache.get(logs.database_log);
if (logKanal) {
logKanal.send(`Şüpheli işlem tespit edildiği için sunucudaki bütün **Yönetici** yetkileri kapatıldı! @everyone`);
}
};

function rolBackup() {
let guild = database.guilds.cache.get(config.guildID);
let logChannel = database.channels.cache.get(logs.database_log);
if (guild) {
guild.roles.cache.filter(e => e.name !== "@everyone" && !e.managed).forEach(rol => {
let roleChannelOverwrites = [];
guild.channels.cache.filter(e => e.permissionOverwrites.has(rol.id)).forEach(e => {
let kanalPerm = e.permissionOverwrites.get(rol.id);
let pushla = { id: e.id, allow: kanalPerm.allow.toArray(), deny: kanalPerm.deny.toArray() };
roleChannelOverwrites.push(pushla);
});

RoleDatabase.findOne({ guildID: config.guildID, rolID: rol.id }, async (err, rolKayit) => {
if (!rolKayit) {
let newRolSchema = new RoleDatabase({
_id: new mongoose.Types.ObjectId(),
guildID: config.guildID,
roleID: rol.id,
name: rol.name,
color: rol.hexColor,
hoist: rol.hoist,
position: rol.position,
permissions: rol.permissions,
mentionable: rol.mentionable,
time: Date.now(),
members: rol.members.map(m => m.id),
channelOverwrites: roleChannelOverwrites
});
newRolSchema.save();
} else {
rolKayit.name = rol.name;
rolKayit.color = rol.hexColor;
rolKayit.hoist = rol.hoist;
rolKayit.position = rol.position;
rolKayit.permissions = rol.permissions;
rolKayit.mentionable = rol.mentionable;
rolKayit.time = Date.now();
rolKayit.members = rol.members.map(m => m.id);
rolKayit.channelOverwrites = roleChannelOverwrites;
rolKayit.save();
};
});
});

RoleDatabase.find({ guildID: config.guildID }).sort().exec((err, rol) => {
rol.filter(e => !guild.roles.cache.has(e.roleID) && Date.now()-e.time > 1000*60*60*24*3).forEach(r => {
RoleDatabase.findOneAndDelete({roleID: r.roleID});
});
});
console.log(`[DATABASE] Güvenlik amaçlı rollerin yedekleri alındı.`);
if (logChannel) logChannel.send(`${database.emojis.cache.get(config.emojis.onay)} Güvenlik amaçlı rollerin yedekleri alındı.`);
};
};

function channelBackup() {
let guild = database.guilds.cache.get(config.guildID);
let logChannel = database.channels.cache.get(logs.database_log);
if (guild) {
guild.channels.cache.filter(kanal => kanal.deleted !== true).forEach(channel => {
let permissionss = {};
let sayi = Number(0);
channel.permissionOverwrites.forEach((perm) => {
let thisPermOverwrites = {};
perm.allow.toArray().forEach(p => {
thisPermOverwrites[p] = true;
});
perm.deny.toArray().forEach(p => {
thisPermOverwrites[p] = false;
});
permissionss[sayi] = {permission: perm.id == null ? guild.id : perm.id, thisPermOverwrites};
sayi++;
});

ChannelDatabase.findOne({guildID: config.guildID, channelID: channel.id}, async (err, savedChannel) => {
if (!savedChannel) {
if(channel.type === "voice"){
let newChannelSchema = new ChannelDatabase({
_id: new mongoose.Types.ObjectId(),
guildID: config.guildID,
channelID: channel.id,
name: channel.name,
parentID: channel.parentID,
position: channel.position,
time: Date.now(),
type: channel.type,
permissionOverwrites: permissionss,
userLimit: channel.userLimit,
bitrate: channel.bitrate
});
newChannelSchema.save();
} else if (channel.type === "category") {
let newChannelSchema = new ChannelDatabase({
_id: new mongoose.Types.ObjectId(),
guildID: config.guildID,
channelID: channel.id,
name: channel.name,
position: channel.position,
time: Date.now(),
type: channel.type,
permissionOverwrites: permissionss,
});
newChannelSchema.save();
} else {
let newChannelSchema = new ChannelDatabase({
_id: new mongoose.Types.ObjectId(),
guildID: config.guildID,
channelID: channel.id,
name: channel.name,
parentID: channel.parentID,
position: channel.position,
time: Date.now(),
nsfw: channel.nsfw,
rateLimitPerUser: channel.rateLimitPerUser,
type: channel.type,
topic: channel.topic ? channel.topic : "Bu kanal Backup botu tarafından kurtarıldı!",
permissionOverwrites: permissionss,
});
newChannelSchema.save();
}
} else {
if(channel.type === "voice"){
savedChannel.name = channel.name;
savedChannel.parentID = channel.parentID;
savedChannel.position = channel.position;
savedChannel.type = channel.type;
savedChannel.time = Date.now();
savedChannel.permissionOverwrites = permissionss;
savedChannel.userLimit = channel.userLimit;
savedChannel.bitrate = channel.bitrate;
savedChannel.save();
}else if(channel.type === "category"){
savedChannel.name = channel.name;
savedChannel.position = channel.position;
savedChannel.type = channel.type;
savedChannel.time = Date.now();
savedChannel.permissionOverwrites = permissionss;
savedChannel.save();
}else {
savedChannel.name = channel.name;
savedChannel.parentID = channel.parentID;
savedChannel.position = channel.position;
savedChannel.nsfw = channel.nsfw;
savedChannel.rateLimitPerUser = channel.rateLimitPerUser;
savedChannel.type = channel.type;
savedChannel.time = Date.now();
savedChannel.topic = channel.topic ? channel.topic : "Bu kanal Backup botu tarafından kurtarıldı!";
savedChannel.permissionOverwrites = permissionss;
savedChannel.save();
}
};
});
});

ChannelDatabase.find({guildID: config.guildID}).sort().exec((err, channels) => {
channels.filter(r => !guild.channels.cache.has(r.channelID) && Date.now()-r.time > 1000*60*60*24).forEach(r => {
ChannelDatabase.findOneAndDelete({channelID: r.channelID});
});
});
console.log(`[DATABASE] Güvenlik amaçlı kanalların yedekleri alındı.`);
if (logChannel) logChannel.send(`${database.emojis.cache.get(config.emojis.onay)} Güvenlik amaçlı kanalların yedekleri alındı.`);
};
};

// LOGIN

database.login(loginkeys.database).then(e => console.log(`[DATABASE] ${database.user.username} başarıyla aktif edildi!`)).catch(err => console.error(`[DATABASE] Bir Hata Oluştu! Hata: ${err}`));
guard1.login(loginkeys.guard1).then(e => console.log(`[DEFENDER 1] ${guard1.user.username} başarıyla aktif edildi!`)).catch(err => console.error(`[DEFENDER 1] Bir Hata Oluştu! Hata: ${err}`));
guard2.login(loginkeys.guard2).then(e => console.log(`[DEFENDER 2] ${guard2.user.username} başarıyla aktif edildi!`)).catch(err => console.error(`[DEFENDER 2] Bir Hata Oluştu! Hata: ${err}`));
guard3.login(loginkeys.guard3).then(e => console.log(`[DEFENDER 3] ${guard3.user.username} başarıyla aktif edildi!`)).catch(err => console.error(`[DEFENDER 3] Bir Hata Oluştu! Hata: ${err}`));
