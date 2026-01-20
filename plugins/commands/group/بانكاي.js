import fs from "fs";
import path from "path";
import axios from "axios";

const config = {
    name: "بانكاي",
    description: "kick user",
    usage: "[reply/@mention]",
    cooldown: 5,
    permissions: [1],
    credits: "ᏕᎥᏁᎨᎧ",
};

const langData = {
    en_US: {
        missingTarget: "Please tag or reply message of user to kick",
        botNotAdmin: "Bot need to be admin to kick user",
        botTarget: "Why do you want to kick bot out of group :<?",
        senderTarget: "Why do you want to kick yourself out of group :v?",
        botAndSenderTarget: "Why do you want to kick bot and yourself out of group :v?",
        kickResult: "Kicked {success} user(s)",
        kickFail: "Failed to kick {fail} user(s)",
        error: "An error occurred, please try again later",
    },
    ar_SY: {
        missingTarget: "تاق منشى 🗿🔨",
        botNotAdmin: "ارفع ادمن اولا  ꪔ̤̱",
        botTarget: "لماذا تريد طرد البوت من المجموعة :<?",
        senderTarget: "لماذا تريد طرد نفسك من المجموعة :v?",
        botAndSenderTarget: "قاعد في بيتكم 🗿🔨",
        kickResult: "تم طرد {success} مستخدم",
        kickFail: "فشل ركل {fail} مستخدم",
        error: "لقد حدث خطأ، رجاء أعد المحاولة لاحقا",
    },
};

function kick(userID, threadID) {
    return new Promise((resolve, reject) => {
        global.api.removeUserFromGroup(userID, threadID, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

async function onCall({ message, getLang, data }) {
    if (!message.isGroup) return;
    const { threadID, mentions, senderID, messageReply, type, reply } = message;

    try {
        if (Object.keys(mentions).length == 0 && type != "message_reply")
            return reply(getLang("missingTarget"));

        const threadInfo = data.thread.info;
        const { adminIDs } = threadInfo;

        const targetIDs =
            Object.keys(mentions).length > 0
                ? Object.keys(mentions)
                : [messageReply.senderID];

        if (!adminIDs.some((e) => e == global.botID))
            return reply(getLang("botNotAdmin"));
        if (targetIDs.length == 1 && targetIDs[0] == global.botID)
            return reply(getLang("botTarget"));
        if (targetIDs.length == 1 && targetIDs[0] == senderID)
            return reply(getLang("senderTarget"));
        if (
            targetIDs.length == 2 &&
            targetIDs.includes(global.botID) &&
            targetIDs.includes(senderID)
        )
            return reply(getLang("botAndSenderTarget"));

        let success = 0,
            fail = 0;

        // 🔥 تحميل الصورة وإرسالها مباشرة كـ Buffer
        const imageUrl = "https://i.ibb.co/cS6SjxcB/1768628585933.jpg";
        const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
        const buffer = Buffer.from(res.data, "binary");

        await global.api.sendMessage(
            { body: "🚫 سيتم طرد العضو", attachment: buffer },
            threadID
        );

        // طرد الأعضاء مباشرة بعد إرسال الصورة
        for (const targetID of targetIDs) {
            if (targetID == global.botID || targetID == senderID) continue;
            try {
                await kick(targetID, threadID);
                await global.utils.sleep(500);
                success++;
            } catch (e) {
                console.error(e);
                fail++;
            }
        }

        await reply(getLang("kickResult", { success }));
        if (fail > 0) await reply(getLang("kickFail", { fail }));
    } catch (e) {
        console.error(e);
        reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall,
};
