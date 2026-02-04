import axios from 'axios';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import OSS from 'ali-oss';
import Jimp from 'jimp';

export const config = {
    name: "تحرش",
    version: "0.0.1-xaviaBot-port",
    permissions: [2],
    credits: "Mirai Team",
    description: "رد على شخص لصفعه مع تعديل AI على الصورة.",
    usage: "تحرشAI (بالرد أو المنشن)",
    cooldowns: 5
};

async function processImageEdit(filePath, prompt) {
    const timestamp = Date.now();
    const anonymousId = uuidv4();
    const sboxGuid = Buffer.from(`${timestamp}|${Math.floor(Math.random()*1000)}|${Math.floor(Math.random()*1000000000)}`).toString('base64');

    const client = axios.create({
        headers: {
            'Cookie': `anonymous_user_id=${anonymousId}; sbox-guid=${sboxGuid}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    });

    const stsRes = await client.get('https://notegpt.io/api/v1/oss/sts-token');
    const stsData = stsRes.data.data;

    const ossClient = new OSS({
        region: 'oss-us-west-1',
        accessKeyId: stsData.AccessKeyId,
        accessKeySecret: stsData.AccessKeySecret,
        stsToken: stsData.SecurityToken,
        bucket: 'nc-cdn'
    });

    const ossPath = `notegpt/web3in1/${uuidv4()}.jpg`;
    await ossClient.put(fs.createReadStream(filePath), ossPath);
    const uploadedUrl = `https://nc-cdn.oss-us-west-1.aliyuncs.com/${ossPath}`;

    const editRes = await client.post('https://notegpt.io/api/v2/images/handle', {
        "image_url": uploadedUrl,
        "user_prompt": prompt,
        "type": 60,
        "model": "google/nano-banana"
    });
    const sessionId = editRes.data.data.session_id;

    for (let i = 0; i < 30; i++) {
        const statusRes = await client.get(`https://notegpt.io/api/v2/images/status?session_id=${sessionId}`);
        if (statusRes.data.data.status === 'succeeded') {
            return statusRes.data.data.results.map(r => r.url);
        }
        await new Promise(r => setTimeout(r, 4000));
    }
    throw new Error("Timeout");
}

export async function onCall({ message, args, usersData, sh }) {
    let targetID;
    if (message.type === "message_reply") {
        targetID = message.messageReply.senderID;
    } else if (Object.keys(message.mentions).length > 0) {
        targetID = Object.keys(message.mentions)[0];
    } else {
        return sh.reply("❌ رد على شخص أو منشنه أولاً.");
    }

    sh.reply("⏳ جاري تجهيز الصورة...");

    const targetUrl = await usersData.getAvatarUrl(targetID);
    const userUrl = await usersData.getAvatarUrl(message.senderID);

    const background = new Jimp({ width: 1440, height: 720, color: 0xffffffff });
    const image1 = await Jimp.read(targetUrl);
    const image2 = await Jimp.read(userUrl);

    image1.cover(720, 720);
    image2.cover(720, 720);
    background.composite(image1, 0, 0);
    background.composite(image2, 720, 0);

    const cachePath = "./cache/slap.png";
    await background.writeAsync(cachePath);

    try {
        const editedImages = await processImageEdit(cachePath, "اجعلها كرتونية ومرحة");
        sh.str("🚀 الصورة جاهزة:", editedImages[0]);
    } catch (err) {
        sh.reply("❌ حصل خطأ أثناء تعديل الصورة.");
    }
}
