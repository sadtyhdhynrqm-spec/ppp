const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const OSS = require('ali-oss');

const langData = {
    "en_US": {
        "magic.wait": "⏳ جاري المعالجة...",
        "magic.noreply": "❌ يرجى الرد على صورة لإجراء التعديل.",
        "magic.noprompt": "❌ يرجى كتابة وصف التعديل بعد الأمر.",
        "magic.success": "🚀 تم الانتهاء! رابط الصورة المعدلة:",
        "magic.error": "❌ حدث خطأ أثناء توليد الصورة."
    }
};

// إعداد config للأمر حتى يظهر في قائمة الأوامر
const config = {
    name: "تدوير",
    Multi: ["magic"],
    Auth: 0,
    Info: "توليد أو تعديل صورة بالذكاء الاصطناعي بالرد على صورة",
    Class: "AI",
    How: "<رد على صورة> <وصف التعديل>"
};

async function processImage(imageUrl, prompt) {
    const timestamp = Date.now();
    const anonymousId = uuidv4();
    const sboxGuid = Buffer.from(`${timestamp}|${Math.floor(Math.random() * 1000)}|${Math.floor(Math.random() * 1000000000)}`).toString('base64');

    const client = axios.create({
        headers: {
            'Cookie': `anonymous_user_id=${anonymousId}; sbox-guid=${sboxGuid}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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

    const imageStream = await axios.get(imageUrl, { responseType: 'stream' });
    const ossPath = `notegpt/web3in1/${uuidv4()}.jpg`;
    await ossClient.putStream(ossPath, imageStream.data);
    const uploadedUrl = `https://nc-cdn.oss-us-west-1.aliyuncs.com/${ossPath}`;

    const editRes = await client.post('https://notegpt.io/api/v2/images/handle', {
        "image_url": uploadedUrl,
        "user_prompt": prompt,
        "type": 60,
        "model": "google/nano-banana"
    });
    const sessionId = editRes.data.data.session_id;

    let results = [];
    for (let i = 0; i < 30; i++) {
        const statusRes = await client.get(`https://notegpt.io/api/v2/images/status?session_id=${sessionId}`);
        if (statusRes.data.data.status === 'succeeded') {
            results = statusRes.data.data.results.map(r => r.url);
            break;
        }
        await new Promise(r => setTimeout(r, 4000));
    }
    return results;
}

async function onCall({ message, getLang, args }) {
    try {
        // التأكد من الرد على رسالة تحتوي على صورة
        const repliedMessage = message.messageReply;
        if (!repliedMessage || !repliedMessage.attachments || repliedMessage.attachments.length === 0) {
            return message.reply(getLang("magic.noreply"));
        }

        if (!args || args.length === 0) {
            return message.reply(getLang("magic.noprompt"));
        }

        const prompt = args.join(" ");
        const imageUrl = repliedMessage.attachments[0].url; // استخدام الصورة المرفقة في الرد

        message.reply(getLang("magic.wait"));
        const results = await processImage(imageUrl, prompt);

        if (results.length > 0) {
            message.reply(`${getLang("magic.success")}\n${results.join("\n")}`);
        } else {
            message.reply("❌ لم يتم الانتهاء من التعديل في الوقت المحدد.");
        }
    } catch (e) {
        console.error(e);
        message.reply(getLang("magic.error"));
    }
}

export default {
    langData,
    config,
    onCall
};
