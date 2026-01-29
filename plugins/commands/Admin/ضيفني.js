const config = {
    name: "ضيفني",
    description: "إضافة المطور إلى القروبات",
    usage: "ضيفني",
    cooldown: 5,
    permissions: [2],
    credits: "Mustapha",
};

const langData = {
    ar_SY: {
        notDev: "❌ يا زول الأمر دا للمطور بس",
        noGroups: "⚠️ ما في قروبات متاحة هسع",
        listHeader: "⌈  💠القروبات الموجودة 💠⌋\n\n",
        replyHint: "\n✦ أرسل رقم القروب الداير تدخلوا",
        invalidNumber: "❌ الرقم دا ما صاح",
        addedGroup: "✅ المطور دخل القروب ✌️🔥",
        addedPrivate: "✔️ تمام، دخلناك قروب:\n{name}",
        failedAdd: "⚠️ ما قدرنا نضيفك (يمكن إنت موجود أصلاً)",
    },
};

const DEVELOPER_ID = "61586897962846";

// 🧠 تخزين مؤقت لاختيار القروب
const pendingAdd = new Map();

async function onCall({ message, getLang }) {
    try {
        const { senderID, threadID, args, reply } = message;

        if (senderID !== DEVELOPER_ID)
            return reply(getLang("notDev"));

        // 🟢 المرحلة الثانية: المستخدم أرسل رقم
        if (args.length === 2 && pendingAdd.has(senderID)) {
            const index = Number(args[1]) - 1;
            const groups = pendingAdd.get(senderID);
            const group = groups[index];

            if (!group)
                return reply(getLang("invalidNumber"));

            try {
                await global.api.addUserToGroup(
                    DEVELOPER_ID,
                    group.threadID
                );

                global.api.sendMessage(
                    getLang("addedGroup"),
                    group.threadID
                );

                reply(
                    getLang("addedPrivate", { name: group.name })
                );

            } catch {
                reply(getLang("failedAdd"));
            }

            pendingAdd.delete(senderID);
            return;
        }

        // 🟡 المرحلة الأولى: عرض القروبات
        const threads = await global.api.getThreadList(50, null, ["INBOX"]);
        const groups = threads.filter(t => t.isGroup);

        if (!groups.length)
            return reply(getLang("noGroups"));

        pendingAdd.set(senderID, groups);

        let msg = getLang("listHeader");
        groups.forEach((g, i) => {
            msg += `${i + 1}. 💠 ${g.name}\n`;
        });
        msg += getLang("replyHint");

        reply(msg);

        // ⏳ حذف الطلب بعد دقيقة
        setTimeout(() => {
            pendingAdd.delete(senderID);
        }, 60_000);

    } catch (e) {
        console.error("AddMe error:", e);
    }
}

export default {
    config,
    langData,
    onCall,
};
