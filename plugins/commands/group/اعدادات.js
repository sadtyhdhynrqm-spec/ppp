const config = {
    name: "اعدادات",
    aliases: ["setting"],
    description: "إعدادات حماية المجموعة",
    cooldown: 3,
    permissions: [1],
    credits: "ᏕᎥᏁᎨᎧ",
};

const langData = {
    ar_SY: {
        menu:
`╭━〔 🛡 إعدادات المجموعة 🛡 〕━╮
① [{antiSpam}] مكافحة السبام
② [{antiOut}] منع الخروج
③ [{antiChangeGroupName}] حماية اسم المجموعة
④ [{antiChangeGroupImage}] حماية صورة المجموعة
⑤ [{antiChangeNickname}] حماية الكنيات
⑥ [{notifyChange}] إشعارات الأحداث
╰━━━━━━━━━━━━━━━━━╯
↫ رد بالأرقام لتغيير الإعدادات`,

        notGroup: "هذا الأمر يعمل داخل المجموعات فقط",
        invalid: "اختيار غير صالح",
        success: "تم حفظ الإعدادات",
        botNotAdmin: "البوت ليس مشرفاً، تم تعطيل بعض الحمايات",

        confirm:
`╭━〔 ⚙️ تأكيد الإعدادات 〕━ـ╮
① [{antiSpam}] مكافحة السبام
② [{antiOut}] منع الخروج
③ [{antiChangeGroupName}] حماية الاسم
④ [{antiChangeGroupImage}] حماية الصورة
⑤ [{antiChangeNickname}] حماية الكنيات
⑥ [{notifyChange}] إشعارات
╰━━━━━━━━━━━━━━━━╯
  تفاعل بي  👍 للحفظ`,
    },
};

async function confirmChange({ message, getLang, eventData }) {
    if (message.reaction !== "👍") return;

    await global.controllers.Threads.updateData(message.threadID, {
        antiSettings: eventData.newSettings,
    });

    message.send(getLang("success"));
}

async function chooseMenu({ message, getLang, data }) {
    const nums = message.args.map(Number).filter(n => n >= 1 && n <= 6);
    if (!nums.length) return message.reply(getLang("invalid"));

    const current = data.thread.data?.antiSettings || {};
    const keys = [
        "antiSpam",
        "antiOut",
        "antiChangeGroupName",
        "antiChangeGroupImage",
        "antiChangeNickname",
        "notifyChange",
    ];

    const newSettings = {};
    for (const k of keys) newSettings[k] = !!current[k];

    for (const n of nums) {
        const key = keys[n - 1];
        newSettings[key] = !newSettings[key];
    }

    const isBotAdmin = data.thread.info.adminIDs.includes(global.botID);
    if (!isBotAdmin) {
        newSettings.antiOut = false;
        newSettings.antiSpam = false;
        await message.reply(getLang("botNotAdmin"));
    }

    const view = {};
    for (const k of keys) view[k] = newSettings[k] ? "✅" : "❌";

    const msg = await message.reply(getLang("confirm", view));
    msg.addReactEvent({ callback: confirmChange, newSettings });
}

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
        "notifyChange",
    ]) show[k] = settings[k] ? "✅" : "❌";

    const msg = await message.reply(getLang("menu", show));
    msg.addReplyEvent({ callback: chooseMenu });
}

export default {
    config,
    langData,
    onCall,
};
