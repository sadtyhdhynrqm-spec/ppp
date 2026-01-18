import axios from "axios";

const config = {
    name: "help",
    _name: {
        ar_SY: "اوامر"
    },
    aliases: ["cmds", "commands"],
    version: "1.0.3",
    description: "Show all commands or command details",
    usage: "[command] (optional)",
    credits: "ᏕᎥᏁᎨᎧ"
};

const langData = {
    en_US: {
        "help.list": "{list}\n\n⇒ Total: {total} commands\n⇒ Use {syntax} [command] to get more information about a command.",
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
    ar_SY: {
        "help.list": "{list}\n\n⇒ المجموع: {total} الاوامر\n⇒ يستخدم {syntax} [امر] لمزيد من المعلومات حول الأمر.",
        "help.commandNotExists": "امر {command} غير موجود.",
        "help.commandDetails": `
⇒ اسم: {name}
⇒ اسم مستعار: {aliases}
⇒ وصف: {description}
⇒ استعمال: {usage}
⇒ الصلاحيات: {permissions}
⇒ فئة: {category}
⇒ وقت الانتظار: {cooldown}
⇒ الاعتمادات: {credits}
        `,
        "0": "عضو",
        "1": "إدارة المجموعة",
        "2": "ادارة البوت"
    }
};

function getCommandName(commandName) {
    const aliasesMap = global.plugins?.commandsAliases;
    if (!aliasesMap) return null;

    if (aliasesMap.has(commandName)) return commandName;
    for (const [key, value] of aliasesMap) {
        if (value.includes(commandName)) return key;
    }
    return null;
}

async function Gif() {
    const gifs = [
        "https://i.imgur.com/3tBIaSF.gif",
        "https://i.imgur.com/vWl3Tb5.gif",
        "https://i.imgur.com/DYfouuR.gif"
    ];
    const gif = gifs[Math.floor(Math.random() * gifs.length)];
    const res = await axios.get(gif, { responseType: "stream" });
    return res.data;
}

async function onCall({ message, args, getLang, userPermissions, prefix, data }) {
    const { commandsConfig } = global.plugins;
    const commandName = args[0]?.toLowerCase();

    const language =
        data?.thread?.data?.language ||
        global.config?.LANGUAGE ||
        "en_US";

    if (!commandName) {
        let commands = {};

        for (const [key, value] of commandsConfig.entries()) {
            if (value.isHidden) continue;

            if (
                value.isAbsolute &&
                !global.config?.ABSOLUTES?.includes(message.senderID)
            ) continue;

            value.permissions ??= [0, 1, 2];
            if (!value.permissions.some(p => userPermissions.includes(p))) continue;

            commands[value.category] ??= [];
            commands[value.category].push(
                value._name?.[language] || key
            );
        }

        const list = Object.keys(commands)
            .map(cat =>
                `⌈ ${cat.toUpperCase()} ⌋\n${commands[cat].join(" ▣ ")}`
            )
            .join("\n\n");

        return message.reply({
            attachment: await Gif(),
            body: getLang("help.list", {
                total: Object.values(commands)
                    .map(e => e.length)
                    .reduce((a, b) => a + b, 0),
                list,
                syntax: prefix
            })
        });
    }

    const realName = getCommandName(commandName);
    const command = commandsConfig.get(realName);

    if (!command)
        return message.reply(
            getLang("help.commandNotExists", { command: commandName })
        );

    command.permissions ??= [0, 1, 2];

    const isUserValid = command.isAbsolute
        ? global.config?.ABSOLUTES?.includes(message.senderID)
        : true;

    const isPermissionValid = command.permissions.some(p =>
        userPermissions.includes(p)
    );

    if (command.isHidden || !isUserValid || !isPermissionValid)
        return message.reply(
            getLang("help.commandNotExists", { command: commandName })
        );

    return message.reply({
        attachment: await Gif(),
        body: getLang("help.commandDetails", {
            name: command.name,
            aliases: command.aliases.join(" ▣ "),
            version: command.version || "1.0.0",
            description: command.description || "",
            usage: `${prefix}${commandName} ${command.usage || ""}`,
            permissions: command.permissions
                .map(p => getLang(String(p)))
                .join(" ▣ "),
            category: command.category,
            cooldown: command.cooldown || 3,
            credits: command.credits || ""
        }).replace(/^ +/gm, "")
    });
}

export default {
    config,
    langData,
    onCall
};
