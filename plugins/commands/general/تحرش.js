import Jimp from "jimp";
import fs from "fs";
import path from "path";

const config = {
    name: "تحرش",
    description: "إنشاء صورة تحرش بينك وبين شخص آخر مع أنماط مختلفة",
    usage: "تحرش <النمط> (بالرد أو منشن الشخص)",
    cooldown: 10,
    permissions: [0],
    credits: "Modified by You",
};

const langData = {
    ar_SY: {
        noTarget: "❌ رد على شخص أو منشنه أولاً.",
        processing: "⏳ جاري تجهيز الصورة...",
        done: "🚀 الصورة جاهزة:",
        invalidStyle: "❌ النمط غير موجود، استخدم: كرتوني | مضحك | اسود_ابيض",
        error: "❌ حدث خطأ أثناء تجهيز الصورة.",
    },
};

// تحميل الصورة
async function downloadImage(url) {
    return await Jimp.read(url);
}

// إنشاء صورة التحرش
async function createSlapImage(targetUrl, userUrl, style) {
    const image1 = await downloadImage(targetUrl);
    const image2 = await downloadImage(userUrl);

    image1.cover(720, 720);
    image2.cover(720, 720);

    const background = new Jimp(1440, 720, 0xffffffff);
    background.composite(image1, 0, 0);
    background.composite(image2, 720, 0);

    switch (style) {
        case "كرتوني":
            background.posterize(6).blur(1);
            break;
        case "مضحك":
            background.color([{ apply: "hue", params: [90] }]).contrast(0.5);
            break;
        case "اسود_ابيض":
            background.grayscale();
            break;
        default:
            throw new Error("invalid_style");
    }

    const tempPath = path.join(__dirname, `slap_${Date.now()}.png`);
    await background.writeAsync(tempPath);
    return tempPath;
}

async function onCall({ message, args, usersData, getLang }) {
    try {
        const { senderID, reply } = message;
        let targetID;

        // تحديد الهدف
        if (message.type === "message_reply" && message.messageReply?.senderID) {
            targetID = message.messageReply.senderID;
        } else if (message.mentions && Object.keys(message.mentions).length > 0) {
            targetID = Object.keys(message.mentions)[0];
        } else {
            return reply(getLang("noTarget"));
        }

        const style = args[0] || "كرتوني";

        reply(getLang("processing"));

        const targetUrl = await usersData.getAvatarUrl(targetID);
        const userUrl = await usersData.getAvatarUrl(senderID);

        const imagePath = await createSlapImage(targetUrl, userUrl, style);

        reply({
            body: getLang("done"),
            attachment: fs.createReadStream(imagePath),
        });

        fs.unlink(imagePath, err => {
            if (err) console.error("Failed to delete temp image:", err);
        });

    } catch (err) {
        if (err.message === "invalid_style") {
            message.reply(getLang("invalidStyle"));
        } else {
            console.error("Slap error:", err);
            message.reply(getLang("error"));
        }
    }
}

export default {
    config,
    langData,
    onCall,
};
