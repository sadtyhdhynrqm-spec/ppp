import axios from "axios";
import fs from "fs";
import path from "path";

const config = {
    name: "كنيات",
    description: "تغيير كنيات جميع أعضاء القروب",
    usage: "كنيات <النمط>",
    cooldown: 10,
    permissions: [1],
    credits: "وسكي سان",
};

const langData = {
    ar_SY: {
        notGroup: "❌ هذا الأمر يعمل داخل المجموعات فقط",
        notAdmin: "⛔ هذا الأمر يتطلب صلاحيات أدمن",
        missingTemplate:
            "❌ يرجى كتابة نمط الكنية\n\nمثال:\nكنيات ✧ الاسم ✧ 🔥╿مواطن╿",
        start:
            "⏳ جاري تغيير كنيات {count} عضو...\n\n📝 النمط:\n{template}",
        done:
            "✅ اكتملت العملية\n\n✔️ نجح: {success}\n❌ فشل: {fail}",
        error: "❌ حدث خطأ، تأكد أن البوت مشرف",
    },
};

async function onCall({ message, getLang, data }) {
    try {
        if (!message || !message.isGroup)
            return message.reply(getLang("notGroup"));

        const { threadID, senderID, args, reply } = message;

        const template = args.join(" ");
        if (!template) return reply(getLang("missingTemplate"));

        const threadInfo = data?.thread?.info;
        if (!threadInfo) return reply(getLang("error"));

        const { adminIDs, participantIDs } = threadInfo;

        // استخراج IDs الأدمن بشكل صحيح
        const adminIdList = adminIDs.map((a) => a.id);

        // تحقق من صلاحيات البوت
        if (!adminIdList.includes(global.botID))
            return reply(getLang("error"));

        // تحقق من صلاحيات المستخدم
        if (!adminIdList.includes(senderID))
            return reply(getLang("notAdmin"));

        reply(
            getLang("start", {
                count: participantIDs.length,
                template,
            })
        );

        let success = 0;
        let fail = 0;

        for (const uid of participantIDs) {
            try {
                const info = await global.api.getUserInfo(uid);
                const name = info[uid]?.name || "عضو";
                const gender = info[uid]?.gender;

                const role = gender === 1 ? "جندية" : "جندي";

                const nickname = template
                    .replace(/الاسم/g, name)
                    .replace(/مواطن/g, role);

                await global.api.changeNickname(
                    nickname,
                    threadID,
                    uid
                );

                success++;
                await new Promise((r) => setTimeout(r, 500));
            } catch (e) {
                fail++;
            }
        }

        reply(
            getLang("done", {
                success,
                fail,
            })
        );
    } catch (e) {
        console.error("Nickname error:", e);
        if (message?.reply)
            message.reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall,
};
