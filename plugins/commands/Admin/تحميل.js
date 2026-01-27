import fs from "fs-extra";
import path from "path";

const config = {
    name: "تحميل",
    aliases: ["تغير", "تعديل"],
    description: "إعادة تحميل الأوامر",
    usage: "[تحميل/لود] [اسم_الأمر]",
    cooldown: 5,
    credits: "ᏕᎥᏁᎨᎧ",
};

const langData = {
    ar_SY: {
        usage: "❌ | الاستخدام: تحميل [تحميل/اك] [اسم_الأمر]",
        missingName: "❌ | اكتب اسم الأمر",
        loadSuccess: '✅ | تم تحميل "{name}.js" بنجاح',
        loadError: "❌ | حدث خطأ في تحميل {name}\n\n{error}",
        loadAllSuccess: "✅ | تم تحميل {count} أمر بنجاح",
        loadAllFail:
            "❌ | فشل تحميل {count} أمر:\n{list}",
        unknown:
            "❌ | استخدم: تحميل [اسم_الأمر] أو لود لتحميل جميع الأوامر",
        invalidCommand: "❌ | خطأ في صياغة الأمر",
        notFound: "❌ | ليس هناك أمر بأسم {name}.js",
    },
};

async function onCall({ message, args, api, getLang }) {
    try {
        const commandsPath = __dirname;
        const allCommands = global.commands || new Map();

        const loadCommand = (filename) => {
            try {
                const cmdPath = path.join(commandsPath, `${filename}.js`);

                if (!fs.existsSync(cmdPath)) {
                    throw new Error(
                        getLang("notFound", { name: filename })
                    );
                }

                delete require.cache[require.resolve(cmdPath)];

                const command = require(cmdPath);

                if (!command.config || !command.onCall) {
                    throw new Error(getLang("invalidCommand"));
                }

                const cmdName = command.config.name;

                // حذف الأسماء المستعارة القديمة
                if (
                    command.config.aliases &&
                    Array.isArray(command.config.aliases)
                ) {
                    for (const alias of command.config.aliases) {
                        global.aliases?.delete(alias);
                    }
                }

                // إضافة الأمر
                allCommands.set(cmdName, command);
                global.commands = allCommands;

                // إضافة الأسماء المستعارة الجديدة
                if (
                    command.config.aliases &&
                    Array.isArray(command.config.aliases)
                ) {
                    if (!global.aliases) global.aliases = new Map();
                    for (const alias of command.config.aliases) {
                        global.aliases.set(alias, cmdName);
                    }
                }

                // onLoad
                if (command.onLoad) {
                    try {
                        command.onLoad({ api });
                    } catch (e) {
                        console.error(
                            `onLoad error (${cmdName}):`,
                            e
                        );
                    }
                }

                return { status: "success", name: filename };
            } catch (e) {
                return { status: "failed", name: filename, error: e };
            }
        };

        // لا يوجد معاملات
        if (!args[0]) return message.reply(getLang("usage"));

        // تحميل أمر واحد
        if (args[0] === "تحميل") {
            if (!args[1])
                return message.reply(getLang("missingName"));

            const result = loadCommand(args[1]);

            if (result.status === "success") {
                return message.reply(
                    getLang("loadSuccess", { name: result.name })
                );
            } else {
                const err =
                    result.error?.stack
                        ?.split("\n")
                        .slice(0, 3)
                        .join("\n") ||
                    result.error.message;

                return message.reply(
                    getLang("loadError", {
                        name: result.name,
                        error: err,
                    })
                );
            }
        }

        // تحميل جميع الأوامر
        if (args[0] === "لود") {
            const files = fs
                .readdirSync(commandsPath)
                .filter(
                    (f) => f.endsWith(".js") && f !== "كمند.js"
                )
                .map((f) => f.replace(".js", ""));

            const success = [];
            const fail = [];

            for (const cmd of files) {
                const res = loadCommand(cmd);
                if (res.status === "success") {
                    success.push(cmd);
                } else {
                    fail.push(
                        `${cmd}: ${res.error.message}`
                    );
                }
            }

            let msg = getLang("loadAllSuccess", {
                count: success.length,
            });

            if (fail.length > 0) {
                msg +=
                    "\n\n" +
                    getLang("loadAllFail", {
                        count: fail.length,
                        list: fail.join("\n"),
                    });
            }

            return message.reply(msg);
        }

        return message.reply(getLang("unknown"));
    } catch (e) {
        console.error("Command error:", e);
        message.reply("❌ | حدث خطأ غير متوقع");
    }
}

export default {
    config,
    langData,
    onCall,
};
