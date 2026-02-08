import { join } from "path";

const config = {
    name: "دخول",
    description: "ارسال رسالة ترحيب نصية عند دخول عضو جديد",
    usage: "[help]",
    cooldown: 3,
    permissions: [1, 2],
    credits: "ᏕᎥᏁᎨᎧ"
};

const langData = {
    "en_US": {
        "help": "Usage: welcome [help]\nThis module sends a text welcome message to new members.",
        "success": "Welcome module activated!",
        "noText": "No welcome message set for this group."
    },
    "ar_SY": {
        "help": "إستعمال: welcome [help]\nهذا الملف يرسل رسالة ترحيب نصية للأعضاء الجدد.",
        "success": "تم تفعيل الترحيب النصي!",
        "noText": "لم يتم تعيين رسالة ترحيب لهذه المجموعة."
    }
};

// ---- تعيين رسالة الانضمام ----
function ensureDir() {    
    if (!global.utils.isExists(join(global.pluginsPath, "events", "subscribeGifs"), "dir")) {
        global.createDir(join(global.pluginsPath, "events", "subscribeGifs"));
    }
}

// ---- حذف أي GIF قديم ----
function deleteThreadGif(threadID) {
    try {
        const gifPath = `${global.mainPath}/plugins/events/subscribeGifs/${threadID}.gif`;
        if (global.isExists(gifPath)) global.deleteFile(gifPath);
    } catch (e) {
        console.error(e);
    }
}

// ---- الحدث عند تعيين الرسالة النصية ----
async function onCall({ message, getLang, args, data }) {
    if (!message.isGroup) return;
    const { messageReply, threadID, reply } = message;
    const { Threads } = global.controllers;

    try {
        ensureDir();

        if (args[0] === "help") return reply(getLang("help"));

        if (args[0] === "del" || args[0] === "delete") {
            await Threads.updateData(threadID, { joinMessage: null });
            await deleteThreadGif(threadID);
            return reply("تم حذف رسالة الترحيب بنجاح!");
        }

        const joinMessage = args.join(" ") || messageReply?.body;
        if (!joinMessage) return reply("الرجاء إدخال نص رسالة الترحيب!");

        await Threads.updateData(threadID, { joinMessage });
        await deleteThreadGif(threadID); // نتأكد من حذف أي GIF
        return reply("تم تعيين رسالة الترحيب بنجاح!");
    } catch (e) {
        console.error(e);
        return reply("حدث خطأ، حاول مرة أخرى!");
    }
}

// ---- الحدث عند دخول عضو جديد ----
async function onEvent({ api, event }) {
    try {
        if (!event.isGroup || !event.addedParticipants) return;
        const { Threads } = global.controllers;
        const threadID = event.threadID;
        const threadData = await Threads.getData(threadID);
        const joinMessage = threadData.joinMessage;

        if (!joinMessage) return; // لا توجد رسالة محددة

        for (const user of event.addedParticipants) {
            const userName = user.name || "عضو جديد";
            const finalMessage = joinMessage
                .replace("{members}", userName)
                .replace("{threadName}", threadData.name)
                .replace("{newCount}", (threadData.participantIDs || []).length);

            api.sendMessage(finalMessage, threadID);
        }
    } catch (e) {
        console.error(e);
    }
}

export default {
    config,
    langData,
    onCall,
    onEvent
};
