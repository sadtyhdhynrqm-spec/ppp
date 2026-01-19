const fs = require("fs");
const axios = require("axios");
const path = require("path");

const config = {
    name: "help",
    _name: {
        "ar_SY": "اوامر"
    },
    aliases: ["cmds", "commands"],
    version: "1.0.3",
    description: "Show all commands or command details",
    usage: "[command] (optional)",
    credits: "ᏕᎥᏁᎨᎧ"
};

const langData = {
    "en_US": {
        "help.list": "{list}\n\n⇒ Total: {total} commands\n⇒ Use {syntax}[command] to get more information about a command.",
        "help.commandNotExists": "Command {command} does not exists.",
        "help.commandDetails": `
⇒ Name: {name}
⇒ Aliases: {aliases}
⇒ Version: {version}
⇒ Description: {description}
⇒ Usage: {usage}
⇒ Permissions: {permissions}
⇒ Category: {category}
⇒ Cooldown: {cooldown}
⇒ Credits: {credits}
        `,
        "0": "Member",
        "1": "Group Admin",
        "2": "Bot Admin"
    },
    "ar_SY": {
        "help.list": "{list}\n\n⇒ المجموع: {total} الاوامر\n⇒ استخدم {syntax}[امر] لمزيد من المعلومات.",
        "help.commandNotExists": "الامر {command} غير موجود.",
        "help.commandDetails": `
⇒ الاسم: {name}
⇒ الاسماء: {aliases}
⇒ الاصدار: {version}
⇒ الوصف: {description}
⇒ الاستعمال: {usage}
⇒ الصلاحيات: {permissions}
⇒ الفئة: {category}
⇒ وقت الانتظار: {cooldown}
⇒ الحقوق: {credits}
        `,
        "0": "عضو",
        "1": "ادمن مجموعة",
        "2": "ادمن بوت"
    }
};

// تحميل الصورة (مرة واحدة)
async function downloadImage(url, filePath) {
    if (fs.existsSync(filePath)) return;
    const res = await axios.get(url, { responseType: "stream" });
    await new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(filePath);
        res.data.pipe(stream);
        stream.on("finish", resolve);
        stream.on("error", reject);
    });
}

// تحويل alias للاسم الحقيقي
function getCommandName(name) {
    const aliases = global.plugins?.commandsAliases;
    if (!aliases) return name;

    if (aliases.has(name)) return name;
    for (const [cmd, list] of aliases.entries()) {
        if (Array.isArray(list) && list.includes(name)) return cmd;
    }
    return null;
}

async function onCall({ message, args, getLang, userPermissions, prefix }) {
    const commandsConfig = global.plugins?.commandsConfig;
    if (!commandsConfig) return;

    const commandName = args[0]?.toLowerCase();

    const imageUrl = "https://i.ibb.co/xt75p0yk/1768714709999.jpg";
    const cacheDir = path.join(process.cwd(), "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const imagePath = path.join(cacheDir, "help.jpg");
    await downloadImage(imageUrl, imagePath);

    // ===============================
    // عرض قائمة الاوامر
    // ===============================
    if (!commandName) {
        const language =
            message.thread?.data?.language ||
            global.config?.LANGUAGE ||
            "en_US";

        let commands = {};

        for (const [key, value] of commandsConfig.entries()) {
            if (value.isHidden) continue;
            if (value.isAbsolute && !global.config?.ABSOLUTES?.includes(message.senderID)) continue;

            const perms = value.permissions || [0, 1, 2];
            if (!perms.some(p => userPermissions.includes(p))) continue;

            if (!commands[value.category]) commands[value.category] = [];
            commands[value.category].push(
                value._name?.[language] || key
            );
        }

        const list = Object.keys(commands)
            .map(cat => `⌈ ${cat.toUpperCase()} ⌋\n${commands[cat].join(" ▣ ")}`)
            .join("\n\n");

        return message.reply({
            body: getLang("help.list", {
                list,
                total: Object.values(commands).flat().length,
                syntax: prefix
            }),
            attachment: fs.createReadStream(imagePath)
        });
    }

    // ===============================
    // عرض تفاصيل امر
    // ===============================
    const realName = getCommandName(commandName);
    const command = commandsConfig.get(realName);

    if (!command)
        return message.reply(
            getLang("help.commandNotExists", { command: commandName })
        );

    const perms = command.permissions || [0, 1, 2];
    if (
        command.isHidden ||
        (command.isAbsolute && !global.config?.ABSOLUTES?.includes(message.senderID)) ||
        !perms.some(p => userPermissions.includes(p))
    ) {
        return message.reply(
            getLang("help.commandNotExists", { command: commandName })
        );
    }

    return message.reply({
        body: getLang("help.commandDetails", {
            name: command.name,
            aliases: (command.aliases || []).join(" ▣ "),
            version: command.version || "1.0.0",
            description: command.description || "",
            usage: `${prefix}${commandName} ${command.usage || ""}`,
            permissions: perms.map(p => getLang(String(p))).join(" ▣ "),
            category: command.category || "General",
            cooldown: command.cooldown || 3,
            credits: command.credits || ""
        }).replace(/^ +/gm, ""),
        attachment: fs.createReadStream(imagePath)
    });
}

export default {
    config,
    langData,
    onCall
};
