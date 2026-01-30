import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

const config = {
  name: 'ساكورا',
  version: '3.0',
  permissions: 0,
  credits: ' Ꮥ.ᎥᏁᎨᎧᎯᏴᎨᏟᎻᎥᎯᎶᎯ ',
  description: 'مساعد ذكي بشخصية مشة الساخرة بنت راكو',
  commandCategory: 'ai',
  usages: '[نص] (رد على صورة أو أرسل صورة مباشرة)',
  cooldown: 5
};

const memoryPath = path.join(global.mainPath, 'plugins', 'commands', 'ai', 'mshaMemory.json');

function loadMemory() {
  return fs.existsSync(memoryPath)? JSON.parse(fs.readFileSync(memoryPath)): {};
}

function saveMemory(data) {
  fs.writeFileSync(memoryPath, JSON.stringify(data, null, 2));
}

function clearMemory(uid) {
  const memory = loadMemory();
  delete memory[uid];
  saveMemory(memory);
}

async function onCall({ message, args}) {
  const text = args.join(' ').trim();
  const { senderID, attachments, messageReply} = message;

  if (!text) return message.reply("يا عثل كيف اخدمك •-•؟ ");

  let imageUrl = null;
  if (messageReply?.attachments?.[0]?.type === "photo") {
    imageUrl = messageReply.attachments[0].url;
} else if (attachments?.[0]?.type === "photo") {
    imageUrl = attachments[0].url;
}

 const prompt = `
رد على الرسالة دي بأسلوب ظفو، بوت فيلق الأساطير.
ساكورا بيرد وهو زهجان، ساخر، مغرور، وكأنو مجبر يكون هنا.
ردودو قصيرة، باللهجة السودانية، وفيها نغزات ذكية.
لو الرسالة فيها صورة، علّق عليها كأنك شايف نفسك أحسن من الفن ذاتو.
لو فيها كلام، رد عليه كأنك بتقول: "أها، اشتقت لي ولا بس فاضي؟"
ما تشرح شخصيتك، بس تصرف زي ظفو الحقيقي.
ما تستخدم أسلوب رسمي، خليك حاد، سريع، وسوداني عديل.
`;
  const memory = loadMemory();
  memory[senderID] = { active: true};
  saveMemory(memory);

  const apiURL = `https://rapido.zetsu.xyz/api/gemini?chat=${encodeURIComponent(prompt + "\n\n" + text)}&uid=${senderID}${imageUrl? `&imageUrl=${encodeURIComponent(imageUrl)}`: ''}`;

  try {
    const res = await axios.get(apiURL);
    const response = res.data.response;

    await message.reply(response).then(msg => {
      msg.addReplyEvent({ callback: replyHandler, type: "message", senderID});
});
} catch (err) {
    console.error("❌ خطأ في الاتصال بالـ API:", err);
    message.reply("💥 عليهاعبت من كثرة الأسئلة، جرب تاني.");
}
}

async function replyHandler({ eventData, message}) {
  const { body, senderID, attachments, messageReply} = message;
  if (eventData.senderID!== senderID) return;

  const text = body.trim();
  if (!text) return message.reply("يا عثل كيف اخدمك •-•؟ ");

  let imageUrl = null;
  if (messageReply?.attachments?.[0]?.type === "photo") {
    imageUrl = messageReply.attachments[0].url;
} else if (attachments?.[0]?.type === "photo") {
    imageUrl = attachments[0].url;
}

const prompt = `
رد على الرسالة دي بأسلوب ظفو، بوت فيلق الأساطير.
ساكورا بيرد وهو زهجان، ساخر، مغرور، وكأنو مجبر يكون هنا.
ردودو قصيرة، باللهجة السودانية، وفيها نغزات ذكية.
لو الرسالة فيها صورة، علّق عليها كأنك شايف نفسك أحسن من الفن ذاتو.
لو فيها كلام، رد عليه كأنك بتقول: "أها، اشتقت لي ولا بس فاضي؟"
ما تشرح شخصيتك، بس تصرف زي ظفو الحقيقي.
ما تستخدم أسلوب رسمي، خليك حاد، سريع، وسوداني عديل.
`;

  const apiURL = `https://rapido.zetsu.xyz/api/gemini?chat=${encodeURIComponent(prompt + "\n\n" + text)}&uid=${senderID}${imageUrl? `&imageUrl=${encodeURIComponent(imageUrl)}`: ''}`;

  try {
    const res = await axios.get(apiURL);
    const response = res.data.response;

    await message.reply(response).then(msg => {
      msg.addReplyEvent({ callback: replyHandler, type: "message", senderID});
});

    clearMemory(senderID);
} catch (err) {
    console.error("❌ خطأ في الاتصال بالـ API:", err);
    message.reply("💥 وزع تعبت من كثرة الأسئلة، جرب تاني.");
}
}

export default {
  config,
  onCall
};
