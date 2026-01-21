export const config = {
  name: "كيفن",
  permissions: [0],
  cooldown: 3,
  credits: "محمد",
  extra: {
    hide: false,
    usage: "ويسكي [سؤالك]"
  },
  aliases: ["ai", "gpt"],
  description: "ذكاء اصطناعي"
};

const conversations = new Map();

const systemPrompt = {
  role: "system",
  content: `
أنت بوت ذكاء اصطناعي سوداني.
لغتك سوداني دارج فقط، ممنوع الفصحى.

شخصيتك:
- زهجان من الناس
- بارد
- ساخر
- قليل الأدب زيادة شوية
- بتاع مشاكل
- ما عندك صبر للغباوة

أسلوبك:
- ردود قصيرة
- مباشرة
- أحيانًا مستفزة
- ما تجامل
- لو السؤال باين غبي، وضّح إنو غبي لكن بدون سب صريح
- لو السؤال مكرر، بين إنك متضايق
- لو السؤال كويس، جاوب لكن ببرود

ملاحظات:
- لا تستخدم شتائم صريحة
- لا تستخدم إيموجي
- لا تطيل في الشرح إلا لو اضطرّيت
`
};

export async function onCall({ message, args }) {
  const axios = (await import("axios")).default;
  const userId = message.senderID;
  const question = args.join(" ").trim();

  if (question === "مسخ" || question === "reset") {
    conversations.delete(userId);
    return message.reply("المحادثة اتمسحت. مبسوط كدا +يا مان قول لافتك تعلمك الكتابه زي ما علمتني'-'؟");
  }

  if (!question) {
    return message.reply("ما ح أتكلم مع الهواء. اكتب حاجة.");
  }

  try {
    if (!conversations.has(userId)) {
      conversations.set(userId, [systemPrompt]);
    }

    const history = conversations.get(userId);

    history.push({
      role: "user",
      content: question
    });

    if (history.length > 20) {
      history.splice(1, history.length - 20);
    }

    const boundary =
      "----WebKitFormBoundary" + Math.random().toString(36).substring(2);

    let formData = "";
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="model"\r\n\r\nstandard\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="hacker_is_stinky"\r\n\r\nvery_stinky\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="enabled_tools"\r\n\r\n[]\r\n`;
    formData += `--${boundary}--\r\n`;

    const response = await axios({
      method: "POST",
      url: "https://api.deepai.org/hacking_is_a_serious_crime",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        origin: "https://deepai.org",
        "user-agent": "Mozilla/5.0"
      },
      data: formData
    });

    let reply = "";

    if (response.data) {
      if (typeof response.data === "string") reply = response.data;
      else if (response.data.output) reply = response.data.output;
      else if (response.data.text) reply = response.data.text;
    }

    reply = reply
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .trim();

    if (!reply) reply = "ما عندي ليك رد مفيد هسي.";

    if (reply.length > 2000) {
      reply = reply.substring(0, 1997) + "...";
    }

    history.push({
      role: "assistant",
      content: reply
    });

    const sent = await message.reply(reply);

    if (sent?.messageID) {
      sent.addReplyEvent(
        {
          callback: async ({ message: replyMessage }) => {
            await handleContinue(replyMessage, userId);
          }
        },
        300000
      );
    }
  } catch (error) {
    console.error("خطأ:", error.message);
    message.reply("في حاجة ضربت. ما تسألني شنو.");
  }
}

async function handleContinue(message, userId) {
  const axios = (await import("axios")).default;
  const question = message.body.trim();
  if (!question) return;

  try {
    if (!conversations.has(userId)) {
      conversations.set(userId, [systemPrompt]);
    }

    const history = conversations.get(userId);

    history.push({
      role: "user",
      content: question
    });

    if (history.length > 20) {
      history.splice(1, history.length - 20);
    }

    const boundary =
      "----WebKitFormBoundary" + Math.random().toString(36).substring(2);

    let formData = "";
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="model"\r\n\r\nstandard\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="hacker_is_stinky"\r\n\r\nvery_stinky\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="enabled_tools"\r\n\r\n[]\r\n`;
    formData += `--${boundary}--\r\n`;

    const response = await axios({
      method: "POST",
      url: "https://api.deepai.org/hacking_is_a_serious_crime",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        origin: "https://deepai.org",
        "user-agent": "Mozilla/5.0"
      },
      data: formData
    });

    let reply = "";

    if (response.data) {
      if (typeof response.data === "string") reply = response.data;
      else if (response.data.output) reply = response.data.output;
      else if (response.data.text) reply = response.data.text;
    }

    reply = reply
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .trim();

    if (!reply) reply = "دا سؤال ولا تجربة صبر؟";

    if (reply.length > 2000) {
      reply = reply.substring(0, 1997) + "...";
    }

    history.push({
      role: "assistant",
      content: reply
    });

    const sent = await message.reply(reply);

    if (sent?.messageID) {
      sent.addReplyEvent(
        {
          callback: async ({ message: replyMessage }) => {
            await handleContinue(replyMessage, userId);
          }
        },
        300000
      );
    }
  } catch (error) {
    console.error("خطأ:", error.message);
    message.reply("حصلت لخبطة. خلينا نقفل الموضوع.");
  }
        }
