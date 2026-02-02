const config = {
    name: "اعدادات",
    aliases: ["setting"],
    description: "🛡 إعدادات وحماية المجموعة",
    cooldown: 3,
    permissions: [1],
    credits: "ᏕᎥᏁᎨᎧ",
};

/* ===== رسائل التحذير (القديمة بدون تعديل) ===== */
const warnings = {
    antiSpam: "﹝سبام﹞: ممنوع السبام، التكرار قد يؤدي للطرد",
    antiOut: " ﹝خروج﹞: ماشي وين يا عب يا عب بل بس هنا ",
    antiChangeGroupName: "﹝مجموعة﹞: يمنع تغيير اسم المجموعة",
    antiChangeGroupImage: "﹝تحذير﹞: يمنع تغيير صورة المجموعة",
    antiChangeNickname: "تغير الكنيات غير مسموح به ﹝كنيات﹞",
};

/* ===== لغة القوائم ===== */
const langData = {
    ar_SY: {
        menu:
`╭━〔 🛡 إعدادات المجموعة 🛡 〕━╮

① [{antiSpam}] ✦ مكافحة السبام
② [{antiOut}] ✦ منع الخروج
③ [{antiChangeGroupName}] ✦ حماية اسم المجموعة
④ [{antiChangeGroupImage}] ✦ حماية صورة المجموعة
⑤ [{antiChangeNickname}] ✦ حماية الكُنى

╰━━━━━━━━━━━━━━━━━━━━╯
↫ رد بالأرقام للتغيير`,

        confirm:
`╭━━〔 ⚙️ تأكيد الإعدادات 〕━━╮

① [{antiSpam}] مكافحة السبام
② [{antiOut}] منع الخروج
③ [{antiChangeGroupName}] حماية الاسم
④ [{antiChangeGroupImage}] حماية الصورة
⑤ [{antiChangeNickname}] حماية الكنية

╰━━━━━━━━━━━━━━╯
👍 اضغط للحفظ`,

        notGroup: "❌ الأمر يعمل داخل المجموعات فقط",
        invalid: "❌ اختيار غير صالح",
        success: "✅ تم حفظ الإعدادات",
        botNotAdmin:
            "⚠️ البوت ليس مشرفاً، تم تعطيل بعض الحمايات",
    },
};

/* ===== دالة تحذير مضمونة ===== */
async function sendWarning(api, threadID, key) {
    const msg = warnings[key];
    if (!msg) return;
    await api.sendMessage(msg, threadID);
}

/* ===== حفظ الإعدادات ===== */
async function confirmChange({ message, getLang, eventData }) {
    if (message.reaction !== "👍") return;

    await global.controllers.Threads.updateData(message.threadID, {
        antiSettings: eventData.newSettings,
    });

    await message.send(getLang("success"));
}

/* ===== اختيار القائمة ===== */
async function chooseMenu({ message, getLang, data }) {
    const choices = message.args.map(Number).filter(n => n >= 1 && n <= 5);
    if (!choices.length) return message.reply(getLang("invalid"));

    const current = data.thread.data?.antiSettings || {};
    const keys = [
        "antiSpam",
        "antiOut",
        "antiChangeGroupName",
        "antiChangeGroupImage",
        "antiChangeNickname",
    ];

    const newSettings = {};
    for (const k of keys) newSettings[k] = !!current[k];

    for (const c of choices) {
        const key = keys[c - 1];
        newSettings[key] = !newSettings[key];
    }

    const isBotAdmin = data.thread.info.adminIDs.includes(global.botID);
    if (!isBotAdmin) {
        newSettings.antiOut = false;
        newSettings.antiChangeGroupName = false;
        newSettings.antiChangeGroupImage = false;
        await message.reply(getLang("botNotAdmin"));
    }

    const show = {};
    for (const k of keys)
        show[k] = newSettings[k] ? "✅" : "❌";

    const msg = await message.reply(getLang("confirm", show));
    msg.addReactEvent({ callback: confirmChange, newSettings });
}

/* ===== أمر الإعدادات ===== */
async function onCall({ message, getLang, data }) {
    if (!data.thread?.info?.isGroup)
        return message.reply(getLang("notGroup"));

    const settings = data.thread.data?.antiSettings || {};
    const show = {};
    for (const k of [
        "antiSpam",
        "antiOut",
        "antiChangeGroupName",
        "antiChangeGroupImage",
        "antiChangeNickname",
    ]) {
        show[k] = settings[k] ? "✅" : "❌";
    }

    const msg = await message.reply(getLang("menu", show));
    msg.addReplyEvent({ callback: chooseMenu });
}

/* ===== الحمايات (مضمونة التحذير) ===== */
async function onEvent({ event, api, Threads }) {
    const { threadID, logMessageType, logMessageData, author } = event;
    if (!threadID) return;

    const threadData = await Threads.getData(threadID);
    const settings = threadData.data?.antiSettings || {};

    /* تغيير الكنية */
    if (logMessageType === "log:thread-nickname" && settings.antiChangeNickname) {
        const oldNick = logMessageData?.oldNickname;
        const userID = logMessageData?.participant_id;
        if (oldNick && userID) {
            await api.changeNickname(oldNick, threadID, userID);
            await sendWarning(api, threadID, "antiChangeNickname");
        }
    }

    /* تغيير اسم المجموعة */
    if (logMessageType === "log:thread-name" && settings.antiChangeGroupName) {
        await api.setTitle(logMessageData.oldName, threadID);
        await sendWarning(api, threadID, "antiChangeGroupName");
    }

    /* تغيير صورة المجموعة */
    if (logMessageType === "log:thread-image" && settings.antiChangeGroupImage) {
        await api.changeGroupImage(logMessageData.oldImage, threadID);
        await sendWarning(api, threadID, "antiChangeGroupImage");
    }

    /* الخروج */
    if (logMessageType === "log:unsubscribe" && settings.antiOut) {
        await api.addUserToGroup(author, threadID);
        await sendWarning(api, threadID, "antiOut");
    }
}

export default {
    config,
    langData,
    onCall,
    onEvent,
};
