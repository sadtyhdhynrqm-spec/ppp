/**
 * @تحسين وتطوير: ᎠᎯᏁᎢᎬᏚᎮᎯᏒᎠᎯ
 * @النسخة: V7.0.0 [ULTRA - FIXED]
 * @الوصف: تحويل عضو إلى خروف 🐑 بصورة ترفيهية
 */

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

// ✅ دالة قص الصورة بشكل دائري (بديل circle)
async function makeCircle(image) {
    const size = Math.min(image.bitmap.width, image.bitmap.height);

    const mask = await new Jimp(size, size, 0x00000000);
    mask.scan(0, 0, size, size, function (x, y, idx) {
        const r = size / 2;
        const dx = x - r;
        const dy = y - r;
        if (dx * dx + dy * dy <= r * r) {
            this.bitmap.data[idx + 3] = 255;
        }
    });

    image.resize(size, size);
    image.mask(mask, 0, 0);
    return image;
}

async function onCall({ message, getLang, usersData }) {
    const { senderID, messageReply, mentions, reply } = message;

    try {
        // ✅ لازم رد أو منشن
        if (!messageReply && Object.keys(mentions).length === 0) {
            return reply(getLang("needTarget"));
        }

        const targetID =
            messageReply?.senderID || Object.keys(mentions)[0];

        // إنشاء مجلد cache لو ما موجود
        const cacheDir = path.join(process.cwd(), "cache");
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }

        // الخلفية
        const background = await Jimp.read(
            "https://i.ibb.co/YThmPKSR/h2-Qh6-Jd-Wqf.jpg"
        );

        // صور الأعضاء
        const senderAvatar = await usersData.getAvatarUrl(senderID);
        const targetAvatar = await usersData.getAvatarUrl(targetID);

        const imageSender = await Jimp.read(senderAvatar);
        const imageTarget = await Jimp.read(targetAvatar);

        await makeCircle(imageSender.resize(190, 190));
        await makeCircle(imageTarget.resize(190, 190));

        // دمج الصور
        background.composite(imageSender, 150, 200);
        background.composite(imageTarget, 170, 430);

        const imgPath = path.join(
            cacheDir,
            `sheep_${Date.now()}.jpg`
        );

        await background.writeAsync(imgPath);

        await reply({
            body: getLang("done"),
            attachment: fs.createReadStream(imgPath),
        });

        // تنظيف
        setTimeout(() => {
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }, 5000);

    } catch (e) {
        console.error("Sheep command error:", e);
        reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall,
};
