import Jimp from "jimp";

const langData = {
  "en_US": {
    "processing": "⏳ جاري تجهيز الصورة...",
    "no_target": "❌ رد على شخص أو منشنه أولاً.",
    "done": "🚀 الصورة جاهزة:",
    "invalid_style": "❌ النمط غير موجود، استخدم: كرتوني | مضحك | اسود_ابيض"
  }
};

async function downloadImage(url) {
  return await Jimp.read(url);
}

async function createSlapImage(targetUrl, userUrl, style) {
  const image1 = await downloadImage(targetUrl);
  const image2 = await downloadImage(userUrl);

  image1.cover(720, 720);
  image2.cover(720, 720);

  const background = new Jimp(1440, 720, 0xffffffff);
  background.composite(image1, 0, 0);
  background.composite(image2, 720, 0);

  // تطبيق الأنماط
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

  return await background.getBufferAsync(Jimp.MIME_PNG);
}

async function onCall({ message, args, usersData, getLang }) {
  let targetID;

  if (message.type === "message_reply") {
    targetID = message.messageReply.senderID;
  } else if (Object.keys(message.mentions).length > 0) {
    targetID = Object.keys(message.mentions)[0];
  } else {
    return message.reply(getLang("no_target"));
  }

  // اختيار النمط، الافتراضي "كرتوني"
  const style = args[0] || "كرتوني";

  message.reply(getLang("processing"));

  try {
    const targetUrl = await usersData.getAvatarUrl(targetID);
    const userUrl = await usersData.getAvatarUrl(message.senderID);

    const buffer = await createSlapImage(targetUrl, userUrl, style);
    message.reply({
      body: getLang("done"),
      attachment: buffer
    });
  } catch (err) {
    if (err.message === "invalid_style") {
      message.reply(getLang("invalid_style"));
    } else {
      console.error(err);
      message.reply("❌ حصل خطأ أثناء تجهيز الصورة.");
    }
  }
}

export default {
  langData,
  onCall
};
