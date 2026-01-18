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
}

const langData = {
    "en_US": {
        "help.commandNotExists": "Command {command} does not exist."
    },
    "ar_SY": {
        "help.commandNotExists": "امر {command} غير موجود."
    }
}

// تحويل اسم الأمر في حالة كان alias
function getCommandName(commandName) {
    if (global.plugins.commandsAliases.has(commandName)) return commandName;
    for (let [key, value] of global.plugins.commandsAliases) {
        if (value.includes(commandName)) return key;
    }
    return null;
}

async function onCall({ message, args, userPermissions }) {
    const { commandsConfig } = global.plugins;
    const commandName = args[0]?.toLowerCase();

    // هنا الرابط للصورة الجاهزة مسبقًا التي تحتوي على كل الأوامر
    const helpImage = "https://i.ibb.co/PJK2n1N/Messenger-creation-2-DBBF1-E2-3696-464-A-BA72-D62-B034-DA8-F1.jpg";

    if (!commandName) {
        // إرسال الصورة فقط للقائمة الكاملة
        message.reply({ attachment: [helpImage] });
    } else {
        const command = commandsConfig.get(getCommandName(commandName, commandsConfig));
        if (!command) return message.reply(langData["ar_SY"]["help.commandNotExists"].replace("{command}", commandName));

        // إرسال صورة واحدة تحتوي تفاصيل الأمر (يمكنك تصميم صورة لكل أمر لو حبيت)
        message.reply({ attachment: [helpImage] });
    }
}

export default {
    config,
    langData,
    onCall
        }
