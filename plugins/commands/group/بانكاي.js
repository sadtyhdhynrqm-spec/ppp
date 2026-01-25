import axios from "axios";
import fs from "fs";
import path from "path";

const config = {
    name: "بانكاي",
    description: "kick user",
    usage: "[reply/@mention]",
    cooldown: 5,
    permissions: [1],
    credits: "XaviaTeam",
};

const langData = {
    ar_SY: {
        missingTarget: "يرجى منشن العضو أو الرد على رسالته للطرد",
        botNotAdmin: "يجب أن يكون البوت مشرفًا لطرد المستخدم",
        botTarget: "لماذا تريد طرد البوت من المجموعة؟",
        senderTarget: "لماذا تريد طرد نفسك من المجموعة؟",
        botAndSenderTarget: "لماذا تريد طرد البوت ونفسك من المجموعة؟",
        kickResult: "تم طرد {success} مستخدم",
        kickFail: "فشل طرد {fail} مستخدم",
        error: "حدث خطأ، حاول مرة أخرى لاحقًا",
    },
};

// رابط الصورة
const KICK_IMAGE =
    "https://i.ibb.co/PJK2n1N/Messenger-creation-2-DBBF1-E2-3696-464-A-BA72-D62-B034-DA8-F1.jpg";

// ===== إرسال الصورة =====
async function sendKickImage(threadID) {
    try {
        const imgPath = path.join(process.cwd(), "kick_tmp.jpg");

        const res = await axios.get(KICK_IMAGE, {
            responseType: "arraybuffer",
        });

        fs.writeFileSync(imgPath, Buffer.from(res.data));

        await new Promise((resolve) => {
            global.api.sendMessage(
                { attachment: fs.createReadStream(imgPath) },
                threadID,
                () => resolve()
            );
        });

        fs.unlinkSync(imgPath);
    } catch (e) {
        console.error("Send image error:", e);
    }
}

async function onCall({ message, getLang, data }) {
    try {
        if (!message || !message.isGroup) return;

        const {
            threadID,
            mentions = {},
            senderID,
            messageReply,
            type,
            reply,
        } = message;

        // ===== التحقق من الهدف =====
        if (Object.keys(mentions).length === 0 && type !== "message_reply")
            return reply(getLang("missingTarget"));

        const threadInfo = data?.thread?.info;
        if (!threadInfo || !Array.isArray(threadInfo.adminIDs))
            return reply(getLang("error"));

        const { adminIDs } = threadInfo;

        const targetIDs =
            Object.keys(mentions).length > 0
                ? Object.keys(mentions)
                : messageReply?.senderID
                ? [messageReply.senderID]
                : [];

        if (targetIDs.length === 0)
            return reply(getLang("missingTarget"));

        // ===== تحقق من صلاحيات البوت =====
        if (!adminIDs.includes(global.botID))
            return reply(getLang("botNotAdmin"));

        // ===== حالات المنع =====
        if (targetIDs.includes(global.botID))
            return reply(getLang("botTarget"));

        if (targetIDs.includes(senderID))
            return reply(getLang("senderTarget"));

        let success = 0;
        let fail = 0;

        // 🔥 أرسل الصورة أولاً
        await sendKickImage(threadID);

        // ⛔ الطرد بالطريقة الأصلية المتوافقة
        for (const uid of targetIDs) {
            global.api.removeUserFromGroup(uid, threadID, (err) => {
                if (err) {
                    console.error("Kick error:", err);
                    fail++;
                } else {
                    success++;
                }
            });
        }

        // ⏳ انتظر شوية عشان الفيس ينفّذ
        setTimeout(() => {
            if (success > 0)
                reply(getLang("kickResult", { success }));
            if (fail > 0)
                reply(getLang("kickFail", { fail }));
        }, 1500);
    } catch (e) {
        console.error("Command error:", e);
        if (message?.reply)
            message.reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall,
};
