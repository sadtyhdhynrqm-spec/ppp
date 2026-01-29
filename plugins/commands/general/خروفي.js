/**
 * @تحسين وتطوير: ᎠᎯᏁᎢᎬᏚᎮᎯᏒᎠᎯ
 * @النسخة: V7.0.0 [ULTRA]
 * @الوصف: تحويل عضو إلى خروف 🐑 بصورة ترفيهية
 */

import axios from "axios";
import Jimp from "jimp";
import fs from "fs";
import path from "path";

const config = {
    name: "خروفي",
    description: "رد أو منشن شخص لتحويله إلى خروفك 🐑",
    usage: "خروفي @منشن | رد",
    cooldown: 5,
    permissions: [0],
    credits: "Gry KJ",
};

const langData = {
    ar_SY: {
        needTarget: "❌ لازم ترد على شخص أو تعمله منشن 🐑",
        done: "🐑 مبروك! بقيت خروف رسمي 😂",
        error: "❌ حصل خطأ أثناء تنفيذ أمر خروفي",
    },
};

async function onCall({ message, event, usersData, getLang }) {
    try {
        const { threadID, messageReply, mentions, senderID } = event;

        if (!messageReply && Object.keys(mentions).length === 0) {
            return global.api.sendMessage(
                getLang("needTarget"),
                threadID
            );
        }

        const targetID =
            messageReply?.senderID || Object.keys(mentions)[0];

        // الخلفية
        const background = await Jimp.read(
            "https://i.ibb.co/YThmPKSR/h2-Qh6-Jd-Wqf.jpg"
        );

        // صور الأعضاء
        const senderAvatar = await usersData.getAvatarUrl(senderID);
        const targetAvatar = await usersData.getAvatarUrl(targetID);

        const imageSender = await Jimp.read(senderAvatar);
        const imageTarget = await Jimp.read(targetAvatar);

        imageSender.resize(190, 190).circle();
        imageTarget.resize(190, 190).circle();

        background.composite(imageSender, 150, 200);
        background.composite(imageTarget, 170, 430);

        const imgPath = path.join(
            process.cwd(),
            "cache",
            `sheep_${Date.now()}.jpg`
        );

        await background.writeAsync(imgPath);

        return global.api.sendMessage(
            {
                body: getLang("done"),
                attachment: fs.createReadStream(imgPath),
            },
            threadID,
            () => fs.unlinkSync(imgPath)
        );

    } catch (e) {
        console.error("Sheep command error:", e);
        return global.api.sendMessage(
            getLang("error"),
            event.threadID
        );
    }
}

export default {
    config,
    langData,
    onCall,
};
