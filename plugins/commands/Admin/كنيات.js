import axios from "axios";
import fs from "fs";
import path from "path";

const config = {
    name: "كنيات",
    description: "تعيين كنية موحدة لـ 250 عضو مع استبدال كلمة اسم بالاسم الأول",
    usage: "كنيات <النمط>",
    cooldown: 20,
    permissions: [2],
    credits: "Gemini",
};

const langData = {
    ar_SY: {
        notGroup: "❌ هذا الأمر يعمل داخل المجموعات فقط",
        notOwner: "⚠️ عذراً، هذا الأمر مخصص لمطور البوت فقط.",
        missingTemplate:
            "⚠️ يرجى كتابة التنسيق المطلوب مع كلمة (اسم)\n\nمثال:\nكنيات 『 「✽」 اسم ↩ نينجا ⁰ 』",
        start:
            "⏳ جاري بدء العملية لـ {count} عضو...\n⚠️ سوان يا مظه ",
        done:
            "✅ اكتملت العملية!\n\n✔️ تم تغيير: {success}\n📝 التنسيق:\n{template}",
        error: "❌ حدث خطأ في النظام",
    },
};

async function onCall({ message, getLang }) {
    try {
        if (!message || !message.isGroup)
            return message.reply(getLang("notGroup"));

        const { threadID, senderID, args, reply } = message;

        const OWNER_ID = "61586897962846";
        if (senderID !== OWNER_ID)
            return reply(getLang("notOwner"));

        // ✅ إزالة اسم الأمر فقط (أول كلمة)
        const template = args.slice(1).join(" ");

        if (!template || !template.includes("اسم"))
            return reply(getLang("missingTemplate"));

        // ✅ جلب معلومات المجموعة
        const threadInfo = await global.api.getThreadInfo(threadID);
        if (!threadInfo || !threadInfo.participantIDs)
            return reply(getLang("error"));

        const userIDs = threadInfo.participantIDs.slice(0, 250);

        reply(
            getLang("start", {
                count: userIDs.length,
            })
        );

        let success = 0;

        for (const uid of userIDs) {
            try {
                const info = await global.api.getUserInfo(uid);
                const fullName = info[uid]?.name || "عضو";
                const firstName = fullName.split(" ")[0];

                // ✅ استبدال كلمة (اسم) باسم العضو
                const nickname = template.replace(
                    /[\(\[\{\<\«『「]*اسم[\)\}\]\>\»』」]*/g,
                    firstName
                );

                await global.api.changeNickname(
                    nickname,
                    threadID,
                    uid
                );

                success++;
                await new Promise((r) => setTimeout(r, 1500));
            } catch (e) {
                // تجاهل الخطأ الفردي (عضو ما بيتغير أو البوت ما عنده صلاحية)
            }
        }

        reply(
            getLang("done", {
                success,
                template,
            })
        );
    } catch (e) {
        console.error("Nickname error:", e);
        message.reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall,
};
