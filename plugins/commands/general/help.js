const config = {
    name: "help",
    _name: {
        "ar_SY": "اوامر"
    },
    aliases: ["cmds", "commands"],
    version: "1.0.3",
    description: "Help command with cover image",
    usage: "[reply]",
    credits: "ᏕᎥᏁᎨᎧ"
};

const langData = {
    "en_US": {
        "help.list": "{list}\n\n⇒ Total: {total} commands",
        "0": "Member",
        "1": "Group Admin",
        "2": "Bot Admin"
    },
    "ar_SY": {
        "help.list": "{list}\n\n⇒ المجموع: {total} أمر",
        "0": "عضو",
        "1": "إدارة المجموعة",
        "2": "إدارة البوت"
    }
};

// تخزين رسائل الساتر
global.helpCoverMessages = new Set();

async function onCall({ message, args, getLang, userPermissions, prefix }) {
    const { commandsConfig } = global.plugins;
    const image = "https://i.ibb.co/xt75p0yk/1768714709999.jpg";

    /* ===============================
       1️⃣ لو ما في رد → أرسل ساتر فقط
    =============================== */
    if (!message.messageReply) {
        return message.reply(
            { attachment: image },
            (err, info) => {
                if (!err && info?.messageID) {
                    global.helpCoverMessages.add(info.messageID);
                }
            }
        );
    }

    /* ===============================
       2️⃣ لازم يكون رد على صورة الساتر
    =============================== */
    if (!global.helpCoverMessages.has(message.messageReply.messageID)) return;

    let commands = {};
    const language = data?.thread?.data?.language || global.config.LANGUAGE || "ar_SY";

    for (const [key, value] of commandsConfig.entries()) {
        if (value.isHidden) continue;

        if (!value.permissions) value.permissions = [0, 1, 2];
        if (!value.permissions.some(p => userPermissions.includes(p))) continue;

        if (!commands[value.category]) commands[value.category] = [];
        commands[value.category].push(
            value._name?.[language] || key
        );
    }

    const list = Object.keys(commands)
        .map(cat => `⌈ ${cat.toUpperCase()} ⌋\n${commands[cat].join(" ▣ ")}`)
        .join("\n\n");

    /* ===============================
       3️⃣ إرسال الصورة + القائمة تحتها
    =============================== */
    return message.reply({
        attachment: image,
        body: getLang("help.list", {
            list,
            total: Object.values(commands).reduce((a, b) => a + b.length, 0)
        })
    });
}

export default {
    config,
    langData,
    onCall
};
