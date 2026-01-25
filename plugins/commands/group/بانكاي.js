const config = {
    name: "بانكاي",
    description: "kick user",
    usage: "[reply/@mention]",
    cooldown: 5,
    permissions: [1],
    credits: "ᏕᎥᏁᎨᎧ",
};

const langData = {
    ar_SY: {
        missingTarget: "⚠️ اعمل تاق أو رد على شخص",
        botNotAdmin: "❌ لازم أكون ادمن",
        kickResult: "✅ تم طرد {success} مستخدم",
        kickFail: "❌ فشل طرد {fail} مستخدم",
        error: "⚠️ حصل خطأ أثناء التنفيذ",
    },
};

function kick(userID, threadID) {
    return new Promise((resolve, reject) => {
        global.api.removeUserFromGroup(userID, threadID, (err) => {
            if (err) return reject(err);
            resolve(true);
        });
    });
}

async function onCall({ message, getLang }) {
    if (!message.isGroup) return;

    const { threadID, mentions, senderID, messageReply, type, reply } = message;

    try {
        // 🔹 تحديد الهدف
        let targetID = null;

        if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
        } else if (type === "message_reply") {
            targetID = messageReply.senderID;
        }

        if (!targetID)
            return reply(getLang("missingTarget"));

        if (targetID === global.botID || targetID === senderID)
            return reply(getLang("missingTarget"));

        // 🔹 جلب معلومات القروب
        const threadInfo = await global.api.getThreadInfo(threadID);

        const adminIDs = threadInfo.adminIDs.map(e => e.id);

        if (!adminIDs.includes(global.botID))
            return reply(getLang("botNotAdmin"));

        // 📸 رسالة قبل الطرد
        await reply({
            body: "⚠️ تم اتخاذ قرار الطرد",
            attachment: await global.utils.getStreamFromURL(
                "https://i.ibb.co/wZDHSMvM/received-897009799489398.jpg"
            ),
        });

        // 🔥 الطرد
        await kick(targetID, threadID);

        await reply(getLang("kickResult", { success: 1 }));

    } catch (err) {
        console.error("BAN_KAI ERROR:", err);
        reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall,
};
