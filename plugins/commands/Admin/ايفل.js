import axios from "axios";
import fs from "fs-extra";

const config = {
    name: "ايفل",
    aliases: ["ev"],
    description: "تنفيذ كود JavaScript",
    usage: "eval <code>",
    cooldown: 0,
    permissions: [2],
    credits: "Gry KJ",
};

const langData = {
    ar_SY: {
        missingCode: "❌ | أدخل كود JavaScript للتنفيذ",
        evalError: "❌ | خطأ أثناء التنفيذ:\n{error}",
        unknownError: "❌ | حدث خطأ غير متوقع",
    },
};

// ===== أدوات مساعدة =====
function mapToObj(map) {
    const obj = {};
    map.forEach((v, k) => (obj[k] = v));
    return obj;
}

function formatOutput(msg) {
    if (
        typeof msg === "number" ||
        typeof msg === "boolean" ||
        typeof msg === "function"
    ) {
        return msg.toString();
    }

    if (msg instanceof Map) {
        return `Map(${msg.size}) ` + JSON.stringify(mapToObj(msg), null, 2);
    }

    if (typeof msg === "object") {
        return JSON.stringify(msg, null, 2);
    }

    if (typeof msg === "undefined") {
        return "undefined";
    }

    return msg;
}

// ===== الأمر =====
async function onCall({ message, args, getLang }) {
    try {
        if (!args[0]) return message.reply(getLang("missingCode"));

        // دالة إخراج
        function output(msg) {
            message.reply(formatOutput(msg));
        }

        const code = args.join(" ");

        const execCode = `
        (async () => {
            try {
                ${code}
            } catch (err) {
                message.reply(
                    "${getLang("evalError", { error: "${err.message}" })}"
                );
            }
        })();
        `;

        eval(execCode);
    } catch (err) {
        console.error("Eval command error:", err);
        message.reply(getLang("unknownError"));
    }
}

export default {
    config,
    langData,
    onCall,
};
