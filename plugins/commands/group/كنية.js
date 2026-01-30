export const config = {
    name: "كنية",
    version: "0.0.2-xaviaBot-port",
    permissions: [1, 2], // أدمن فقط
    credits: "Mirai Team",
    description: "تغيير كنية عضو في المجموعة",
    usage: "كنية <الاسم> (بالرد أو المنشن)",
    cooldowns: 3
};

export async function onCall({ message, args }) {
    const nickname = args.join(" ");
    if (!nickname) return message.reply("✖️ اكتب الكنية الجديدة");

    let targetID;

    // 1️⃣ لو في رد على رسالة
    if (message.type === "message_reply") {
        targetID = message.messageReply.senderID;
    }
    // 2️⃣ لو في منشن
    else if (Object.keys(message.mentions).length > 0) {
        targetID = Object.keys(message.mentions)[0];
    }
    // 3️⃣ لو ما في رد ولا منشن (غيّر كنيتك إنت)
    else {
        targetID = message.senderID;
    }

    try {
        await global.api.changeNickname(
            nickname,
            message.threadID,
            targetID
        );
        message.reply("✅ تم تغيير الكنية بنجاح");
    } catch (err) {
        message.reply("❌ حصل خطأ، تأكد إنو البوت أدمن");
    }
}
